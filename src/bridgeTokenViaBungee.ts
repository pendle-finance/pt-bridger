import pc from 'picocolors';
import type { Address, PublicClient, WalletClient } from 'viem';
import { type BungeeApi, BungeeRequestStatus } from './APIs/BungeeApi';
import { approveToken } from './actions/approveToken';
import { confirmOrThrow, debugLog, fmtTokenSymbol, getTokenSymbol, parseAddr, sleep } from './utils/misc';
import { wadToSmallNum } from './utils/wadMath';

export type BridgeTokenViaBungeeParams = {
    fromChainId: number;
    toChainId: number;
    fromToken: Address;
    toToken: Address;
    rawAmount: bigint;
    slippageWad: bigint;
};

export async function bridgeTokenViaBungee(
    bungeeApi: BungeeApi,
    fromClients: { public: PublicClient; wallet: WalletClient },
    toClients: { public: PublicClient },
    params: BridgeTokenViaBungeeParams,
) {
    const acc = fromClients.wallet.account;
    if (!acc) throw new Error('Wallet account not found');

    console.log(
        pc.bold(
            'NOTICE. Bungee quotes are typically valid for 60 seconds. When the quote expires, this script will re-fetch the quotes and re-prompt you again.',
        ),
    );

    if (bungeeApi.isPublicApi()) {
        console.log('Using Bungee Public API');
    } else {
        console.log('Using Bungee Dedeciated API with api key');
    }

    const fromTokenSymbol = await getTokenSymbol(fromClients.public, params.fromToken);
    const toTokenSymbol = await getTokenSymbol(toClients.public, params.toToken);

    try {
        console.group(pc.bold(`## Calling Bungee API for bridging token`));
        console.log(`From ${fmtTokenSymbol(fromTokenSymbol, params.fromToken)} on ${params.fromChainId}`);
        console.log(`  To ${fmtTokenSymbol(toTokenSymbol, params.toToken)} on ${params.toChainId}`);

        let requestHash: string;
        while (true) {
            const MAX_VALID_TIME_ms = 50_000; // 50 seconds to be strictly valid
            const validUntil = Date.now() + MAX_VALID_TIME_ms;

            const quoteParams = {
                originChainId: params.fromChainId.toString(),
                destinationChainId: params.toChainId.toString(),
                inputToken: params.fromToken,
                outputToken: params.toToken,
                inputAmount: params.rawAmount.toString(),
                userAddress: acc.address,
                receiverAddress: acc.address,
                // because bungee accepts percent
                slippage: (wadToSmallNum(params.slippageWad) * 100).toString(),
            };
            debugLog('Bungee quote params', quoteParams);
            const quoteRes = await bungeeApi.getQuoteAutoRoutePermit2(quoteParams);
            debugLog('Bungee quote response', quoteRes);

            console.log('Input amount       : ', params.rawAmount);
            console.log('Output amount      : ', quoteRes.fullResponse.result?.autoRoute.output.amount);
            console.log('Slippage           : ', wadToSmallNum(params.slippageWad));
            if (!quoteRes.signTypedData || !quoteRes.witness)
                throw new Error('Can not sign Permite2 for bungee: missing signTypedData or witness');

            if (quoteRes.approvalData) {
                try {
                    console.group(pc.bold(`## Approval required`));
                    const spender =
                        quoteRes.approvalData.spenderAddress === '0'
                            ? ('0x000000000022D473030F116dDEE9F6B43aC78BA3' as const) // Permit2 default
                            : parseAddr(quoteRes.approvalData.spenderAddress);

                    const approvalStatus = await approveToken(fromClients, {
                        token: parseAddr(quoteRes.approvalData.tokenAddress),
                        rawAmount: BigInt(quoteRes.approvalData.amount),
                        spender,
                    });

                    switch (approvalStatus) {
                        case 'NOT_ENOUGH_BALANCE':
                            throw new Error('Balance is not enough');
                        case 'ALREADY_APPROVED':
                            console.log('Already approved');
                            break;
                        case 'CANCELLED':
                            throw new Error('Transaction cancelled');
                        case 'SUCCESS':
                            console.log('Approval successful!');
                            break;
                        default:
                            approvalStatus satisfies never;
                    }
                } finally {
                    console.groupEnd();
                }
            }

            console.group(pc.bold('### Permit2 signing'));
            console.log('Domain:', quoteRes.signTypedData.domain);
            console.log('Message to sign:');
            console.dir(quoteRes.signTypedData.values, { depth: null });
            await confirmOrThrow('Confirm Permit2 signing?', 'Permit2 signing cancelled');

            //
            // biome-ignore-start lint/suspicious/noExplicitAny: unsafe cast here since data is from the Bungee server.
            // tho this code follows bungee example: https://docs.bungee.exchange/bungee-api/integration-guides/auto-erc20-permit2#step-3-sign-and-submit-the-request
            const userSignature = await acc.signTypedData?.({
                types: quoteRes.signTypedData.types as any,
                primaryType: 'PermitWitnessTransferFrom',
                message: quoteRes.signTypedData.values as any,
                domain: quoteRes.signTypedData.domain as any,
            });
            // biome-ignore-end lint/suspicious/noExplicitAny: unsafe cast here since data is from the Bungee server.

            if (!userSignature) throw new Error('Fatal: can not sign permit2');

            if (Date.now() > validUntil) {
                console.warn(`Bungee quote is about to be expired! Refetching quotes...`);
                continue;
            }

            console.log('Submitting signed request...');
            const submitResult = await bungeeApi.submitSignedRequest({
                requestType: quoteRes.requestType,
                request: quoteRes.witness,
                quoteId: quoteRes.quoteId,
                userSignature,
            });
            requestHash = submitResult.requestHash;
            console.log('Request Hash:', requestHash);

            break;
        }

        console.log('Polling request status...');
        console.log(`See live status on Socket scanner: https://www.socketscan.io/tx/${requestHash}`);

        let delivered = false;
        let waitTime = 5000;
        while (!delivered) {
            await sleep(waitTime);
            waitTime = Math.min(Math.floor(waitTime * 1.5), 15_000);

            const status = await bungeeApi.getRequestStatus({ requestHash });
            console.log(`Transaction status: ${pc.yellow(BungeeRequestStatus[status])} (Sleep for ${waitTime}ms)`);
            switch (status) {
                case BungeeRequestStatus.SETTLED:
                case BungeeRequestStatus.FULFILLED:
                    delivered = true;
                    console.log(pc.green('Bungee bridge fulfilled!'));
                    break;
                case BungeeRequestStatus.PENDING:
                case BungeeRequestStatus.ASSIGNED:
                case BungeeRequestStatus.EXTRACTED:
                    // do nothing, just wait
                    break;
                case BungeeRequestStatus.CANCELLED:
                case BungeeRequestStatus.EXPIRED:
                case BungeeRequestStatus.REFUNDED:
                    throw new Error(`Transaction status: ${pc.yellow(BungeeRequestStatus[status])}`);
                default:
                    status satisfies never;
            }
        }
    } finally {
        console.groupEnd();
    }
}
