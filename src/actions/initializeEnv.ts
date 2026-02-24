import { type Address, createPublicClient, createWalletClient, http, type PublicClient, type WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { fetchLzMetadata, type LZMetadata } from '../APIs/LZApi';
import { getPeer } from '../bridgePt';
import { getEnv, getEnvAddress, getEnvBigInt, getEnvHex, getEnvNumber } from '../utils/env';
import { smallNumToWad } from '../utils/wadMath';

export async function initializeEnv(): Promise<{
    lzMetadata: LZMetadata;
    aClients: {
        public: PublicClient;
        wallet: WalletClient;
    };
    bClients: {
        public: PublicClient;
        wallet: WalletClient;
    };
    aChainId: number;
    bChainId: number;
    accAddr: Address;

    aOft: Address;
    bOft: Address;
    aToken: Address;
    bToken: Address;
    rawAmount: bigint;
    slippageWad: bigint;

    pendleApiKey: string | undefined;
    bungeeApiKey: string | undefined;
}> {
    const lzMetadata = await fetchLzMetadata({ cache: true });
    const aTransport = http(getEnv('A_RPC_URL'));
    const bTransport = http(getEnv('B_RPC_URL'));
    const privKey = getEnvHex('PRIVATE_KEY');
    const account = privateKeyToAccount(privKey);

    const aClients = {
        public: createPublicClient({ transport: aTransport }),
        wallet: createWalletClient({ account, transport: aTransport }),
    };

    const bClients = {
        public: createPublicClient({ transport: bTransport }),
        wallet: createWalletClient({ account, transport: bTransport }),
    };

    const accAddr = account.address;
    const aChainId = await aClients.public.getChainId();
    const bChainId = await bClients.public.getChainId();
    const aToken = getEnvAddress('A_TOKEN');
    const bToken = getEnvAddress('B_TOKEN');
    const aOft = getEnvAddress('A_OFT');
    const { peer: bOft } = await getPeer(aClients.public, lzMetadata, getEnvAddress('A_OFT'), bChainId);
    const rawAmount = getEnvBigInt('RAW_AMOUNT');
    const slippageWad = smallNumToWad(getEnvNumber('SLIPPAGE'));

    const pendleApiKey = process.env.PENDLE_API_KEY;
    const bungeeApiKey = process.env.BUNGEE_API_KEY;

    return {
        lzMetadata,
        accAddr,
        aClients,
        bClients,
        aChainId,
        bChainId,
        aOft,
        bOft,
        bToken,
        aToken,
        rawAmount,
        slippageWad,

        pendleApiKey,
        bungeeApiKey,
    };
}
