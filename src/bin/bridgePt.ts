import * as dotenv from 'dotenv';
import { createPublicClient, createWalletClient, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bridgePt } from '../bridgePt.ts';
import { fetchLzMetadata } from '../LZApi.ts';
import { getEnv, getEnvAddress, getEnvBigInt, getEnvInt } from '../utils.ts';
import pc from 'picocolors';

dotenv.config();

async function main() {
    const lzMetadata = await fetchLzMetadata({ cache: true });
    const transport = http(getEnv('FROM_RPC_URL'));
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
        fromOft: getEnvAddress('FROM_OFT'),
        rawAmount: getEnvBigInt('RAW_AMOUNT'),
        toChainId: getEnvInt('TO_CHAIN_ID'),
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
