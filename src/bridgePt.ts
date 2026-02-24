import pc from 'picocolors';
import type { Address, PublicClient, WalletClient } from 'viem';
import { erc20Abi } from 'viem';
import { OFTAbi } from './abis/index.ts';
import { getLzMessageStatusByTxHash, getLzScanUrl, type LZMetadata } from './APIs/LZApi.ts';
import {
    addressToBytes32,
    bytes32ToAddress,
    confirm,
    debugLog,
    fmtTokenSymbol,
    sleep,
    throwErr,
} from './utils/misc.ts';
import { WAD_ONE, wadMul } from './utils/wadMath.ts';
import { approveToken } from './actions/approveToken.ts';

type BridgePtParams = {
    fromOft: Address;
    rawAmount: bigint;
    toChainId: number;
};

/**
 * For Pendle PT, bridging does not have any fee.
 * However, LayerZero only allows bridge an amount with smaller decimals than the actual token (typically 6 decimals).
 * The dust amount is sent back to the specified account.
 *
 * This slippage is used to only cap the dust amount.
 */
const BRIDGE_SLIPPAGE = (WAD_ONE * 5n) / 1000n; // 0.5%

export async function getPeer(
    publicClient: PublicClient,
    lzMetadata: LZMetadata,
    oft: Address,
    chainId: number,
): Promise<{ eid: number; peer: Address }> {
    const eid = lzMetadata.getEidV2ByChainId(chainId) ?? throwErr(`Unknown chain ID ${chainId}`);
    const peer = bytes32ToAddress(
        await publicClient.readContract({
            abi: OFTAbi,
            address: oft,
            functionName: 'peers',
            args: [eid],
        }),
    );
    return { eid, peer };
}

export async function getOftToken(publicClient: PublicClient, oft: Address): Promise<Address> {
    return await publicClient.readContract({
        abi: OFTAbi,
        address: oft,
        functionName: 'token',
    });
}

export async function bridgePt(
    lzMetadata: LZMetadata,
    clients: { public: PublicClient; wallet: WalletClient },
    params: BridgePtParams,
): Promise<
    | {
          txHash: string;
          sentAmount: bigint;
          toOft: Address;
      }
    | undefined
> {
    const { eid: dstEid, peer: toOft } = await getPeer(clients.public, lzMetadata, params.fromOft, params.toChainId);
    const minAmountLD = wadMul(params.rawAmount, BRIDGE_SLIPPAGE);
    const walletAddr = (await clients.wallet.getAddresses())[0] ?? throwErr('No address found');

    const oftWrappedToken = await getOftToken(clients.public, params.fromOft);

    const tokenSymbol = await clients.public.readContract({
        abi: erc20Abi,
        address: oftWrappedToken,
        functionName: 'symbol',
    });

    if (oftWrappedToken !== params.fromOft) {
        console.group(pc.bold('## Approval checking'));
        try {
            const approvalStatus = await approveToken(clients, {
                token: oftWrappedToken,
                spender: params.fromOft,
                rawAmount: params.rawAmount,
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

    console.group(
        pc.bold(
            `## Sending ${fmtTokenSymbol(tokenSymbol, oftWrappedToken)} from ${await clients.public.getChainId()} to ${params.toChainId}`,
        ),
    );

    const sendParams = {
        dstEid,
        to: addressToBytes32(walletAddr),
        amountLD: params.rawAmount,
        minAmountLD,
        extraOptions: '0x',
        composeMsg: '0x',
        oftCmd: '0x',
    } as const;

    const quotedFee = await clients.public.readContract({
        abi: OFTAbi,
        address: params.fromOft,
        functionName: 'quoteSend',
        args: [sendParams, false /* do not use lz token */],
    });

    const balanceBefore = await clients.public.readContract({
        abi: erc20Abi,
        address: oftWrappedToken,
        functionName: 'balanceOf',
        args: [walletAddr],
    });

    console.log('Balance before :', balanceBefore);
    console.log('Send amount    :', params.rawAmount);
    console.log('Native fee     :', quotedFee.nativeFee);

    if (!(await confirm({ message: 'Send bridging transaction?' }))) {
        console.log('Transaction cancelled');
        console.groupEnd();
        return;
    }

    const { request, result } = await clients.public.simulateContract({
        abi: OFTAbi,
        address: params.fromOft,
        functionName: 'send',
        args: [sendParams, quotedFee, /* refund address */ walletAddr],
        value: quotedFee.nativeFee,
        account: clients.wallet.account,
    });
    const txHash = await clients.wallet.writeContract(request);
    await clients.public.waitForTransactionReceipt({ hash: txHash });

    debugLog('Transaction result:', result);
    console.log(pc.green('Bridging transaction successful!'));
    console.groupEnd();

    console.group(pc.bold('## Polling LayerZero bridging transaction status...'));

    console.log('See live status on LayerZero Scan:', getLzScanUrl({ txHash }));

    let numRetry = 3;
    let delivered = false;
    let waitTime = 5000;
    while (!delivered) {
        await sleep(waitTime);
        waitTime = Math.min(Math.floor(waitTime * 1.5), 15_000);

        const status = await getLzMessageStatusByTxHash({ txHash });
        if (!status || status.name == null) {
            console.log(pc.yellow(`Transaction status not found. Retrying... (Sleep for ${waitTime}ms)`));
            numRetry--;
            if (numRetry <= 0) throw new Error('Max retries exceeded. Transaction status not found.');
        } else {
            console.log(
                `Transaction status: ${pc.yellow(status.name ?? '')} ${status.message ?? ''} (Sleep for ${waitTime}ms)`,
            );
            switch (status.name) {
                case 'DELIVERED':
                    delivered = true;
                    console.log(pc.green('LayerZero message delivered!'));
                    break;
                case 'INFLIGHT':
                case 'CONFIRMING':
                    // do nothing, just wait
                    break;
                case 'FAILED':
                case 'BLOCKED':
                case 'PAYLOAD_STORED':
                case 'APPLICATION_BURNED':
                case 'APPLICATION_SKIPPED':
                case 'UNRESOLVABLE_COMMAND':
                case 'MALFORMED_COMMAND':
                    throw new Error(`Transaction status: ${status.name} ${status.message ?? ''}`);
                default:
                    status.name satisfies never;
            }
        }
    }
    console.groupEnd();

    return {
        txHash,
        sentAmount: result[1].amountSentLD,
        toOft,
    };
}
