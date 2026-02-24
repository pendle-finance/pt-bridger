export const WAD_ONE = 10n ** 18n;

export function wadMul(a: bigint, b: bigint): bigint {
    return (a * b) / WAD_ONE;
}

export function wadDiv(a: bigint, b: bigint): bigint {
    return (a * WAD_ONE) / b;
}
