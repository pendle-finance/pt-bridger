import path from 'node:path';
import * as dotenv from 'dotenv';
import type { Address, Hex } from 'viem';
import { parseAddr, parseHex } from './misc';

dotenv.config({ quiet: true });

export function getEnv(key: string): string {
    const value = process.env[key];
    if (value == null) throw new Error(`Missing env var ${key}`);
    return value;
}

export function getEnvAddress(key: string): Address {
    const value = getEnv(key);
    return parseAddr(value);
}

export function getEnvHex(key: string): Hex {
    const value = getEnv(key);
    return parseHex(value);
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

export function getEnvNumber(key: string): number {
    const value = getEnv(key);
    const res = parseFloat(value);
    if (Number.isNaN(res) || !Number.isFinite(res)) throw new Error(`Invalid number ${value}`);
    return res;
}

export const CACHE_DIR = path.resolve(path.join(__dirname, '..', '..', 'cache'));
