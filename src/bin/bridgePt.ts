import pc from 'picocolors';
import { createPublicClient, createWalletClient, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bridgePt } from '../bridgePt.ts';
import { fetchLzMetadata } from '../LZApi.ts';
import { getEnv, getEnvAddress, getEnvBigInt, getEnvInt } from '../utils/env.ts';

async function main() {
    const lzMetadata = await fetchLzMetadata({ cache: true });
    const transport = http(getEnv('A_RPC_URL'));
    const clients = {
        public: createPublicClient({
            transport,
        }),
        wallet: createWalletClient({
            account: privateKeyToAccount(getEnv('PRIVATE_KEY') as Hex),
            transport,
        }),
    };

    const [accAddr] = await clients.wallet.getAddresses();
    if (!accAddr) {
        throw new Error('Failed to get account address');
    }
    console.log(`Account address: ${pc.yellow(accAddr)}`);

    await bridgePt(lzMetadata, clients, {
        fromOft: getEnvAddress('A_OFT'),
        rawAmount: getEnvBigInt('RAW_AMOUNT'),
        toChainId: getEnvInt('B_CHAIN_ID'),
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
