import { type Address, createPublicClient, createWalletClient, http, type PublicClient, type WalletClient } from 'viem';
import { type PrivateKeyAccount, privateKeyToAccount } from 'viem/accounts';
import { getEnv, getEnvAddress, getEnvBigInt, getEnvHex, getEnvNumber } from '../utils/env';
import type { IntentEnvContext } from './intentActions';

export async function initializeIntentEnv(): Promise<{
    account: PrivateKeyAccount;
    accAddr: Address;
    srcChainId: number;
    hubChainId: number;
    dstChainId: number;
    hubMarket: Address;
    srcTokenIn: Address;
    dstTokenOut: Address;
    rawAmount: bigint;
    slippage: number;
    bridgeRoutePriority: 'BEST_RETURN' | 'FASTEST';
    pendleApiBaseUrl: string | undefined;
    srcClients: { public: PublicClient; wallet: WalletClient };
    hubClients: { public: PublicClient; wallet: WalletClient };
    dstClients: { public: PublicClient; wallet: WalletClient };
    getClientsByChainId: (chainId: number) => { public: PublicClient; wallet: WalletClient };
    ctx: IntentEnvContext;
}> {
    const account = privateKeyToAccount(getEnvHex('PRIVATE_KEY'));
    const accAddr = account.address;

    const srcTransport = http(getEnv('SOURCE_RPC_URL'));
    const hubTransport = http(getEnv('HUB_RPC_URL'));
    const dstTransport = http(getEnv('DESTINATION_RPC_URL'));

    const srcClients = {
        public: createPublicClient({ transport: srcTransport }),
        wallet: createWalletClient({ account, transport: srcTransport }),
    };
    const hubClients = {
        public: createPublicClient({ transport: hubTransport }),
        wallet: createWalletClient({ account, transport: hubTransport }),
    };
    const dstClients = {
        public: createPublicClient({ transport: dstTransport }),
        wallet: createWalletClient({ account, transport: dstTransport }),
    };

    const srcChainId = await srcClients.public.getChainId();
    const hubChainId = await hubClients.public.getChainId();
    const dstChainId = await dstClients.public.getChainId();
    const hubMarket = getEnvAddress('HUB_MARKET');
    const srcTokenIn = getEnvAddress('SOURCE_TOKEN_IN');
    const dstTokenOut = getEnvAddress('DESTINATION_TOKEN_OUT');
    const rawAmount = getEnvBigInt('RAW_AMOUNT');
    const slippage = getEnvNumber('SLIPPAGE');
    const rawPriority = process.env.BRIDGE_ROUTE_PRIORITY ?? 'BEST_RETURN';
    if (rawPriority !== 'BEST_RETURN' && rawPriority !== 'FASTEST') {
        throw new Error(`Invalid BRIDGE_ROUTE_PRIORITY "${rawPriority}". Expected BEST_RETURN or FASTEST.`);
    }
    const bridgeRoutePriority = rawPriority;
    const pendleApiBaseUrl = process.env.PENDLE_API_BASE_URL;

    function getClientsByChainId(chainId: number) {
        if (chainId === srcChainId) return srcClients;
        if (chainId === hubChainId) return hubClients;
        if (chainId === dstChainId) return dstClients;
        throw new Error(
            `Unexpected chainId ${chainId}. Expected ${srcChainId} (source), ${hubChainId} (hub), or ${dstChainId} (destination).`,
        );
    }

    return {
        account,
        accAddr,
        srcChainId,
        hubChainId,
        dstChainId,
        hubMarket,
        srcTokenIn,
        dstTokenOut,
        rawAmount,
        slippage,
        bridgeRoutePriority,
        pendleApiBaseUrl,
        srcClients,
        hubClients,
        dstClients,
        getClientsByChainId,
        ctx: { account, accAddr, pendleApiBaseUrl, getClientsByChainId },
    };
}
