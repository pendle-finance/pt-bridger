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

export interface BungeeSwapReqBodyDto {
    /**
     * Request Object
     * @example {"basicReq":{"originChainId":42161,"destinationChainId":10,"deadline":2060163137,"nonce":"1744389040","sender":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","receiver":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","delegate":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","bungeeGateway":"0xcdea28ee7bd5bf7710b294d9391e1b6a318d809a","switchboardId":1,"inputToken":"0xaf88d065e77c8cC2239327C5EDb3A432268e5831","inputAmount":"10000000","outputToken":"0x0b2c639c533813f4aa9d7837caf62653d097ff85","minOutputAmount":"9893610","refuelAmount":"0"},"swapOutputToken":"0x0000000000000000000000000000000000000000","minSwapOutput":"0","metadata":"0x0000000000000000000000000000000000000000000000000000000000042069","affiliateFees":"0x","minDestGas":"0","destinationPayload":"0x","exclusiveTransmitter":"0x0000000000000000000000000000000000000000"}
     */
    request: SingleOutputRequestDto | SwapRequestDto;
    /**
     * User signature, which will validate the request
     * @example "0xcde35e56adce0e0e1db5527047796b4d4fc7e31bc0482eca28602a0e3ff60a361b45dae96418296b8479bbdf6b1a15c2a137ee74a47fb0c692b9a2cb629266a41b"
     */
    userSignature: string;
    /**
     * Request type, indicating same chain or cross chain swap
     * @example "SINGLE_OUTPUT_REQUEST"
     */
    requestType: 'SINGLE_OUTPUT_REQUEST' | 'SWAP_REQUEST';
    /**
     * Quote ID
     * @example "889600e36fd5121ff1d94d6c49ce306a"
     */
    quoteId?: string;
}

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

export interface BaseBungeeSavedRequestDto {
    /** Input tokens */
    inputTokens: InputTokenDetailsDto[];
    /** Output tokens. Either an array of OutputTokenDetailsDto (for cross-chain: SINGLE_OUTPUT_REQUEST) or a single OutputTokenDetailsDto (for swaps: SWAP_REQUEST) */
    outputTokens: OutputTokenDetailsDto[] | OutputTokenDetailsDto;
    /**
     * Timestamp at which order was placed
     * @format date-time
     */
    orderTimestamp: string;
    /** Current status of the order */
    status: 'PENDING' | 'ASSIGNED' | 'EXTRACTED' | 'FULFILLED' | 'SETTLED' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';
    /** Numeric status code of the order */
    statusCode: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    /** Request hash */
    requestHash: string;
    /** Original sender address */
    ogSender: string;
    /** Source of the request */
    requestSource: string;
    /** User signature */
    userSignature: string;
    /** Type of request */
    requestType: 'SINGLE_OUTPUT_REQUEST' | 'SWAP_REQUEST';
    /** Request details */
    request: SingleOutputRequestDto | SwapRequestDto;
    /**
     * Creation timestamp
     * @format date-time
     */
    createdAt: string;
    /**
     * Last update timestamp
     * @format date-time
     */
    updatedAt: string;
}

export interface SingleOutputRequestDto {
    /** Basic request parameters */
    basicReq: SORBasicRequestDto;
    /**
     * Swap output token address
     * @example "0x0000000000000000000000000000000000000000"
     */
    swapOutputToken: string;
    /**
     * Minimum swap output amount
     * @example "0"
     */
    minSwapOutput: string;
    /**
     * Request metadata
     * @example "0x0000000000000000000000000000000000000000000000000000000000042069"
     */
    metadata: string;
    /**
     * Affiliate fees
     * @example "0x"
     */
    affiliateFees: string;
    /**
     * Minimum destination gas
     * @example "0"
     */
    minDestGas: string;
    /**
     * Destination payload
     * @example "0x"
     */
    destinationPayload: string;
    /**
     * Exclusive transmitter address
     * @example "0x0000000000000000000000000000000000000000"
     */
    exclusiveTransmitter: string;
}

export interface SwapRequestDto {
    /** Basic request parameters */
    basicReq: SwapBasicRequestDto;
    /**
     * Request metadata
     * @example "0x0000000000000000000000000000000000000000000000000000000000042069"
     */
    metadata: string;
    /**
     * Affiliate fees
     * @example "0x"
     */
    affiliateFees: string;
    /**
     * Minimum destination gas
     * @example "0"
     */
    minDestGas: string;
    /**
     * Destination payload
     * @example "0x"
     */
    destinationPayload: string;
    /**
     * Exclusive transmitter address
     * @example "0x0000000000000000000000000000000000000000"
     */
    exclusiveTransmitter: string;
}

export interface InputTokenDetailsDto {
    /** token asset object */
    token: TokenAssetDto;
    /** token amount in wei */
    amount: string;
    /** ChainId of the token */
    chainId: number;
    /**
     * Value of the token amount in USD
     * @default 0
     */
    valueInUsd: number;
    /**
     * Current price of the token in USD
     * @default 0
     */
    priceInUsd: number;
}

export interface OutputTokenDetailsDto {
    /** token asset object */
    token: TokenAssetDto;
    /** token min output amount in wei */
    minAmountOut: string;
    /** token promised amount in wei */
    promisedAmount: string;
    /** token actual fulfilled amount in wei */
    fulfilledAmount: string;
    /** ChainId of the token */
    chainId: number;
    /**
     * Value of the minimum amount in USD
     * @default 0
     */
    minAmountOutInUsd: number;
    /**
     * Value of the fulfilled amount in USD
     * @default 0
     */
    fulfilValueInUsd: number;
    /**
     * Current price of the token in USD
     * @default 0
     */
    priceInUsd: number;
}

export interface SORBasicRequestDto {
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
     * Transaction deadline timestamp
     * @example 2060163137
     */
    deadline: string;
    /**
     * Nonce value
     * @example "1744389040"
     */
    nonce: string;
    /**
     * Sender address
     * @example "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
     */
    sender: string;
    /**
     * Receiver address
     * @example "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
     */
    receiver: string;
    /**
     * Delegate address
     * @example "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
     */
    delegate: string;
    /**
     * Bungee gateway address
     * @example "0xcdea28ee7bd5bf7710b294d9391e1b6a318d809a"
     */
    bungeeGateway: string;
    /**
     * Switchboard ID
     * @example 1
     */
    switchboardId: number;
    /**
     * Input token address
     * @example "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
     */
    inputToken: string;
    /**
     * Input amount
     * @example "10000000"
     */
    inputAmount: string;
    /**
     * Output token address
     * @example "0x0b2c639c533813f4aa9d7837caf62653d097ff85"
     */
    outputToken: string;
    /**
     * Minimum output amount
     * @example "9893610"
     */
    minOutputAmount: string;
    /**
     * Refuel amount
     * @example "0"
     */
    refuelAmount: string;
}

export interface SwapBasicRequestDto {
    /**
     * Chain ID
     * @example 42161
     */
    chainId: number;
    /**
     * Transaction deadline timestamp
     * @example 2060163137
     */
    deadline: number;
    /**
     * Nonce value
     * @example "1744389040"
     */
    nonce: string;
    /**
     * Sender address
     * @example "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
     */
    sender: string;
    /**
     * Receiver address
     * @example "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
     */
    receiver: string;
    /**
     * Bungee gateway address
     * @example "0xcdea28ee7bd5bf7710b294d9391e1b6a318d809a"
     */
    bungeeGateway: string;
    /**
     * Input token address
     * @example "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
     */
    inputToken: string;
    /**
     * Input amount
     * @example "10000000"
     */
    inputAmount: string;
    /**
     * Output token address
     * @example "0x0b2c639c533813f4aa9d7837caf62653d097ff85"
     */
    outputToken: string;
    /**
     * Minimum output amount
     * @example "9893610"
     */
    minOutputAmount: string;
}

export interface TokenAssetDto {
    /**
     * Chain ID of the token
     * @example 59144
     */
    chainId: number;
    /**
     * Token address
     * @example "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f"
     */
    address: string;
    /**
     * Token name
     * @example "Bridged Wrapped Ether Linea"
     */
    name: string;
    /**
     * Token symbol
     * @example "WETH"
     */
    symbol: string;
    /**
     * Token decimals
     * @example 18
     */
    decimals: number;
    /**
     * Logo URI
     * @example "https://coin-images.coingecko.com/coins/images/31019/large/download_%2817%29.png?1696529855"
     */
    logoURI?: string | null;
    /**
     * Icon URI
     * @example "https://coin-images.coingecko.com/coins/images/31019/large/download_%2817%29.png?1696529855"
     */
    icon?: string | null;
    /** Chain agnostic ID */
    chainAgnosticId?: string | null;
    /** CoinGecko ID */
    cgId?: string | null;
}

export namespace Api {
    /**
     * No description
     * @tags Core API
     * @name BungeeControllerSubmitBungeeRequestV1
     * @summary Submit request (Auto)
     * @request POST:/api/v1/bungee/submit
     */
    export namespace BungeeControllerSubmitBungeeRequestV1 {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = BungeeSwapReqBodyDto;
        export type RequestHeaders = {};
        export type ResponseBody = SuccessResponseDto & {
            result?: BaseBungeeSavedRequestDto;
        };
    }
}
