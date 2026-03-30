import pc from 'picocolors';
import { zeroAddress } from 'viem';
import * as CrossChainSwapApi from '../APIs/PendleCrossChainSwapApi';
import { initializeIntentEnv } from '../actions/initializeIntentEnv';
import { challengeAndSign, computeIntentHash, depositStep, pollAndHandleLoop } from '../actions/intentActions';
import type { SimulateCrossChainSwapResponse } from '../types/PendleCrossChainSwapApiTypes';
import { confirmOrThrow, fmtTokenSymbol, getBalanceOf, getTokenSymbol, parseAddr } from '../utils/misc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function main() {
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
        ctx,
    } = await initializeIntentEnv();

    async function simulateWithStalenessCheck(): Promise<SimulateCrossChainSwapResponse> {
        while (true) {
            console.log('Fetching simulation...');
            const sim = await CrossChainSwapApi.simulateCrossChainSwap(pendleApiBaseUrl, hubChainId, hubMarket, {
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
            return sim;
        }
    }

    // -----------------------------------------------------------------------
    // Flow
    // -----------------------------------------------------------------------

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
        sim = await simulateWithStalenessCheck();
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
        challengeResult = await challengeAndSign(ctx, 'SUBMIT_INTENT', intentHash, srcChainId);
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
            ctx,
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
    await pollAndHandleLoop(ctx, intent);
}

if (require.main === module) {
    main()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
