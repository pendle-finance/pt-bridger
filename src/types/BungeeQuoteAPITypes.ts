/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface SuccessResponseDto {
    /**
     * flag indicating whether the req was successful
     * @default true
     */
    success: boolean;
    /**
     * Http status code
     * @default 200
     */
    statusCode: number;
    /** error message if request failed */
    message?: string | null;
}

export interface BungeeQuoteResponseDto {
    /**
     * Origin chain ID
     * @example 42161
     */
    originChainId: number;
    /**
     * Destination chain ID
     * @example 10
     */
    destinationChainId: number;
    /**
     * Receiver address
     * @example "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
     */
    receiverAddress: string;
    /**
     * User address
     * @example "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
     */
    userAddress: string;
    /** Input information */
    input: BungeeInputDto;
    /** Destination execution details */
    destinationExec: DestinationExecDto | null;
    /** Auto route information */
    autoRoute: AutoRouteDto;
    /** Multiple auto routes with different optimizations */
    autoRoutes?: AutoRouteDto[];
    /** Manual routes */
    manualRoutes: ManualRouteDto[];
    /** Deposit Address Route (legacy flow) */
    depositRoute?: DepositRouteDto;
    /** Socket Core Deposit Address Route (new flow) */
    deposit?: SocketCoreDepositRouteDto;
}

export interface BungeeInputDto {
    /** Token information */
    token: TokenDto;
    /**
     * Token amount in wei
     * @example "1000000"
     */
    amount: string;
    /**
     * Token price in USD
     * @example 1
     */
    priceInUsd: number;
    /**
     * Value of the token amount in USD
     * @example 1
     */
    valueInUsd: number;
}

export interface DestinationExecDto {
    /**
     * Destination payload
     * @example "0x"
     */
    destinationPayload: string;
    /**
     * Destination gas limit
     * @example "0"
     */
    destinationGasLimit: string;
}

export interface AutoRouteDto {
    /**
     * User operation type
     * @example "sign"
     */
    userOp: string;
    /**
     * Request hash
     * @example "0xd7d158ed55b5d3b5e19bff46044243214ee66113271b210606b5962e769be9c6"
     */
    requestHash: string;
    /** Output information */
    output: BungeeOutputDto;
    /**
     * Request type
     * @example "SINGLE_OUTPUT_REQUEST"
     */
    requestType: 'SINGLE_OUTPUT_REQUEST' | 'SWAP_REQUEST';
    /** Approval data */
    approvalData: ApprovalDataDto | null;
    /** Affiliate fee information */
    affiliateFee: AffiliateFeeDto | null;
    /** Sign typed data */
    signTypedData: SignTypedDataDto | null;
    /** Gas fee information */
    gasFee: GasFeeDto | null;
    /**
     * Slippage percentage
     * @example 0.5
     */
    slippage: number;
    /**
     * Suggested client slippage percentage
     * @example 0.5
     */
    suggestedClientSlippage: number;
    /** Transaction data */
    txData: TransactionDataDto | null;
    /**
     * Estimated time in seconds
     * @example 10
     */
    estimatedTime: number;
    /** Route details */
    routeDetails: RouteDetailsDto;
    /** Refuel information */
    refuel: RefuelDto | null;
    /**
     * Quote ID
     * @example "8d093296d3014fb588dc5e3fc359be56"
     */
    quoteId: string;
    /**
     * Epoch timestamp for quote expiry
     * @example 1745927101
     */
    quoteExpiry: number;
    /** Rewards information */
    rewards?: RewardsDto;
    /**
     * All applicable route tags
     * @example ["MAX_OUTPUT","SUGGESTED","FASTEST"]
     */
    routeTags: string[];
    /**
     * Refund address
     * @example "0x3e8cB4bd04d81498aB4b94a392c334F5328b237b"
     */
    refundAddress: string;
}

export interface ManualRouteDto {
    /**
     * Route ID
     * @example "dbea14bb-d693-4fcb-8c8b-5c124258a96b"
     */
    quoteId: string;
    /** Output information */
    output: BungeeOutputDto;
    /** Affiliate fee information */
    affiliateFee: AffiliateFeeDto | null;
    /** Approval data */
    approvalData: ApprovalDataDto | null;
    /** Gas fee information */
    gasFee: GasFeeDto;
    /**
     * Slippage percentage
     * @example 0.5
     */
    slippage: number;
    /**
     * Estimated time in seconds
     * @example 60
     */
    estimatedTime: number;
    /** Route details */
    routeDetails: RouteDetailsDto;
    /** Refuel information */
    refuel: RefuelDto | null;
}

export interface DepositRouteDto {
    /**
     * Address where the user deposits funds to
     * @example "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
     */
    depositAddress: string;
    /**
     * ID associated with Quote
     * @example "0xfe6210528387a2653b88436b3beb374d9fe113b92ce4b08b82e40a5c02c6055d"
     */
    quoteId: string;
    /**
     * Type of user operation to be performed
     * @example "tx"
     */
    userOp: string;
}

export interface SocketCoreDepositRouteDto {
    /**
     * Unique hash identifying this deposit quote
     * @example "0xfe6210528387a2653b88436b3beb374d9fe113b92ce4b08b82e40a5c02c6055d"
     */
    requestHash: string;
    /**
     * Type of user operation to be performed
     * @example "transfer"
     */
    userOp: string;
    /** Deposit address details and token info */
    depositData: DepositDataDto;
    /**
     * Unix timestamp when this quote expires
     * @example 1771335259
     */
    expiry: number;
    /** Address to refund funds to if deposit fails */
    refundAddress?: string;
}

export interface TokenDto {
    /**
     * Chain ID of the token
     * @example 42161
     */
    chainId: number;
    /**
     * Token address
     * @example "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
     */
    address: string;
    /**
     * Token name
     * @example "USD Coin"
     */
    name: string;
    /**
     * Token symbol
     * @example "USDC"
     */
    symbol: string;
    /**
     * Token decimals
     * @example 6
     */
    decimals: number;
    /**
     * Logo URI
     * @example "https://assets.coingecko.com/coins/images/6319/large/usdc.png?1696506694"
     */
    logoURI: string;
    /**
     * Icon URI
     * @example "https://assets.coingecko.com/coins/images/6319/large/usdc.png?1696506694"
     */
    icon?: string;
}

export interface BungeeOutputDto {
    /** Token information */
    token: TokenDto;
    /**
     * Expected token amount
     * @example "940737"
     */
    amount: string;
    /**
     * Expected token amount post relaying fee
     * @example "940737"
     */
    effectiveAmount: string;
    /**
     * Token price in USD
     * @example 1
     */
    priceInUsd: number;
    /**
     * Value of the token amount in USD
     * @example 0.940737
     */
    valueInUsd: number;
    /**
     * Effective value of the token amount in USD
     * @example 0.940737
     */
    effectiveValueInUsd: number;
    /**
     * Minimum output amount
     * @example "936033"
     */
    minAmountOut: string;
    /**
     * Effective received amount in USD
     * @example 0.940737
     */
    effectiveReceivedInUsd: number;
}

export interface ApprovalDataDto {
    /**
     * Address to approve spending for
     * @example "0x3a23F943181408EAC424116Af7b7790c94Cb97a5"
     */
    spenderAddress: string;
    /**
     * Amount to approve
     * @example "1000000"
     */
    amount: string;
    /**
     * Token address to approve
     * @example "0xaf88d065e77c8cc2239327c5edb3a432268e5831"
     */
    tokenAddress: string;
    /**
     * user address to give approval
     * @example "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
     */
    userAddress: string;
}

export interface AffiliateFeeDto {
    /** Token information */
    token: TokenDto;
    /**
     * Fee amount
     * @example "2585"
     */
    amount: string;
    /**
     * Fee taker address
     * @example "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
     */
    feeTakerAddress: string;
}

export interface SignTypedDataDto {
    /** Domain information */
    domain: DomainDto;
    /** Type definitions */
    types: object;
    /** Values for the typed data */
    values: object;
}

export interface GasFeeDto {
    /** Gas token */
    gasToken: TokenDto;
    /**
     * Gas limit
     * @example "567600"
     */
    gasLimit: string;
    /**
     * Gas price
     * @example "10000000"
     */
    gasPrice: string;
    /**
     * Estimated fee in wei
     * @example "5676000000000"
     */
    estimatedFee: string;
    /**
     * Fee in USD
     * @example 0.0090168936
     */
    feeInUsd: number;
}

export interface TransactionDataDto {
    /** Transaction data payload - string for EVM chains, object for Solana */
    data: string | SerializedTxDataDto;
    /**
     * Contract address to which tx data needs to be sent (required for EVM, not used for Solana)
     * @example "0x3a23F943181408EAC424116Af7b7790c94Cb97a5"
     */
    to?: string;
    /**
     * Network ID
     * @example 42161
     */
    chainId: number;
    /**
     * Transaction value in wei
     * @example "0x00"
     */
    value: string;
    /**
     * Type of blockchain transaction specific to chain
     * @example "tron"
     */
    type?: string;
}

export interface RouteDetailsDto {
    /**
     * Route name
     * @example "Bungee Protocol"
     */
    name: string;
    /**
     * Route logo URI
     * @example "https://miro.medium.com/max/800/1*PN_F5yW4VMBgs_xX-fsyzQ.png"
     */
    logoURI: string;
    /** Route fee information */
    routeFee: RouteFeeDto | null;
    /** Dex information */
    dexDetails: DexDetailsDto | null;
}

export interface RefuelDto {
    /** Input refuel information */
    input: RefuelInputDto | null;
    /** Output refuel information */
    output: RefuelOutputDto;
}

export interface RewardsDto {
    /**
     * Rebate amount
     * @example "10000"
     */
    rebateAmount: string;
    /**
     * Reward amount
     * @example "20000"
     */
    rewardAmount: string;
    /**
     * Total reward amount
     * @example "30000"
     */
    totalRewardAmount: string;
    /**
     * Total reward amount in USD
     * @example 0.03
     */
    totalRewardAmountInUsd: number;
    /** Token information */
    token: TokenDto;
    /**
     * Is reward enabled
     * @example true
     */
    isRewardEnabled: boolean;
}

export interface DepositDataDto {
    /** Address where the user deposits funds to */
    address: string;
    /** Input token address on the origin chain */
    token: string;
    /** Input amount (in token decimals) */
    amount: string;
    /** Origin chain ID */
    chainId: number;
    /** Memo. Only present for Stellar source chains. */
    memo?: string;
}

export interface DomainDto {
    /**
     * Domain name
     * @example "Permit2"
     */
    name?: string;
    /**
     * Chain ID
     * @example 42161
     */
    chainId?: object;
    /**
     * Verifying contract address
     * @example "0x000000000022D473030F116dDEE9F6B43aC78BA3"
     */
    verifyingContract?: string;
    /**
     * Version
     * @example "1"
     */
    version?: string;
    /**
     * Salt (hex string)
     * @example "0xabcdef"
     */
    salt?: object;
}

export interface SerializedTxDataDto {
    /** Transaction instructions */
    instructions: SerializedInstructionDto[];
    /**
     * Address lookup tables
     * @example []
     */
    lookupTables: string[];
    /**
     * Signers (array of secret key arrays)
     * @example []
     */
    signers: number[][];
}

export interface RouteFeeDto {
    /** Token information */
    token: TokenDto;
    /**
     * Fee amount
     * @example "2585"
     */
    amount: string;
    /**
     * Fee in USD
     * @example 0.002584
     */
    feeInUsd: number;
    /**
     * Token price in USD
     * @example 1
     */
    priceInUsd: number;
}

export interface DexDetailsDto {
    /** Protocol information */
    protocol: ProtocolDto;
    /**
     * Minimum amount of tokens to receive after swap
     * @example "36400217"
     */
    minAmountOut: string;
    /**
     * Address of the output token
     * @example "0xaf88d065e77c8cc2239327c5edb3a432268e5831"
     */
    outputTokenAddress: string;
    /**
     * Address of the input token
     * @example "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
     */
    inputTokenAddress: string;
    /**
     * Expected amount of tokens to receive after swap
     * @example "36583133"
     */
    amountOut: string;
    /**
     * Slippage tolerance percentage
     * @example 0.5
     */
    slippage: number;
}

export interface RefuelInputDto {
    /** Token information */
    token: TokenDto;
    /**
     * Amount of tokens
     * @example "1000000"
     */
    amount: string;
}

export interface RefuelOutputDto {
    /** Token information */
    token: TokenDto;
    /**
     * Amount of tokens
     * @example "1000000"
     */
    amount: string;
}

export interface SerializedInstructionDto {
    /**
     * Program ID
     * @example "8jZnXYnZB1MJQG6zBXyouzcycsaPTrZtPXPHDNifjYaC"
     */
    programId: string;
    /** Account keys */
    keys: SerializedInstructionKeyDto[];
    /**
     * Base64 encoded instruction data
     * @example "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAED"
     */
    data: string;
}

export interface ProtocolDto {
    /**
     * Protocol identifier name
     * @example "openocean"
     */
    name: string;
    /**
     * User-friendly display name of the protocol
     * @example "OpenOcean"
     */
    displayName: string;
    /**
     * URL to the protocol icon
     * @example "https://media.socket.tech/dexes/openocean.png"
     */
    icon: string;
}

export interface SerializedInstructionKeyDto {
    /**
     * Public key address
     * @example "8jZnXYnZB1MJQG6zBXyouzcycsaPTrZtPXPHDNifjYaC"
     */
    pubkey: string;
    /**
     * Whether this key is a signer
     * @example true
     */
    isSigner: boolean;
    /**
     * Whether this account is writable
     * @example true
     */
    isWritable: boolean;
}

export namespace Api {
    /**
     * No description
     * @tags Core API
     * @name BungeeControllerQuoteV1
     * @summary Get Bungee quote
     * @request GET:/api/v1/bungee/quote
     */
    export namespace BungeeControllerQuoteV1 {
        export type RequestParams = {};
        export type RequestQuery = {
            /**
             * Sender wallet address. Optional for deposit flow.
             * @example "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
             */
            userAddress?: string;
            /**
             * Source Chain Id
             * @example "42161"
             */
            originChainId: string;
            /**
             * Destination Chain Id
             * @example "10"
             */
            destinationChainId: string;
            /**
             * Address of the input token
             * @example "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
             */
            inputToken: string;
            /**
             * Input amount in wei
             * @example "100000000000000"
             */
            inputAmount: string;
            /**
             * Receiver wallet address
             * @example "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
             */
            receiverAddress: string;
            /**
             * Output token address
             * @example "0x0b2c639c533813f4aa9d7837caf62653d097ff85"
             */
            outputToken: string;
            /**
             * Swap  slippage for manual routes and slippage considered for auto route. Example for 0.5% slippage
             * @example "0.5"
             */
            slippage?: string;
            /** Delegate address applied to routes where delegate is an option. By default set to userAddress */
            delegateAddress?: string;
            /**
             * Apply refuel to the request. Refuel by default is false
             * @example "false"
             */
            refuel?: string;
            /** Destination payload to execute on the receiver. Destination gas limit needed along with this param if set */
            destinationPayload?: string;
            /** Destination gas limit to be used to execute the payload on destination receiver */
            destinationGasLimit?: string;
            /**
             * Fee in bps. Supports decimal values. Example is 3.5 bps
             * @example "3.5"
             */
            feeBps?: string;
            /** Address to collect fee */
            feeTakerAddress?: string;
            /**
             * Enable manual routes. By default it is false
             * @example "true"
             */
            enableManual?: string;
            /** disable swapping for manual routes. By default it is false */
            disableSwapping?: string;
            /** disable auto routes. By default it is false */
            disableAuto?: string;
            /** Bridges to exclude in manual routes. Only applicable to manual routes */
            excludeBridges?: string;
            /** Dexes to include while routing via manual routes. Only applicable to manual */
            includeDexes?: string;
            /** Dexes to exclude in manual routes. Only applicable to manual routes */
            excludeDexes?: string;
            /** Bridges to include while routing via manual routes. Only applicable to manual */
            includeBridges?: string;
            /** exclusive requests can be sent by putting in an identifier address of the transmitter */
            exclusiveTransmitter?: string;
            /** use inbox to send request to the inbox. By default it is false. Only applicable to auto routes */
            useInbox?: string;
            /**
             * Enable multiple auto routes with different optimizations
             * @default false
             */
            enableMultipleAutoRoutes?: string;
            /** Returns Quotes that require transferring funds to a deposit address which executes the bridging/cross-chain swap */
            useDepositAddress?: string;
            /** Returns Quotes via the new Socket Core deposit flow (requires refundAddress) */
            enableDepositAddress?: string;
            /** Address to refund the funds to. Required when enableDepositAddress is true. */
            refundAddress?: string;
            /** Destination chain memo for the receiver address. Only applicable for Stellar source chains. */
            depositDestinationMemo?: string;
        };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = SuccessResponseDto & {
            result?: BungeeQuoteResponseDto;
        };
    }
}
