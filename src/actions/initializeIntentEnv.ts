import { type Address, createPublicClient, createWalletClient, http, type PublicClient, type WalletClient } from 'viem';
import { type PrivateKeyAccount, privateKeyToAccount } from 'viem/accounts';
import { getEnv, getEnvAddress, getEnvBigInt, getEnvHex, getEnvNumber } from '../utils/env';

type Clients = { public: PublicClient; wallet: WalletClient };

export type IntentEnvConfig = {
    srcRpcUrl?: string;
    hubRpcUrl?: string;
    dstRpcUrl?: string;
    srcTokenIn?: Address;
    dstTokenOut?: Address;
    hubMarket?: Address;
    rawAmount?: bigint;
    slippage?: number;
    bridgeRoutePriority?: 'BEST_RETURN' | 'FASTEST';
    pendleApiBaseUrl?: string;
};

export type IntentEnv = {
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
    srcClients: Clients;
    hubClients: Clients;
    dstClients: Clients;
    getClientsByChainId: (chainId: number) => Clients;
};

export async function initializeIntentEnv(config?: IntentEnvConfig): Promise<IntentEnv> {
    const account = privateKeyToAccount(getEnvHex('PRIVATE_KEY'));
    const accAddr = account.address;

    const srcTransport = http(config?.srcRpcUrl ?? getEnv('SOURCE_RPC_URL'));
    const hubTransport = http(config?.hubRpcUrl ?? getEnv('HUB_RPC_URL'));
    const dstTransport = http(config?.dstRpcUrl ?? getEnv('DESTINATION_RPC_URL'));

    const srcClients: Clients = {
        public: createPublicClient({ transport: srcTransport }),
        wallet: createWalletClient({ account, transport: srcTransport }),
    };
    const hubClients: Clients = {
        public: createPublicClient({ transport: hubTransport }),
        wallet: createWalletClient({ account, transport: hubTransport }),
    };
    const dstClients: Clients = {
        public: createPublicClient({ transport: dstTransport }),
        wallet: createWalletClient({ account, transport: dstTransport }),
    };

    const srcChainId = await srcClients.public.getChainId();
    const hubChainId = await hubClients.public.getChainId();
    const dstChainId = await dstClients.public.getChainId();
    const hubMarket = config?.hubMarket ?? getEnvAddress('HUB_MARKET');
    const srcTokenIn = config?.srcTokenIn ?? getEnvAddress('SOURCE_TOKEN_IN');
    const dstTokenOut = config?.dstTokenOut ?? getEnvAddress('DESTINATION_TOKEN_OUT');
    const rawAmount = config?.rawAmount ?? getEnvBigInt('RAW_AMOUNT');
    const slippage = config?.slippage ?? getEnvNumber('SLIPPAGE');

    const rawPriority = config?.bridgeRoutePriority ?? process.env.BRIDGE_ROUTE_PRIORITY ?? 'BEST_RETURN';
    if (rawPriority !== 'BEST_RETURN' && rawPriority !== 'FASTEST') {
        throw new Error(`Invalid BRIDGE_ROUTE_PRIORITY "${rawPriority}". Expected BEST_RETURN or FASTEST.`);
    }
    const bridgeRoutePriority = rawPriority;
    const pendleApiBaseUrl = config?.pendleApiBaseUrl ?? process.env.PENDLE_API_BASE_URL;

    function getClientsByChainId(chainId: number): Clients {
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
    };
}
