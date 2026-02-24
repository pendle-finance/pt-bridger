import type { Api as BungeeQuoteApi } from '../types/BungeeQuoteAPITypes.js';
import type { Api as BungeeSubmitApi, BungeeSwapReqBodyDto } from '../types/BungeeSubmitAutoAPITypes.js';
import type { Api as BungeeGetRequestStatusApi } from '../types/BungeeGetRequestStatusAPITypes.js';

// https://docs.bungee.exchange/bungee-api/integration-guides/check-status#status-code-enum
export enum BungeeRequestStatus {
    PENDING = 0,
    ASSIGNED = 1,
    EXTRACTED = 2,
    FULFILLED = 3,
    SETTLED = 4,
    EXPIRED = 5,
    CANCELLED = 6,
    REFUNDED = 7,
}

export class BungeeApi {
    static PUBLIC_BASE_API_URL = 'https://public-backend.bungee.exchange';
    static DEDICATED_API_URL = 'https://dedicated-backend.bungee.exchange';

    constructor(
        readonly baseApiUrl: string,
        readonly apiKey?: string,
    ) {}

    static create(params?: { apiKey?: string | undefined }) {
        const apiKey = params?.apiKey;
        const baseApiUrl = apiKey != null ? BungeeApi.DEDICATED_API_URL : BungeeApi.PUBLIC_BASE_API_URL;
        return new BungeeApi(baseApiUrl, apiKey);
    }

    isPublicApi(): boolean {
        return this.baseApiUrl === BungeeApi.PUBLIC_BASE_API_URL;
    }

    protected async makeRawRequest(
        method: 'GET' | 'POST',
        route: string,
        params?: {
            searchParams?: URLSearchParams;
            body?: string;
        },
    ) {
        const searchParams = params?.searchParams;
        const url =
            searchParams != null
                ? `${this.baseApiUrl}/${route}?${searchParams.toString()}`
                : `${this.baseApiUrl}/${route}`;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (this.apiKey) headers['x-api-key'] = this.apiKey;
        return fetch(url, { method, headers, body: params?.body ?? null });
    }

    // https://docs.bungee.exchange/bungee-api/integration-guides/auto-erc20-permit2#step-1-get-a-quote
    async getQuoteAutoRoutePermit2(params: BungeeQuoteApi.BungeeControllerQuoteV1.RequestQuery) {
        const res = await this.makeRawRequest('GET', 'api/v1/bungee/quote', {
            searchParams: new URLSearchParams(params),
        });
        const data = (await res.json()) as BungeeQuoteApi.BungeeControllerQuoteV1.ResponseBody;
        const serverReqId = res.headers.get('server-req-id');

        if (!data.success) {
            throw new Error(`Quote error: ${data.statusCode}: ${data.message}. server-req-id: ${serverReqId}`);
        }

        if (!data.result?.autoRoute) {
            throw new Error(`Quote error: ${data.statusCode}: No auto route found. server-req-id: ${serverReqId}`);
        }

        const quoteId = data.result.autoRoute.quoteId;
        const requestType = data.result.autoRoute.requestType;
        const signTypedData = data.result.autoRoute.signTypedData ?? null;

        // based on the example https://docs.bungee.exchange/bungee-api/integration-guides/auto-erc20-permit2#complete-integration-using-viem-full-script
        // as well as the API example result from https://docs.bungee.exchange/api-reference/core-api/get-bungee-quote
        // `witness` is the `request` to submit to bungee
        const witness =
            signTypedData?.values && 'witness' in signTypedData.values
                ? (signTypedData.values.witness as BungeeSwapReqBodyDto['request'])
                : null;
        const approvalData = data.result.autoRoute.approvalData;

        return {
            quoteId,
            requestType,
            witness,
            signTypedData,
            approvalData,
            fullResponse: data,
        };
    }

    async submitSignedRequest(params: BungeeSubmitApi.BungeeControllerSubmitBungeeRequestV1.RequestBody) {
        const res = await this.makeRawRequest('POST', 'api/v1/bungee/submit', {
            body: JSON.stringify(params),
        });
        const data = (await res.json()) as BungeeSubmitApi.BungeeControllerSubmitBungeeRequestV1.ResponseBody;
        if (!data.success) throw new Error(`Submit error: ${data.message ?? 'Unknown error'}`);
        if (data.result == null) throw new Error(`Submit error: null result`);
        return data.result;
    }

    async getRequestStatus(params: { requestHash: string }): Promise<BungeeRequestStatus> {
        const response = await this.makeRawRequest('GET', 'api/v1/bungee/status', {
            searchParams: new URLSearchParams(params),
        });
        const data = (await response.json()) as BungeeGetRequestStatusApi.BungeeControllerReqStatusV1.ResponseBody;
        if (!data.success) throw new Error(`Status error: ${data.message ?? 'Unknown error'}`);
        const status = data.result?.[0]?.bungeeStatusCode;

        if (status == null) throw new Error(`Status error: null status`);
        if (BungeeRequestStatus[status] == null) throw new Error(`Status error: invalid status`);
        return status as BungeeRequestStatus;
    }
}
