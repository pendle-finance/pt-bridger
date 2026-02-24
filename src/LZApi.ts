import fs from 'node:fs/promises';
import path from 'node:path';
import type { LZMessageStatus, LZMessageStatusResponse } from './types/LZMessageStatusResponse.ts';
import type { ChainMetadata, RawLZMetadataResponse } from './types/LZMetadataResponse.ts';
import { debugLog } from './utils/misc.ts';

export const LZ_METADATA_CACHE_FILE = path.join(__dirname, '../cache/lz-metadata.json');

export async function fetchLzMetadata(params?: { cache?: boolean }): Promise<LZMetadata> {
    const cache = params?.cache ?? false;

    if (cache) {
        try {
            await fs.access(LZ_METADATA_CACHE_FILE);
            const data = await fs.readFile(LZ_METADATA_CACHE_FILE, 'utf8');
            debugLog('Loaded Layerzero metadata from cache', LZ_METADATA_CACHE_FILE);
            return LZMetadata.fromRaw(JSON.parse(data));
        } catch {
            debugLog('Layerzero metadata cache not found');
        }
    }

    debugLog('Fetching Layerzero metadata from API...');
    const response = await fetch('https://metadata.layerzero-api.com/v1/metadata');
    const data = await response.json();
    const res = LZMetadata.fromRaw(data as RawLZMetadataResponse);

    if (cache) {
        await fs.mkdir(path.dirname(LZ_METADATA_CACHE_FILE), { recursive: true });
        await fs.writeFile(LZ_METADATA_CACHE_FILE, JSON.stringify(res.toJSON()));
        debugLog('Layerzero metadata cache updated to', LZ_METADATA_CACHE_FILE);
    }

    return res;
}

export function getLzScanUrl(params: { txHash: string }): string {
    return `https://layerzeroscan.com/tx/${params.txHash}`;
}

export async function getLzMessageStatusByTxHash(params: { txHash: string }): Promise<LZMessageStatus | undefined> {
    const response = await fetch(`https://scan.layerzero-api.com/v1/messages/tx/${params.txHash}`);
    const code = response.status;
    if (code === 404) return undefined;

    const responseJson = (await response.json()) as LZMessageStatusResponse;
    const status = responseJson.data[0]?.status;
    if (status == null) return undefined;
    return status;
}

export class LZMetadata {
    private constructor(public readonly data: RawLZMetadataResponse) {}

    static fromRaw(raw: RawLZMetadataResponse): LZMetadata {
        return new LZMetadata(raw);
    }

    toJSON(): RawLZMetadataResponse {
        return this.data;
    }

    allChainMetadata(): ChainMetadata[] {
        return Object.values(this.data);
    }

    getEidV2ByChainId(chainId: number): number | undefined {
        const chainMetadata = this.allChainMetadata().find(
            (metadata) => metadata.chainDetails?.nativeChainId === chainId,
        );

        const eidStr = chainMetadata?.deployments.filter(({ version }) => version === 2)[0]?.eid;
        if (eidStr == null) return undefined;
        return parseInt(eidStr, 10);
    }
}
