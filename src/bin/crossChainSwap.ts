import { initializeIntentEnv } from '../actions/initializeIntentEnv';
import { executeCrossChainSwap } from '../actions/intentActions';

async function main() {
    const env = await initializeIntentEnv();
    await executeCrossChainSwap(env);
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
