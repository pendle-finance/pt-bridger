import pc from 'picocolors';
import { initializeEnv } from '../actions/initializeEnv.ts';
import { bridgePt } from '../bridgePt.ts';

async function main() {
    const { lzMetadata, aClients, bChainId, accAddr, aOft, rawAmount, slippageWad } = await initializeEnv();
    console.log(`Account address: ${pc.yellow(accAddr)}`);

    await bridgePt(lzMetadata, aClients, {
        fromOft: aOft,
        rawAmount: rawAmount,
        toChainId: bChainId,
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
