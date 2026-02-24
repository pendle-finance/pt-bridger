import pc from 'picocolors';
import type { Address, PublicClient, WalletClient } from 'viem';
import { pendleConvert } from './APIs/PendleConvertApi.ts';
import { approveToken } from './actions/approveToken.ts';
import type { PendleConvertAPIRequestBody } from './types/PendleConvertAPITypes.ts';
import {
    confirmOrThrow,
    debugLog,
    fmtTokenSymbol,
    getTokenSymbol,
    parseAddr,
    parseHex,
    throwErr,
} from './utils/misc.ts';
import { wadToSmallNum } from './utils/wadMath.ts';

export type PendleSwapPtToTokenParams = {
    fromPt: Address;
    rawAmount: bigint;
    toToken: Address;
    slippageWad: bigint;

    aggregators?: string[] | undefined;
    apiKey?: string | undefined;
};

const PENDLE_ROUTER: Address = '0x888888888889758F76e7103c6CbF23ABbF58F946';

export async function pendleSwapPtToToken(
    clients: { public: PublicClient; wallet: WalletClient },
    params: PendleSwapPtToTokenParams,
) {
    try {
        console.group(pc.bold('## Approvals checking!'));
        const approvalStatus = await approveToken(clients, {
            token: params.fromPt,
            rawAmount: params.rawAmount,
            spender: PENDLE_ROUTER,
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
                console.log('Approval successful');
                break;
            default:
                approvalStatus satisfies never;
        }
    } finally {
        console.groupEnd();
    }

    const chainId = await clients.public.getChainId();
    const reqBody: PendleConvertAPIRequestBody = {
        inputs: [{ token: params.fromPt, amount: params.rawAmount.toString() }],
        outputs: [params.toToken],
        slippage: wadToSmallNum(params.slippageWad),
        enableAggregator: true,
        useLimitOrder: true,
        receiver: clients.wallet.account?.address ?? throwErr('Account not found'),
    };
    if (params.aggregators) reqBody.aggregators = params.aggregators;
    debugLog('Pendle Convert req body: ', reqBody);

    const convertRes = await pendleConvert(chainId, reqBody, params.apiKey ? { apiKey: params.apiKey } : undefined);
    debugLog('Pendle Convert response: ', convertRes);

    const [fromPtSymbol, toTokenSymbol] = await Promise.all([
        getTokenSymbol(clients.public, params.fromPt),
        getTokenSymbol(clients.public, params.toToken),
    ]);
    try {
        console.group(
            pc.bold(
                `## Swapping ${fmtTokenSymbol(fromPtSymbol, params.fromPt)} to ${fmtTokenSymbol(toTokenSymbol, params.toToken)}`,
            ),
        );
        const route = convertRes.routes[0];
        if (!route) throw new Error('Route not found');

        console.log('Amount PT in       :', params.rawAmount);
        console.log('Amount token out   :', route.outputs[0]?.amount);

        console.log(
            'Calling %s.%s',
            route.tx.to === PENDLE_ROUTER ? 'PendleRouter' : route.tx.to,
            route.contractParamInfo.method,
        );
        await confirmOrThrow('Send transaction?', 'Transaction cancelled');
        const txHash = await clients.wallet.sendTransaction({
            chain: null,
            account: clients.wallet.account ?? throwErr('Account not found'),
            to: parseAddr(route.tx.to),
            data: parseHex(route.tx.data),
            value: route.tx.value ? BigInt(route.tx.value) : 0n,
        });
        console.log('Transaction hash:', txHash);
        await clients.public.waitForTransactionReceipt({ hash: txHash });
        console.log(pc.green('Transaction sent succesfully!'));
    } finally {
        console.groupEnd();
    }
}
