import inquirerConfirm from '@inquirer/confirm';
import * as dotenv from 'dotenv';
import type { Address, Hex } from 'viem';
import { isAddress } from 'viem';

dotenv.config();

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

/// Env related

export function getEnv(key: string): string {
    const value = process.env[key];
    if (value == null) throw new Error(`Missing env var ${key}`);
    return value;
}

export function getEnvAddress(key: string): Address {
    const value = getEnv(key);
    if (!isAddress(value, { strict: false })) throw new Error(`Invalid address ${value}`);
    return value as Address;
}

export function getEnvBigInt(key: string): bigint {
    const value = getEnv(key);
    if (!/^-?\d+$/.test(value)) throw new Error(`Invalid bigint ${value}`);
    return BigInt(value);
}

export function getEnvInt(key: string): number {
    const value = getEnv(key);
    if (!/^-?\d+$/.test(value)) throw new Error(`Invalid integer ${value}`);
    return parseInt(value, 10);
}

/// Wad math

export const WAD_ONE = 10n ** 18n;

export function wadMul(a: bigint, b: bigint): bigint {
    return (a * b) / WAD_ONE;
}

export function wadDiv(a: bigint, b: bigint): bigint {
    return (a * WAD_ONE) / b;
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
