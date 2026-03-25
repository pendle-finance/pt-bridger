import type {
    ChallengeResponse,
    GenerateChallengeDto,
    IntentListResponse,
    IntentResponse,
    SimulateCrossChainSwapQuery,
    SimulateCrossChainSwapResponse,
    SubmitCrossChainSwapIntentDto,
    VerifyChallengeDto,
} from '../types/PendleCrossChainSwapApiTypes';

const DEFAULT_PENDLE_API_BASE_URL = 'https://api-v2.pendle.finance/core';
const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

function resolveBaseUrl(baseUrl?: string): string {
    return baseUrl ?? DEFAULT_PENDLE_API_BASE_URL;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
    }
    return (await response.json()) as T;
}

export async function simulateCrossChainSwap(
    baseUrl: string | undefined,
    hubChainId: number,
    market: string,
    query: SimulateCrossChainSwapQuery,
): Promise<SimulateCrossChainSwapResponse> {
    const params = new URLSearchParams({
        receiver: query.receiver,
        tokenIn: query.tokenIn,
        amountIn: query.amountIn,
        tokenOut: query.tokenOut,
        fromChainId: String(query.fromChainId),
        toChainId: String(query.toChainId),
        slippage: String(query.slippage),
        bridgeRoutePriority: query.bridgeRoutePriority,
    });
    const url = `${resolveBaseUrl(baseUrl)}/v1/sdk/${hubChainId}/markets/${market}/simulate-cross-chain-swap?${params}`;
    return fetchJson<SimulateCrossChainSwapResponse>(url);
}

export async function generateChallenge(
    baseUrl: string | undefined,
    body: GenerateChallengeDto,
): Promise<ChallengeResponse> {
    return fetchJson<ChallengeResponse>(`${resolveBaseUrl(baseUrl)}/v1/sdk/cross-chain-swap/challenge`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
    });
}

export async function submitIntent(
    baseUrl: string | undefined,
    body: SubmitCrossChainSwapIntentDto,
): Promise<IntentResponse> {
    return fetchJson<IntentResponse>(`${resolveBaseUrl(baseUrl)}/v1/sdk/cross-chain-swap/intents`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
    });
}

export async function getIntent(baseUrl: string | undefined, intentId: string): Promise<IntentResponse> {
    return fetchJson<IntentResponse>(`${resolveBaseUrl(baseUrl)}/v1/sdk/cross-chain-swap/intents/${intentId}`);
}

export async function confirmDeposit(baseUrl: string | undefined, intentId: string): Promise<IntentResponse> {
    return fetchJson<IntentResponse>(
        `${resolveBaseUrl(baseUrl)}/v1/sdk/cross-chain-swap/intents/${intentId}/confirm-deposit`,
        {
            method: 'PUT',
            headers: JSON_HEADERS,
        },
    );
}

export async function cancelIntent(
    baseUrl: string | undefined,
    intentId: string,
    body: VerifyChallengeDto,
): Promise<IntentResponse> {
    return fetchJson<IntentResponse>(`${resolveBaseUrl(baseUrl)}/v1/sdk/cross-chain-swap/intents/${intentId}/cancel`, {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
    });
}

export async function retryIntent(
    baseUrl: string | undefined,
    intentId: string,
    body: VerifyChallengeDto,
): Promise<IntentResponse> {
    return fetchJson<IntentResponse>(`${resolveBaseUrl(baseUrl)}/v1/sdk/cross-chain-swap/intents/${intentId}/retry`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
    });
}

export async function listIntents(
    baseUrl: string | undefined,
    query: {
        userAddress?: string;
        stateFilter?: string;
        skip: number | undefined;
        limit: number | undefined;
    },
): Promise<IntentListResponse> {
    const params = new URLSearchParams();
    if (query.userAddress !== undefined) params.set('userAddress', query.userAddress);
    if (query.stateFilter !== undefined) params.set('stateFilter', query.stateFilter);
    if (query.skip !== undefined) params.set('skip', String(query.skip));
    if (query.limit !== undefined) params.set('limit', String(query.limit));
    return fetchJson<IntentListResponse>(`${resolveBaseUrl(baseUrl)}/v1/sdk/cross-chain-swap/intents?${params}`);
}
