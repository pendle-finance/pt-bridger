import * as dotenv from 'dotenv';
import type { Address } from 'viem';
import { isAddress } from 'viem';

dotenv.config({ quiet: true });

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
