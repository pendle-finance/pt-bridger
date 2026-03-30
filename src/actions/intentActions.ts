import select from '@inquirer/select';
import pc from 'picocolors';
import { type Address, encodeAbiParameters, encodeFunctionData, erc20Abi, keccak256, zeroAddress } from 'viem';
import * as CrossChainSwapApi from '../APIs/PendleCrossChainSwapApi';
import type {
    IntentResponse,
    OverallIntentState,
    SimulateCrossChainSwapResponse,
} from '../types/PendleCrossChainSwapApiTypes';
import {
    confirmOrThrow,
    debugLog,
    fmtTokenSymbol,
    getBalanceOf,
    getTokenSymbol,
    parseAddr,
    sleep,
} from '../utils/misc';
import type { IntentEnv } from './initializeIntentEnv';

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

function computeIntentHashFromIntent(intent: IntentResponse): string {
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

async function challengeAndSign(
    env: IntentEnv,
    action: 'SUBMIT_INTENT' | 'CANCEL_INTENT' | 'RETRY_INTENT',
    intentHash: string,
    chainId: number,
): Promise<{ challengeId: string; signature: string }> {
    const clients = env.getClientsByChainId(chainId);
    const challenge = await CrossChainSwapApi.generateChallenge(env.pendleApiBaseUrl, {
        address: env.accAddr,
        chainId,
        action,
        intentHash,
    });

    console.log(`Challenge message:`);
    console.log();
    console.log(pc.gray(challenge.message));
    console.log();

    await confirmOrThrow('Sign this message?', 'User rejected signing');
    const signature = await clients.wallet.signMessage({ account: env.account, message: challenge.message });
    debugLog(`Signature: ${signature}`);

    return { challengeId: challenge.id, signature };
}

async function depositStep(
    env: IntentEnv,
    depositBoxAddress: Address,
    amount: bigint,
    token: Address,
    chainId: number,
) {
    const clients = env.getClientsByChainId(chainId);
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
        ? { from: env.accAddr, to: depositBoxAddress, value: amount, data: '0x' as const }
        : {
              from: env.accAddr,
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

    const hash = await clients.wallet.sendTransaction({ ...populatedTx, account: env.account, chain: null });
    console.log(`Tx hash: ${pc.cyan(hash)}`);
    const receipt = await clients.public.waitForTransactionReceipt({ hash });
    console.log(`Confirmed in block ${receipt.blockNumber}`);
    console.log();
}

async function pollIntent(pendleApiBaseUrl: string | undefined, intentId: string): Promise<IntentResponse> {
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

async function handleFailure(intent: IntentResponse): Promise<'retry' | 'cancel' | 'exit'> {
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

async function handleTerminalState(env: IntentEnv, intent: IntentResponse): Promise<boolean> {
    if (intent.overallState === 'completed' || intent.overallState === 'refunded') {
        const receivedAmount = intent.withdrawalOutput ?? '-';
        const receivedToken = intent.fundData.token;
        const receivedChain = intent.fundData.chainId;
        const isNativeReceived = receivedToken.toLowerCase() === zeroAddress;
        const receivedSymbol = isNativeReceived
            ? 'NATIVE TOKEN'
            : await getTokenSymbol(env.getClientsByChainId(receivedChain).public, parseAddr(receivedToken));

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

// ---------------------------------------------------------------------------
// Public flows
// ---------------------------------------------------------------------------

export async function continueFromIntent(env: IntentEnv, intentId: string): Promise<void> {
    console.log(`Fetching intent ${pc.green(intentId)}...`);
    let intent = await CrossChainSwapApi.getIntent(env.pendleApiBaseUrl, intentId);

    console.log(`Intent ID:      ${pc.green(intent.intentId)}`);
    console.log(`Status:         ${pc.cyan(intent.status)}`);
    console.log(`OverallState:   ${pc.yellow(intent.overallState.toUpperCase())}`);
    console.log();

    if (await handleTerminalState(env, intent)) return;

    if (intent.overallState === 'awaiting_deposit') {
        console.group(pc.bold('== Deposit =='));
        try {
            const fundData = intent.fundData;
            await depositStep(
                env,
                parseAddr(intent.depositBoxAddress),
                BigInt(fundData.amount),
                parseAddr(fundData.token),
                fundData.chainId,
            );
            console.log('Confirming deposit with backend...');
            intent = await CrossChainSwapApi.confirmDeposit(env.pendleApiBaseUrl, intent.intentId);
            console.log(pc.green('Deposit confirmed.'));
            console.log(
                `Status: ${pc.cyan(intent.status)}  OverallState: ${pc.yellow(intent.overallState.toUpperCase())}`,
            );
        } finally {
            console.groupEnd();
        }
        console.log();
    }

    await pollAndHandleLoop(env, intent);
}

const QUOTE_STALENESS_MS = 15_000;

function displaySimulation(sim: SimulateCrossChainSwapResponse) {
    const out = sim.simulateOutput;
    const pct = (v: number) => `${(v * 100).toFixed(4)}%`;
    console.log(`Action type:        ${pc.cyan(sim.actionType)}`);
    console.log(`Slippage:           ${pct(sim.slippage)}`);
    console.log(`Price impact:       ${pct(sim.priceImpact)}`);
    const minOutputBn = BigInt(out.minOutput);
    const expectedOutput = (minOutputBn * 1_000_000n) / BigInt(Math.round((1 - sim.slippage) * 1_000_000));
    console.log(`Expected output:    ${expectedOutput}`);
    console.log(`Min output:         ${pc.yellow(out.minOutput)}`);
    console.log(`Implied APY:        ${pct(out.currentImpliedApy)} -> ${pct(out.newImpliedApy)}`);
    if (out.effectiveApy !== undefined) {
        console.log(`Effective APY:      ${pct(out.effectiveApy)}`);
    }
    console.log(`Fees (USD):         ${out.fee.tradingFee + out.fee.bridgeFee + out.fee.gasFee}`);
    console.log(`Time est (s):       ${out.totalTimeEstimate.totalEstimate_s}`);
    console.log(`Deposit box:        ${sim.depositBox.address} (id: ${sim.depositBox.id})`);
    console.log(`Expect gas top-up:  ${sim.expectGasTopUp}`);
}

export async function executeCrossChainSwap(env: IntentEnv): Promise<void> {
    const {
        accAddr,
        srcChainId,
        hubChainId,
        dstChainId,
        hubMarket,
        srcTokenIn,
        dstTokenOut,
        rawAmount,
        slippage,
        bridgeRoutePriority,
        pendleApiBaseUrl,
        srcClients,
        dstClients,
    } = env;

    const isNativeTokenIn = srcTokenIn.toLowerCase() === zeroAddress;
    const isNativeTokenOut = dstTokenOut.toLowerCase() === zeroAddress;
    const [tokenInSymbol, tokenOutSymbol, tokenInBalance] = await Promise.all([
        isNativeTokenIn ? Promise.resolve('NATIVE TOKEN') : getTokenSymbol(srcClients.public, srcTokenIn),
        isNativeTokenOut ? Promise.resolve('NATIVE TOKEN') : getTokenSymbol(dstClients.public, dstTokenOut),
        isNativeTokenIn
            ? srcClients.public.getBalance({ address: accAddr })
            : getBalanceOf(srcClients.public, srcTokenIn, accAddr),
    ]);

    console.log();
    console.log(`Account:    ${pc.yellow(accAddr)}`);
    console.log(`Chains:     source=${srcChainId}  hub=${hubChainId}  destination=${dstChainId}`);
    console.log(`Token in:   ${fmtTokenSymbol(tokenInSymbol, srcTokenIn)}`);
    console.log(`Token out:  ${fmtTokenSymbol(tokenOutSymbol, dstTokenOut)}`);
    console.log(`Slippage:   ${slippage}  Priority: ${bridgeRoutePriority}`);
    console.log(`Balance:    ${tokenInBalance}`);
    console.log(`Amount:     ${rawAmount}`);
    console.log();

    // Step 1: Simulate
    console.group(pc.bold('== Simulate =='));
    let sim: SimulateCrossChainSwapResponse;
    try {
        while (true) {
            console.log('Fetching simulation...');
            sim = await CrossChainSwapApi.simulateCrossChainSwap(pendleApiBaseUrl, hubChainId, hubMarket, {
                receiver: accAddr,
                tokenIn: srcTokenIn,
                amountIn: String(rawAmount),
                tokenOut: dstTokenOut,
                fromChainId: srcChainId,
                toChainId: dstChainId,
                slippage,
                bridgeRoutePriority,
            });
            const fetchedAt = Date.now();

            console.log();
            displaySimulation(sim);
            console.log();

            await confirmOrThrow('Proceed with this simulation?', 'User rejected simulation');

            const elapsed = Date.now() - fetchedAt;
            if (elapsed > QUOTE_STALENESS_MS) {
                console.log(pc.yellow(`Quote is stale (${(elapsed / 1000).toFixed(1)}s elapsed). Re-simulating...`));
                continue;
            }
            break;
        }
    } finally {
        console.groupEnd();
    }
    console.log();

    // Step 2: Challenge + Sign
    console.group(pc.bold('== Challenge + Sign =='));
    let challengeResult: { challengeId: string; signature: string };
    try {
        const intentHash = computeIntentHash({
            userAddress: accAddr,
            actionType: sim.actionType,
            depositBoxId: sim.depositBox.id,
            depositBoxAddress: sim.depositBox.address,
            hubChainId,
            fromChainId: srcChainId,
            toChainId: dstChainId,
            marketAddress: hubMarket,
            hubChainPt: sim.hubChainPt,
            tokenIn: srcTokenIn,
            tokenOut: dstTokenOut,
            amountIn: String(rawAmount),
            slippage,
            bridgeRoutePriority,
        });
        challengeResult = await challengeAndSign(env, 'SUBMIT_INTENT', intentHash, srcChainId);
    } finally {
        console.groupEnd();
    }
    console.log();

    // Step 3: Submit Intent
    console.group(pc.bold('== Submit Intent =='));
    let intent = await CrossChainSwapApi.submitIntent(pendleApiBaseUrl, {
        actionType: sim.actionType,
        userAddress: accAddr,
        depositBoxAddress: sim.depositBox.address,
        depositBoxId: sim.depositBox.id,
        marketAddress: hubMarket,
        hubChainPt: sim.hubChainPt,
        hubChainId,
        fromChainId: srcChainId,
        toChainId: dstChainId,
        tokenIn: srcTokenIn,
        amountIn: String(rawAmount),
        tokenOut: dstTokenOut,
        bridgeIOToken: sim.bridgeIOToken,
        slippage,
        bridgeRoutePriority,
        challengeId: challengeResult.challengeId,
        signature: challengeResult.signature,
        expectGasTopUp: sim.expectGasTopUp,
        simulateOutput: sim.simulateOutput,
    });
    console.log(`Intent ID:      ${pc.green(intent.intentId)}`);
    console.log(`Status:         ${pc.cyan(intent.status)}`);
    console.log(`OverallState:   ${pc.yellow(intent.overallState.toUpperCase())}`);
    console.groupEnd();
    console.log();

    // Step 4: Deposit
    console.group(pc.bold('== Deposit =='));
    try {
        const fundData = intent.fundData;
        await depositStep(
            env,
            parseAddr(intent.depositBoxAddress),
            BigInt(fundData.amount),
            parseAddr(fundData.token),
            fundData.chainId,
        );
        console.log('Confirming deposit with backend...');
        intent = await CrossChainSwapApi.confirmDeposit(pendleApiBaseUrl, intent.intentId);
        console.log(pc.green('Deposit confirmed.'));
        console.log(`Status: ${pc.cyan(intent.status)}  OverallState: ${pc.yellow(intent.overallState.toUpperCase())}`);
    } finally {
        console.groupEnd();
    }
    console.log();

    // Step 5: Poll + Failure handling loop
    await pollAndHandleLoop(env, intent);
}

async function pollAndHandleLoop(env: IntentEnv, intent: IntentResponse): Promise<void> {
    let current = intent;
    let challengeResult: { challengeId: string; signature: string };

    while (true) {
        console.group(pc.bold('== Polling Intent Status =='));
        try {
            current = await pollIntent(env.pendleApiBaseUrl, current.intentId);
        } finally {
            console.groupEnd();
        }
        console.log();

        if (await handleTerminalState(env, current)) break;

        // failed
        const action = await handleFailure(current);
        if (action === 'exit') break;

        try {
            const challengeAction = action === 'retry' ? 'RETRY_INTENT' : 'CANCEL_INTENT';
            console.group(pc.bold(`== ${action === 'retry' ? 'Retry' : 'Cancel'}: Challenge + Sign ==`));
            try {
                const retryIntentHash = computeIntentHashFromIntent(current);
                challengeResult = await challengeAndSign(
                    env,
                    challengeAction,
                    retryIntentHash,
                    current.fundData.chainId,
                );
            } finally {
                console.groupEnd();
            }

            if (action === 'retry') {
                console.log('Retrying intent...');
                current = await CrossChainSwapApi.retryIntent(env.pendleApiBaseUrl, current.intentId, {
                    challengeId: challengeResult.challengeId,
                    signature: challengeResult.signature,
                });
            } else {
                console.log('Cancelling intent...');
                current = await CrossChainSwapApi.cancelIntent(env.pendleApiBaseUrl, current.intentId, {
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
            current = await CrossChainSwapApi.getIntent(env.pendleApiBaseUrl, current.intentId);
            console.log(`Status:         ${pc.cyan(current.status)}`);
            console.log(`OverallState:   ${pc.yellow(current.overallState.toUpperCase())}`);
            console.log();
        }
    }
}
