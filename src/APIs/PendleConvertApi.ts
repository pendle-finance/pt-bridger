import type { PendleConvertAPIReponse, PendleConvertAPIRequestBody } from '../types/PendleConvertAPITypes';

const DEFAULT_PENDLE_API_BASE_URL = 'https://api-v2.pendle.finance/core';

export async function pendleConvert(
    chainId: number,
    body: PendleConvertAPIRequestBody,
    params?: {
        baseUrl?: string;
        apiKey?: string;
    },
): Promise<PendleConvertAPIReponse> {
    const baseUrl = params?.baseUrl ?? DEFAULT_PENDLE_API_BASE_URL;
    const url = `${baseUrl}/v3/sdk/${chainId}/convert`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (params?.apiKey) headers.Authorization = `Bearer ${params.apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    return (await response.json()) as PendleConvertAPIReponse;
}
