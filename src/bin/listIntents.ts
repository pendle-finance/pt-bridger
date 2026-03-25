import pc from 'picocolors';
import { privateKeyToAccount } from 'viem/accounts';
import * as CrossChainSwapApi from '../APIs/PendleCrossChainSwapApi';
import { getEnvHex } from '../utils/env';

async function main() {
    const account = privateKeyToAccount(getEnvHex('PRIVATE_KEY'));
    const pendleApiBaseUrl = process.env.PENDLE_API_BASE_URL;

    const stateFilter = 'PENDING';
    const skip = process.argv[2] !== undefined ? Number(process.argv[2]) : undefined;
    const limit = process.argv[3] !== undefined ? Number(process.argv[3]) : undefined;
    if (skip !== undefined && (Number.isNaN(skip) || skip < 0)) throw new Error(`Invalid skip value: ${process.argv[2]}`);
    if (limit !== undefined && (Number.isNaN(limit) || limit < 0)) throw new Error(`Invalid limit value: ${process.argv[3]}`);

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

    const rows = response.result.map((intent) => ({
        'Intent ID': intent.intentId,
        Action: intent.actionType,
        Status: intent.status,
        'Token In': intent.tokenIn,
        'Amount In': intent.amountIn,
        'Token Out': intent.tokenOut,
        OverallState: intent.overallState.toUpperCase(),
    }));
    console.table(rows);
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
