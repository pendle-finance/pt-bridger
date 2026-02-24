import inquirerConfirm from '@inquirer/confirm';
import { erc20Abi, isAddress, isHex, type Address, type Hex, type PublicClient } from 'viem';
import './env.ts'; // dotenv config

export const debugLog = process.env.DEBUG === '1' ? console.debug : () => {};
export const confirm = process.env.NO_CONFIRM === '1' ? () => Promise.resolve(true) : inquirerConfirm;

export function throwErr(msg: string): never {
    throw new Error(msg);
}

export function fmtTokenSymbol(symbol: string | null | undefined, addr: Address): string {
    if (symbol == null || symbol === addr) return addr;
    // shorten addr
    const shortAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    return `${symbol} (${shortAddr})`;
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function addressToBytes32(a: Address): Hex {
    return `0x${a.slice(2).padStart(64, '0')}`;
}

export function bytes32ToAddress(a: Hex): Address {
    const stripped0x = a.slice(2);
    const NUM_ZEROS = (32 - 20) * 2;
    if (stripped0x.length !== 32 * 2) throw new Error('bytes32ToAddress: invalid length');
    if (stripped0x.slice(0, NUM_ZEROS) !== '0'.repeat(NUM_ZEROS)) throw new Error('bytes32ToAddress: non zero prefix');

    return `0x${stripped0x.slice(NUM_ZEROS)}`;
}

export async function getTokenSymbol(client: PublicClient, token: Address): Promise<string> {
    return await client.readContract({
        abi: erc20Abi,
        address: token,
        functionName: 'symbol',
    });
}

export function parseAddr(str: string): Address {
    if (!isAddress(str, { strict: true })) throw new Error(`Invalid address ${str}`);
    return str;
}

export function parseHex(str: string): Hex {
    if (!isHex(str)) throw new Error(`Invalid hex string ${str}`);
    return str;
}
