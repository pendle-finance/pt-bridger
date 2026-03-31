/**
 * Cross-Chain Swap types and API endpoints available on Core service.
 *
 * Simulate endpoint: GET /v1/sdk/{chainId}/markets/{market}/simulate-cross-chain-swap
 * Intent management: /v1/sdk/cross-chain-swap/*
 */

// ============================================================================
// Simulate Cross-Chain Swap
// ============================================================================

export type SimulateCrossChainSwapDepositBox = {
    address: string;
    id: number;
};

export type SimulateCrossChainSwapFee = {
    /** USD */
    tradingFee: number;
    /** USD */
    bridgeFee: number;
    /** USD */
    gasFee: number;
};

export type SimulateCrossChainSwapTimeEstimate = {
    tokenBridgeEstimate_s: number;
    queueEstimate_s: number;
    swapEstimate_s: number;
    ptBridgeEstimate_s: number;
    withdrawEstimate_s: number;
    totalEstimate_s: number;
};

export type SimulateCrossChainSwapSimulateOutput = {
    bridgeToHubOutput: string;
    swapOutput: string;
    bridgeToDstOutput: string;
    currentImpliedApy: number;
    newImpliedApy: number;
    fee: SimulateCrossChainSwapFee;
    effectiveApy?: number;
    minOutput: string;
    totalTimeEstimate: SimulateCrossChainSwapTimeEstimate;
};

export type SimulateCrossChainSwapResponse = {
    actionType: 'BUY_PT' | 'SELL_PT';
    depositBox: SimulateCrossChainSwapDepositBox;
    hubChainPt: string;
    bridgeIOToken: string;
    expectGasTopUp: boolean;
    slippage: number;
    priceImpact: number;
    simulateOutput: SimulateCrossChainSwapSimulateOutput;
};

export type SimulateCrossChainSwapQuery = {
    receiver: string;
    tokenIn: string;
    amountIn: string;
    tokenOut: string;
    fromChainId: number;
    toChainId: number;
    slippage: number;
    bridgeRoutePriority: 'BEST_RETURN' | 'FASTEST';
};

// ============================================================================
// Challenge (SIWE)
// ============================================================================

export type GenerateChallengeDto = {
    address: string;
    chainId: number;
    action: 'SUBMIT_INTENT' | 'CANCEL_INTENT' | 'RETRY_INTENT';
    intentHash: string;
};

export type ChallengeResponse = {
    id: string;
    address: string;
    chainId: number;
    message: string;
    issuedAt: string;
    expiresAt: string;
    intentHash: string;
};

// ============================================================================
// Submit Intent
// ============================================================================

export type SimulateOutputFeeDto = {
    tradingFee: number;
    bridgeFee: number;
    gasFee: number;
};

export type SimulateOutputTimeEstimateDto = {
    tokenBridgeEstimate_s: number;
    queueEstimate_s: number;
    swapEstimate_s: number;
    ptBridgeEstimate_s: number;
    withdrawEstimate_s: number;
    totalEstimate_s: number;
};

export type SimulateOutputDto = {
    bridgeToHubOutput: string;
    swapOutput: string;
    bridgeToDstOutput: string;
    currentImpliedApy: number;
    newImpliedApy: number;
    fee: SimulateOutputFeeDto;
    effectiveApy?: number;
    minOutput: string;
    totalTimeEstimate: SimulateOutputTimeEstimateDto;
};

export type SubmitCrossChainSwapIntentDto = {
    actionType: 'BUY_PT' | 'SELL_PT';
    userAddress: string;
    depositBoxAddress: string;
    depositBoxId: number;
    marketAddress: string;
    hubChainPt: string;
    hubChainId: number;
    fromChainId: number;
    toChainId: number;
    tokenIn: string;
    amountIn: string;
    tokenOut: string;
    bridgeIOToken: string;
    slippage: number;
    bridgeRoutePriority: 'BEST_RETURN' | 'FASTEST';
    challengeId: string;
    signature: string;
    expectGasTopUp: boolean;
    simulateOutput: SimulateOutputDto;
};

// ============================================================================
// Verify Challenge (cancel / retry)
// ============================================================================

export type VerifyChallengeDto = {
    challengeId: string;
    signature: string;
};

// ============================================================================
// Intent Response
// ============================================================================

export type FundDataResponse = {
    chainId: number;
    token: string;
    amount: string;
};

export type SimulateOutputFeeResponse = {
    tradingFee: number;
    bridgeFee: number;
    gasFee: number;
};

export type SimulateOutputTimeEstimateResponse = {
    tokenBridgeEstimate_s: number;
    queueEstimate_s: number;
    swapEstimate_s: number;
    ptBridgeEstimate_s: number;
    withdrawEstimate_s: number;
    totalEstimate_s: number;
};

export type SimulateOutputResponse = {
    bridgeToHubOutput: string;
    swapOutput: string;
    bridgeToDstOutput: string;
    currentImpliedApy: number;
    newImpliedApy: number;
    fee: SimulateOutputFeeResponse;
    effectiveApy?: number;
    minOutput: string;
    totalTimeEstimate: SimulateOutputTimeEstimateResponse;
};

export type IntentStatus =
    | 'AWAITING_DEPOSIT'
    | 'READY'
    | 'BRIDGE_TO_HUB_RETRYING'
    | 'BRIDGE_TO_HUB_PROPOSE_FAILED'
    | 'BRIDGE_TO_HUB_TX_SENT'
    | 'BRIDGE_TO_HUB_TX_FAILED_TO_SEND'
    | 'BRIDGE_TO_HUB_TX_TIMED_OUT'
    | 'BRIDGE_TO_HUB_TX_CONFIRMED'
    | 'BRIDGE_TO_HUB_BRIDGE_FAILED'
    | 'BRIDGE_TO_HUB_BRIDGE_TIMED_OUT'
    | 'BRIDGE_TO_HUB_REFUNDED'
    | 'BRIDGE_TO_HUB_REFUND_FAILED'
    | 'BRIDGE_TO_HUB_MIN_OUTPUT_CHECK_FAILED'
    | 'BRIDGE_TO_HUB_COMPLETED'
    | 'SWAP_RETRYING'
    | 'SWAP_VALIDATION_FAILED'
    | 'SWAP_PROPOSE_FAILED'
    | 'SWAP_TX_SENT'
    | 'SWAP_TX_FAILED_TO_SEND'
    | 'SWAP_TX_TIMED_OUT'
    | 'SWAP_MIN_OUTPUT_CHECK_FAILED'
    | 'SWAP_COMPLETED'
    | 'BRIDGE_TO_DST_RETRYING'
    | 'BRIDGE_TO_DST_PROPOSE_FAILED'
    | 'BRIDGE_TO_DST_TX_SENT'
    | 'BRIDGE_TO_DST_TX_FAILED_TO_SEND'
    | 'BRIDGE_TO_DST_TX_TIMED_OUT'
    | 'BRIDGE_TO_DST_TX_CONFIRMED'
    | 'BRIDGE_TO_DST_BRIDGE_FAILED'
    | 'BRIDGE_TO_DST_BRIDGE_TIMED_OUT'
    | 'BRIDGE_TO_DST_REFUNDED'
    | 'BRIDGE_TO_DST_REFUND_FAILED'
    | 'BRIDGE_TO_DST_MIN_OUTPUT_CHECK_FAILED'
    | 'BRIDGE_TO_DST_COMPLETED'
    | 'CANCELLED'
    | 'COMPLETED';

export type WithdrawStatus = 'READY' | 'TX_SENT' | 'RETRYING' | 'TX_TIMED_OUT' | 'COMPLETED' | 'FAILED' | 'INIT_FAILED';

export type GasTopUpStatus = 'READY' | 'TX_SENT' | 'TX_TIMED_OUT' | 'COMPLETED' | 'FAILED' | 'RETRYING';

export type OverallIntentState = 'awaiting_deposit' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export type IntentResponse = {
    actionType: 'BUY_PT' | 'SELL_PT';
    intentId: string;
    requestId: string;
    status: IntentStatus;
    userAddress: string;
    depositBoxAddress: string;
    depositBoxId: number;
    marketAddress: string;
    hubChainPt: string;
    hubChainPtAdapter?: string;
    fromChainPtAdapter?: string;
    toChainPtAdapter?: string;
    hubChainId: number;
    fromChainId: number;
    toChainId: number;
    tokenIn: string;
    amountIn: string;
    tokenOut: string;
    bridgeIOToken: string;
    slippage: number;
    bridgeRoutePriority: 'BEST_RETURN' | 'FASTEST';
    bridgeToHubTxHash?: string;
    bridgeToHubOutput?: string;
    swapTxHash?: string;
    swapOutput?: string;
    bridgeToDstTxHash?: string;
    bridgeToDstOutput?: string;
    withdrawStatus?: WithdrawStatus;
    expectGasTopUp: boolean;
    gasTopUpStatus?: GasTopUpStatus;
    gasTopUpTxHash?: string;
    gasTopUpAmount?: string;
    errorMessage?: string;
    isStuck: boolean;
    lastFailedEstimatedOutput?: string;
    withdrawalOutput?: string;
    refundTxHash?: string;
    withdrawalTxHash?: string;
    fundData: FundDataResponse;
    simulateOutput: SimulateOutputResponse;
    estimatedFinishAt?: string;
    updatedAt: string;
    overallState: OverallIntentState;
    isRetryable: boolean;
    isCancellable: boolean;
};

export type IntentListResponse = {
    total: number;
    skip: number;
    limit: number;
    result: IntentResponse[];
};

// ============================================================================
// API Endpoints
// ============================================================================
//
// Simulate:
//   GET  /v1/sdk/{chainId}/markets/{market}/simulate-cross-chain-swap
//        Query: SimulateCrossChainSwapQuery
//        Response: SimulateCrossChainSwapResponse
//
// Challenge:
//   POST /v1/sdk/cross-chain-swap/challenge
//        Body: GenerateChallengeDto
//        Response: ChallengeResponse
//
// Intents:
//   GET  /v1/sdk/cross-chain-swap/intents
//        Query: { userAddress?, hubChainPt?, hubChainId?, fromChainId?, toChainId?,
//                 tokenIn?, tokenOut?, stateFilter?, timestampStart?, timestampEnd?,
//                 skip?, limit? }
//        Response: IntentListResponse
//
//   POST /v1/sdk/cross-chain-swap/intents
//        Body: SubmitCrossChainSwapIntentDto
//        Response: IntentResponse
//
//   GET  /v1/sdk/cross-chain-swap/intents/{intentId}
//        Response: IntentResponse
//
//   PUT  /v1/sdk/cross-chain-swap/intents/{intentId}/confirm-deposit
//        Response: IntentResponse
//
//   PUT  /v1/sdk/cross-chain-swap/intents/{intentId}/cancel
//        Body: VerifyChallengeDto
//        Response: IntentResponse
//
//   POST /v1/sdk/cross-chain-swap/intents/{intentId}/retry
//        Body: VerifyChallengeDto
//        Response: IntentResponse
