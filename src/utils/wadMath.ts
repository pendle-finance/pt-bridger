export const WAD_ONE = 10n ** 18n;

export function wadMul(a: bigint, b: bigint): bigint {
    return (a * b) / WAD_ONE;
}

export function wadSlippageMul(value: bigint, slippageWad: bigint) {
    return wadMul(value, WAD_ONE - slippageWad);
}

export function wadDiv(a: bigint, b: bigint): bigint {
    return (a * WAD_ONE) / b;
}

export function wadToSmallNum(a: bigint): number {
    // truncate a to only have 6 decimals
    a /= 10n ** 12n;
    return Number(a) / 10 ** 6;
}

export function smallNumToWad(a: number): bigint {
    return BigInt(Math.round(a * 10 ** 6)) * 10n ** 12n;
}
