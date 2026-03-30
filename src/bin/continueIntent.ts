import { initializeIntentEnv } from '../actions/initializeIntentEnv';
import { continueFromIntent } from '../actions/intentActions';

async function main() {
    const intentId = process.argv[2];
    if (intentId === undefined) {
        throw new Error('Usage: yarn continue-intent <intentId>');
    }

    const { pendleApiBaseUrl, ctx } = await initializeIntentEnv();
    await continueFromIntent(ctx, pendleApiBaseUrl, intentId);
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
