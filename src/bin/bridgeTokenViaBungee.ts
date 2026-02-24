import { initializeEnv } from '../actions/initializeEnv';
import pc from 'picocolors';
import { bridgeTokenViaBungee } from '../bridgeTokenViaBungee';
import { BungeeApi } from '../APIs/BungeeApi';
import { getBalanceOf } from '../utils/misc';

async function main() {
    const { aClients, bClients, aChainId, bChainId, accAddr, aToken, bToken, slippageWad, bungeeApiKey } =
        await initializeEnv();

    console.log(`Account address: ${pc.yellow(accAddr)}`);
    console.log(pc.bold('NOTICE. This script will transfer ALL tokens of the account. Proceed with caution.'));

    const bTokenBalance = await getBalanceOf(bClients.public, bToken, accAddr);

    console.log(`Balance of ${pc.yellow(bToken)}: ${pc.yellow(bTokenBalance.toString())}`);
    const bungeeApi = BungeeApi.create({ apiKey: bungeeApiKey });

    await bridgeTokenViaBungee(bungeeApi, bClients, aClients, {
        fromChainId: bChainId,
        toChainId: aChainId,
        fromToken: bToken,
        toToken: aToken,
        rawAmount: bTokenBalance,
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
