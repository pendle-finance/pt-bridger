import { type Address, createPublicClient, createWalletClient, http, type PublicClient, type WalletClient } from 'viem';
import { type PrivateKeyAccount, privateKeyToAccount } from 'viem/accounts';
import type { IntentEnvContext } from './intentActions';
import { getEnv, getEnvAddress, getEnvBigInt, getEnvHex, getEnvNumber } from '../utils/env';

export async function initializeIntentEnv(): Promise<{
    account: PrivateKeyAccount;
    accAddr: Address;
    aChainId: number;
    bChainId: number;
    cChainId: number;
    bMarket: Address;
    aTokenIn: Address;
    cTokenOut: Address;
    rawAmount: bigint;
    slippage: number;
    bridgeRoutePriority: 'BEST_RETURN' | 'FASTEST';
    pendleApiBaseUrl: string | undefined;
    aClients: { public: PublicClient; wallet: WalletClient };
    bClients: { public: PublicClient; wallet: WalletClient };
    cClients: { public: PublicClient; wallet: WalletClient };
    getClientsByChainId: (chainId: number) => { public: PublicClient; wallet: WalletClient };
    ctx: IntentEnvContext;
}> {
    const account = privateKeyToAccount(getEnvHex('PRIVATE_KEY'));
    const accAddr = account.address;

    const aTransport = http(getEnv('A_RPC_URL'));
    const bTransport = http(getEnv('B_RPC_URL'));
    const cTransport = http(getEnv('C_RPC_URL'));

    const aClients = {
        public: createPublicClient({ transport: aTransport }),
        wallet: createWalletClient({ account, transport: aTransport }),
    };
    const bClients = {
        public: createPublicClient({ transport: bTransport }),
        wallet: createWalletClient({ account, transport: bTransport }),
    };
    const cClients = {
        public: createPublicClient({ transport: cTransport }),
        wallet: createWalletClient({ account, transport: cTransport }),
    };

    const aChainId = await aClients.public.getChainId();
    const bChainId = await bClients.public.getChainId();
    const cChainId = await cClients.public.getChainId();
    const bMarket = getEnvAddress('B_MARKET');
    const aTokenIn = getEnvAddress('A_TOKEN_IN');
    const cTokenOut = getEnvAddress('C_TOKEN_OUT');
    const rawAmount = getEnvBigInt('RAW_AMOUNT');
    const slippage = getEnvNumber('SLIPPAGE');
    const rawPriority = process.env.BRIDGE_ROUTE_PRIORITY ?? 'BEST_RETURN';
    if (rawPriority !== 'BEST_RETURN' && rawPriority !== 'FASTEST') {
        throw new Error(`Invalid BRIDGE_ROUTE_PRIORITY "${rawPriority}". Expected BEST_RETURN or FASTEST.`);
    }
    const bridgeRoutePriority = rawPriority;
    const pendleApiBaseUrl = process.env.PENDLE_API_BASE_URL;

    function getClientsByChainId(chainId: number) {
        if (chainId === aChainId) return aClients;
        if (chainId === bChainId) return bClients;
        if (chainId === cChainId) return cClients;
        throw new Error(
            `Unexpected chainId ${chainId}. Expected ${aChainId} (A), ${bChainId} (B), or ${cChainId} (C).`,
        );
    }

    return {
        account,
        accAddr,
        aChainId,
        bChainId,
        cChainId,
        bMarket,
        aTokenIn,
        cTokenOut,
        rawAmount,
        slippage,
        bridgeRoutePriority,
        pendleApiBaseUrl,
        aClients,
        bClients,
        cClients,
        getClientsByChainId,
        ctx: { account, accAddr, pendleApiBaseUrl, getClientsByChainId },
    };
}
