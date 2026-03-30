import pc from 'picocolors';
import { BungeeApi } from '../APIs/BungeeApi';
import { initializeEnv } from '../actions/initializeEnv';
import { initializeIntentEnv } from '../actions/initializeIntentEnv';
import { executeCrossChainSwap } from '../actions/intentActions';
import { bridgePt, getOftToken } from '../bridgePt';
import { bridgeTokenViaBungee } from '../bridgeTokenViaBungee';
import { pendleSwapPtToToken } from '../pendleSwapPtToToken';
import { getEnv, getEnvAddress } from '../utils/env';

const usePendleBackend = process.argv.includes('--usePendleBackend');

async function executeDirect() {
    const {
        lzMetadata,
        aClients,
        bClients,
        aChainId,
        bChainId,
        aOft,
        bOft,
        aToken,
        bToken,
        rawAmount,
        slippageWad,
        bungeeApiKey,
        accAddr,
    } = await initializeEnv();

    console.log(`Account address: ${pc.yellow(accAddr)}`);

    let bOftRawAmount: bigint;
    try {
        console.group(pc.bold('== Bridge PT =='));
        const bridgeRes = await bridgePt(lzMetadata, aClients, {
            fromOft: aOft,
            rawAmount: rawAmount,
            toChainId: bChainId,
            slippageWad,
        });
        if (!bridgeRes) throw new Error('Bridge failed');

        bOftRawAmount = bridgeRes.sentAmount;
    } finally {
        console.groupEnd();
    }

    console.log();

    let bTokenAmountToSendBack: bigint;
    try {
        console.group(pc.bold('== Swap PT To Token =='));
        const swapRes = await pendleSwapPtToToken(bClients, {
            fromPt: await getOftToken(bClients.public, bOft),
            rawAmount: bOftRawAmount,
            toToken: bToken,
            slippageWad,
        });

        bTokenAmountToSendBack = swapRes.rawAmountTokenOut;
    } finally {
        console.groupEnd();
    }

    console.log();

    try {
        console.group(pc.bold('== Bridge token back via Bungee =='));

        const bungeeApi = BungeeApi.create({ apiKey: bungeeApiKey });
        await bridgeTokenViaBungee(bungeeApi, bClients, aClients, {
            fromChainId: bChainId,
            toChainId: aChainId,
            fromToken: bToken,
            toToken: aToken,
            rawAmount: bTokenAmountToSendBack,
            slippageWad,
        });
    } finally {
        console.groupEnd();
    }
}

async function executeViaPendleBackend() {
    const env = await initializeIntentEnv({
        srcRpcUrl: getEnv('A_RPC_URL'),
        hubRpcUrl: getEnv('B_RPC_URL'),
        dstRpcUrl: getEnv('A_RPC_URL'),
        srcTokenIn: getEnvAddress('A_OFT'),
        dstTokenOut: getEnvAddress('A_TOKEN'),
        hubMarket: getEnvAddress('B_MARKET'),
    });

    await executeCrossChainSwap(env);
}

const main = usePendleBackend ? executeViaPendleBackend : executeDirect;

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
