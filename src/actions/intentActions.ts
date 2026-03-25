import select from '@inquirer/select';
import pc from 'picocolors';
import {
    type Address,
    encodeAbiParameters,
    encodeFunctionData,
    erc20Abi,
    keccak256,
    type PublicClient,
    type WalletClient,
    zeroAddress,
} from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';
import * as CrossChainSwapApi from '../APIs/PendleCrossChainSwapApi';
import type { IntentResponse, OverallIntentState } from '../types/PendleCrossChainSwapApiTypes';
import {
    confirmOrThrow,
    debugLog,
    fmtTokenSymbol,
    getBalanceOf,
    getTokenSymbol,
    parseAddr,
    sleep,
} from '../utils/misc';

export const TERMINAL_STATES: ReadonlySet<OverallIntentState> = new Set([
    'completed',
    'refunded',
    'cancelled',
    'failed',
]);

export function computeIntentHash(params: {
    userAddress: string;
    actionType: string;
    depositBoxId: number;
    depositBoxAddress: string;
    hubChainId: number;
    fromChainId: number;
    toChainId: number;
    marketAddress: string;
    hubChainPt: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    slippage: number;
    bridgeRoutePriority: string;
}): string {
    const scaledSlippage = BigInt(Math.round(params.slippage * 1e18));

    const encoded = encodeAbiParameters(
        [
            { type: 'address' },
            { type: 'string' },
            { type: 'uint256' },
            { type: 'address' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'address' },
            { type: 'address' },
            { type: 'address' },
            { type: 'address' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'string' },
        ],
        [
            parseAddr(params.userAddress),
            params.actionType,
            BigInt(params.depositBoxId),
            parseAddr(params.depositBoxAddress),
            BigInt(params.hubChainId),
            BigInt(params.fromChainId),
            BigInt(params.toChainId),
            parseAddr(params.marketAddress),
            parseAddr(params.hubChainPt),
            parseAddr(params.tokenIn),
            parseAddr(params.tokenOut),
            BigInt(params.amountIn),
            scaledSlippage,
            params.bridgeRoutePriority,
        ],
    );

    return keccak256(encoded);
}

export function computeIntentHashFromIntent(intent: IntentResponse): string {
    return computeIntentHash({
        userAddress: intent.userAddress,
        actionType: intent.actionType,
        depositBoxId: intent.depositBoxId,
        depositBoxAddress: intent.depositBoxAddress,
        hubChainId: intent.hubChainId,
        fromChainId: intent.fromChainId,
        toChainId: intent.toChainId,
        marketAddress: intent.marketAddress,
        hubChainPt: intent.hubChainPt,
        tokenIn: intent.tokenIn,
        tokenOut: intent.tokenOut,
        amountIn: intent.amountIn,
        slippage: intent.slippage,
        bridgeRoutePriority: intent.bridgeRoutePriority,
    });
}

export type IntentEnvContext = {
    account: PrivateKeyAccount;
    accAddr: Address;
    pendleApiBaseUrl: string | undefined;
    getClientsByChainId: (chainId: number) => { public: PublicClient; wallet: WalletClient };
};

export async function challengeAndSign(
    ctx: IntentEnvContext,
    action: 'SUBMIT_INTENT' | 'CANCEL_INTENT' | 'RETRY_INTENT',
    intentHash: string,
    chainId: number,
): Promise<{ challengeId: string; signature: string }> {
    const clients = ctx.getClientsByChainId(chainId);
    const challenge = await CrossChainSwapApi.generateChallenge(ctx.pendleApiBaseUrl, {
        address: ctx.accAddr,
        chainId,
        action,
        intentHash,
    });

    console.log(`Challenge message:`);
    console.log();
    console.log(pc.gray(challenge.message));
    console.log();

    await confirmOrThrow('Sign this message?', 'User rejected signing');
    const signature = await clients.wallet.signMessage({ account: ctx.account, message: challenge.message });
    debugLog(`Signature: ${signature}`);

    return { challengeId: challenge.id, signature };
}

export async function depositStep(
    ctx: IntentEnvContext,
    depositBoxAddress: Address,
    amount: bigint,
    token: Address,
    chainId: number,
) {
    const clients = ctx.getClientsByChainId(chainId);
    const isNative = token.toLowerCase() === zeroAddress;
    const tokenSymbol = isNative ? 'NATIVE TOKEN' : await getTokenSymbol(clients.public, token);

    const existingBalance = isNative
        ? await clients.public.getBalance({ address: depositBoxAddress })
        : await getBalanceOf(clients.public, token, depositBoxAddress);

    if (existingBalance >= amount) {
        console.log(pc.green('Deposit box already has sufficient balance. Skipping transfer.'));
        return;
    }

    const txData = isNative
        ? { from: ctx.accAddr, to: depositBoxAddress, value: amount, data: '0x' as const }
        : {
              from: ctx.accAddr,
              to: token,
              value: 0n,
              data: encodeFunctionData({
                  abi: erc20Abi,
                  functionName: 'transfer',
                  args: [depositBoxAddress, amount],
              }),
          };

    const populatedTx = { ...txData, chainId };

    console.log(`Transfer ${amount} ${fmtTokenSymbol(tokenSymbol, token)} to deposit box ${depositBoxAddress}`);
    console.log('Transaction details:');
    console.log();
    console.log(populatedTx);
    console.log();
    await confirmOrThrow('Send deposit transaction?', 'User rejected deposit');

    const hash = await clients.wallet.sendTransaction({ ...populatedTx, account: ctx.account, chain: null });
    console.log(`Tx hash: ${pc.cyan(hash)}`);
    const receipt = await clients.public.waitForTransactionReceipt({ hash });
    console.log(`Confirmed in block ${receipt.blockNumber}`);
    console.log();
}

export async function pollIntent(pendleApiBaseUrl: string | undefined, intentId: string): Promise<IntentResponse> {
    let delayMs = 5_000;
    const MAX_DELAY_MS = 15_000;
    const MAX_POLL_DURATION_MS = 24 * 60 * 60 * 1_000;
    const startTime = Date.now();
    let lastStatus = '';
    let lastOverall = '';

    while (true) {
        if (Date.now() - startTime > MAX_POLL_DURATION_MS) {
            throw new Error('Polling timed out after 24 hours');
        }
        await sleep(delayMs);

        let intent: IntentResponse;
        try {
            intent = await CrossChainSwapApi.getIntent(pendleApiBaseUrl, intentId);
        } catch (err) {
            console.log(pc.yellow(`Poll error (will retry): ${err}`));
            continue;
        }

        if (intent.status !== lastStatus || intent.overallState !== lastOverall) {
            console.log(
                `[${new Date().toLocaleTimeString()}] status=${pc.cyan(intent.status)}  OverallState=${pc.yellow(intent.overallState.toUpperCase())}`,
            );
            lastStatus = intent.status;
            lastOverall = intent.overallState;
        }

        if (TERMINAL_STATES.has(intent.overallState)) {
            return intent;
        }

        delayMs = Math.min(Math.round(delayMs * 1.5), MAX_DELAY_MS);
    }
}

export async function handleFailure(intent: IntentResponse): Promise<'retry' | 'cancel' | 'exit'> {
    console.log(pc.red(`Intent failed. Error: ${intent.errorMessage ?? 'unknown'}`));
    console.log();

    if (!intent.isRetryable && !intent.isCancellable) {
        console.log(pc.red('No actions available. Exiting.'));
        return 'exit';
    }

    type Choice = { name: string; value: 'retry' | 'cancel' };
    const choices: Choice[] = [];
    if (intent.isRetryable) choices.push({ name: 'Retry intent', value: 'retry' });
    if (intent.isCancellable) choices.push({ name: 'Cancel intent', value: 'cancel' });

    return select({ message: 'Choose action:', choices });
}

export async function handleTerminalState(ctx: IntentEnvContext, intent: IntentResponse): Promise<boolean> {
    if (intent.overallState === 'completed' || intent.overallState === 'refunded') {
        const receivedAmount = intent.withdrawalOutput ?? '-';
        const receivedToken = intent.fundData.token;
        const receivedChain = intent.fundData.chainId;
        const isNativeReceived = receivedToken.toLowerCase() === zeroAddress;
        const receivedSymbol = isNativeReceived
            ? 'NATIVE TOKEN'
            : await getTokenSymbol(ctx.getClientsByChainId(receivedChain).public, parseAddr(receivedToken));

        if (intent.overallState === 'completed') {
            console.log(pc.green('Intent completed successfully!'));
        } else {
            console.log(pc.yellow('Intent was refunded.'));
        }
        console.log();
        console.log(
            `Received ${receivedAmount} ${fmtTokenSymbol(receivedSymbol, parseAddr(receivedToken))} on chain ${receivedChain}`,
        );
        console.log(`Tx hash: ${pc.cyan(intent.withdrawalTxHash ?? '-')}`);
        return true;
    }
    if (intent.overallState === 'cancelled') {
        console.log(pc.yellow('Intent was cancelled.'));
        return true;
    }
    return false;
}

export async function pollAndHandleLoop(ctx: IntentEnvContext, intent: IntentResponse): Promise<void> {
    let current = intent;
    let challengeResult: { challengeId: string; signature: string };

    while (true) {
        console.group(pc.bold('== Polling Intent Status =='));
        try {
            current = await pollIntent(ctx.pendleApiBaseUrl, current.intentId);
        } finally {
            console.groupEnd();
        }
        console.log();

        if (await handleTerminalState(ctx, current)) break;

        // failed
        const action = await handleFailure(current);
        if (action === 'exit') break;

        try {
            const challengeAction = action === 'retry' ? 'RETRY_INTENT' : 'CANCEL_INTENT';
            console.group(pc.bold(`== ${action === 'retry' ? 'Retry' : 'Cancel'}: Challenge + Sign ==`));
            try {
                const retryIntentHash = computeIntentHashFromIntent(current);
                challengeResult = await challengeAndSign(
                    ctx,
                    challengeAction,
                    retryIntentHash,
                    current.fundData.chainId,
                );
            } finally {
                console.groupEnd();
            }

            if (action === 'retry') {
                console.log('Retrying intent...');
                current = await CrossChainSwapApi.retryIntent(ctx.pendleApiBaseUrl, current.intentId, {
                    challengeId: challengeResult.challengeId,
                    signature: challengeResult.signature,
                });
            } else {
                console.log('Cancelling intent...');
                current = await CrossChainSwapApi.cancelIntent(ctx.pendleApiBaseUrl, current.intentId, {
                    challengeId: challengeResult.challengeId,
                    signature: challengeResult.signature,
                });
            }
            console.log();
            console.log(`Intent ID:      ${pc.green(current.intentId)}`);
            console.log(`Status:         ${pc.cyan(current.status)}`);
            console.log(`OverallState:   ${pc.yellow(current.overallState.toUpperCase())}`);
            console.log();
        } catch (err) {
            console.log(pc.red(`${action === 'retry' ? 'Retry' : 'Cancel'} failed: ${err}`));
            console.log('Fetching latest intent state...');
            current = await CrossChainSwapApi.getIntent(ctx.pendleApiBaseUrl, current.intentId);
            console.log(`Status:         ${pc.cyan(current.status)}`);
            console.log(`OverallState:   ${pc.yellow(current.overallState.toUpperCase())}`);
            console.log();
        }
    }
}
