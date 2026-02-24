import pc from 'picocolors';
import { initializeEnv } from '../actions/initializeEnv.ts';
import { getOftToken } from '../bridgePt.ts';
import { pendleSwapPtToToken } from '../pendleSwapPtToToken';

async function main() {
    const { accAddr, bClients, bOft, bToken, rawAmount, slippageWad } = await initializeEnv();

    console.log(`Account address: ${pc.yellow(accAddr)}`);

    await pendleSwapPtToToken(bClients, {
        fromPt: await getOftToken(bClients.public, bOft),
        rawAmount,
        toToken: bToken,
        slippageWad,
    });
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
