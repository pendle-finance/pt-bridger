import pc from 'picocolors';
import * as CrossChainSwapApi from '../APIs/PendleCrossChainSwapApi';
import { initializeIntentEnv } from '../actions/initializeIntentEnv';
import { depositStep, handleTerminalState, pollAndHandleLoop } from '../actions/intentActions';
import { parseAddr } from '../utils/misc';

async function main() {
    const intentId = process.argv[2];
    if (intentId === undefined) {
        throw new Error('Usage: yarn continue-intent <intentId>');
    }

    const { pendleApiBaseUrl, ctx } = await initializeIntentEnv();

    // -----------------------------------------------------------------------
    // Flow
    // -----------------------------------------------------------------------

    console.log();
    console.log(`Fetching intent ${pc.green(intentId)}...`);
    console.log();

    let intent = await CrossChainSwapApi.getIntent(pendleApiBaseUrl, intentId);

    console.log(`Intent ID:      ${pc.green(intent.intentId)}`);
    console.log(`Status:         ${pc.cyan(intent.status)}`);
    console.log(`OverallState:   ${pc.yellow(intent.overallState.toUpperCase())}`);
    console.log();

    // If already terminal, handle and exit
    if (await handleTerminalState(ctx, intent)) return;

    // If awaiting deposit, continue from deposit step
    if (intent.overallState === 'awaiting_deposit') {
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
            console.log(
                `Status: ${pc.cyan(intent.status)}  OverallState: ${pc.yellow(intent.overallState.toUpperCase())}`,
            );
        } finally {
            console.groupEnd();
        }
        console.log();
    }

    // Poll + Failure handling loop
    await pollAndHandleLoop(ctx, intent);
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
