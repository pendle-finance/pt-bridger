import pc from 'picocolors';
import { bridgePt } from '../bridgePt.ts';
import { initializeEnv } from '../actions/initializeEnv.ts';

async function main() {
    const { lzMetadata, aClients, bChainId, accAddr, aOft, rawAmount } = await initializeEnv();
    console.log(`Account address: ${pc.yellow(accAddr)}`);

    await bridgePt(lzMetadata, aClients, {
        fromOft: aOft,
        rawAmount: rawAmount,
        toChainId: bChainId,
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
