/// Minimal response for https://scan.layerzero-api.com/v1/messages/tx/{tx} but only get the status

export type LZMessageStatusResponse = {
    data: Array<{
        status?: LZMessageStatus;
    }>;
};

export type LZMessageStatus = {
    name?: LZMessageStatusName;
    message?: string;
};

export type LZMessageStatusName =
    | 'INFLIGHT'
    | 'CONFIRMING'
    | 'FAILED'
    | 'DELIVERED'
    | 'BLOCKED'
    | 'PAYLOAD_STORED'
    | 'APPLICATION_BURNED'
    | 'APPLICATION_SKIPPED'
    | 'UNRESOLVABLE_COMMAND'
    | 'MALFORMED_COMMAND';
