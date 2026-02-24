import { initializeEnv } from '../actions/initializeEnv';
import pc from 'picocolors';
import { erc20Abi } from 'viem';
import { bridgeTokenViaBungee } from '../bridgeTokenViaBungee';
import { BungeeApi } from '../APIs/BungeeApi';

async function main() {
    const { aClients, bClients, aChainId, bChainId, accAddr, aToken, bToken, slippageWad, bungeeApiKey } =
        await initializeEnv();

    console.log(`Account address: ${pc.yellow(accAddr)}`);
    console.log(pc.bold('NOTICE. This script will transfer ALL tokens of the account. Proceed with caution.'));

    const bTokenBalance =
        ((await bClients.public.readContract({
            abi: erc20Abi,
            address: bToken,
            functionName: 'balanceOf',
            args: [accAddr],
        })) *
            20n) /
        100n;

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
