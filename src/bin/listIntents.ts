import select from '@inquirer/select';
import pc from 'picocolors';
import { privateKeyToAccount } from 'viem/accounts';
import * as CrossChainSwapApi from '../APIs/PendleCrossChainSwapApi';
import { initializeIntentEnv } from '../actions/initializeIntentEnv';
import { continueFromIntent } from '../actions/intentActions';
import { getEnvHex } from '../utils/env';

async function main() {
    const account = privateKeyToAccount(getEnvHex('PRIVATE_KEY'));
    const pendleApiBaseUrl = process.env.PENDLE_API_BASE_URL;

    const stateFilter = 'PENDING';
    const skip = process.argv[2] !== undefined ? Number(process.argv[2]) : undefined;
    const limit = process.argv[3] !== undefined ? Number(process.argv[3]) : undefined;
    if (skip !== undefined && (Number.isNaN(skip) || skip < 0))
        throw new Error(`Invalid skip value: ${process.argv[2]}`);
    if (limit !== undefined && (Number.isNaN(limit) || limit < 0))
        throw new Error(`Invalid limit value: ${process.argv[3]}`);

    console.log(`Fetching pending intents for ${pc.yellow(account.address)}...`);
    console.log();

    const response = await CrossChainSwapApi.listIntents(pendleApiBaseUrl, {
        userAddress: account.address,
        stateFilter,
        skip,
        limit,
    });

    console.log(`Total: ${response.total}`);
    console.log();

    if (response.result.length === 0) {
        console.log('No intents found.');
        return;
    }

    const choices = response.result.map((intent) => ({
        name: `${intent.intentId} | ${intent.actionType.padEnd(7)} | ${intent.overallState.toUpperCase().padEnd(16)} | ${intent.amountIn} ${intent.tokenIn} -> ${intent.tokenOut}`,
        value: intent.intentId,
    }));

    const selectedIntentId = await select({
        message: 'Select an intent to continue:',
        choices,
    });

    console.log();

    const { ctx } = await initializeIntentEnv();
    await continueFromIntent(ctx, pendleApiBaseUrl, selectedIntentId);
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
