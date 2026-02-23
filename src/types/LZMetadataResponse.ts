// Minimal response type for the LayerZero metadata API (https://metadata.layerzero-api.com/v1/metadata).

export type RawLZMetadataResponse = Record<string, ChainMetadata>;

export type ChainMetadata = {
    created: string;
    updated: string;
    tableName: string;
    environment: string;
    deployments: LZDeployment[];
    chainDetails?: ChainDetails;
    chainName: string;
    chainKey: string;
};

type LZDeployment = LZV1Deployment | LZV2Deployment;

type LZV1Deployment = {
    version: 1;
    eid: string;
    chainKey: string;
    stage: string;

    treasuryV2: WithAddress;
    ultraLightNodeV2: WithAddress;
    nonceContract: WithAddress;
    endpoint: WithAddress;
    relayerV2: WithAddress;
    fPValidator: WithAddress;
    sendUln301: WithAddress;
    mPTValidator01: WithAddress;
    receiveUln301: WithAddress;
};

type LZV2Deployment = {
    version: 2;
    eid: string;
    chainKey: string;
    stage: string;

    endpointV2: WithAddress;
    readLib1002: WithAddress;
    endpointV2View: WithAddress;
    executor: WithAddress;
    deadDVN: WithAddress;
    sendUln302: WithAddress;
    lzExecutor: WithAddress;
    blockedMessageLib: WithAddress;
    receiveUln302: WithAddress;
};

type WithAddress = { address: string };

type ChainDetails = {
    chainKey: string;
    chainStatus: string;
    nativeChainId: number;
    chainStack: string;
    chainLayer: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        cgId: string;
        cmcId: number;
        decimals: number;
    };
    cgNetworkId: string;
    name: string;
    chainType: string;
    shortName: string;
    averageBlockTime: number;
};
