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

export interface BungeeRequestStatusResponseDto {
  /**
   * Bungee request/transaction hash
   * @example "0x81d3ab91773de5524ccdfce923c634574593279f000c7c43c0f958ce643cf944"
   */
  hash: string;
  /** Origin data including input tokens */
  originData: BungeeOriginData;
  /** Destination data including output tokens */
  destinationData: BungeeDestinationData;
  /** Route details */
  routeDetails: BungeeRouteDetails;
  /**
   * Bungee status code
   * @example 0
   */
  bungeeStatusCode: number;
  /** Refund information if the transaction was refunded */
  refund?: BungeeRefundDto | null;
}

export interface BungeeOriginData {
  /** Input tokens */
  input: StatusInputTokenDto[];
  /**
   * Origin chain ID
   * @example 59144
   */
  originChainId: number;
  /**
   * Transaction hash on the origin chain
   * @example "0xbd7c134d35b6582ddc0a3ae1c8b27db03cd785f4c8e3318eb3566aebcf850784"
   */
  txHash: string;
  /**
   * Status of the origin transaction
   * @example "COMPLETED"
   */
  status: string;
  /**
   * User address
   * @example "0xBbe2c47dD59Ebc27204eB3437605b8c86F054a69"
   */
  userAddress: string;
  /**
   * Timestamp of the origin transaction
   * @example 1714550400
   */
  timestamp: number;
}

export interface BungeeDestinationData {
  /** Output tokens */
  output: StatusOutputTokenDto[];
  /**
   * Destination chain ID
   * @example 42161
   */
  destinationChainId: number;
  /**
   * Transaction hash on the destination chain
   * @example "0xd2aef7a3427406b77d359ef27fa53bab86c544d1121ea2f6b4003599ae4a542e"
   */
  txHash: string;
  /**
   * Status of the destination transaction
   * @example "COMPLETED"
   */
  status: string;
  /**
   * Receiver address
   * @example "0x5291dcBd487880F591eA2B2216098ef5B7e18d93"
   */
  receiverAddress: string;
  /**
   * Timestamp of the destination transaction
   * @example 1714550400
   */
  timestamp: number;
}

export interface BungeeRouteDetails {
  /**
   * Route name
   * @example "bungee-protocol"
   */
  name: string;
  /**
   * Route logo URL
   * @example "https://www.socketscan.io/new-bungee-icon.svg"
   */
  logoURI: string;
}

export interface BungeeRefundDto {
  /**
   * Chain ID where the refund occurred
   * @example 42161
   */
  chainId: number;
  /**
   * Transaction hash of the refund
   * @example "0xbd7c134d35b6582ddc0a3ae1c8b27db03cd785f4c8e3318eb3566aebcf850784"
   */
  txHash: string;
}

export interface StatusInputTokenDto {
  /** Token information */
  token: TokenDto;
  /**
   * Token amount in wei
   * @example "10000000"
   */
  amount: string;
  /**
   * Token price in USD
   * @example 1
   */
  priceInUsd: number;
  /**
   * Value of the token amount in USD
   * @example 10
   */
  valueInUsd: number;
}

export interface StatusOutputTokenDto {
  /** Token information */
  token: TokenDto;
  /**
   * Actual token amount received
   * @example "9834231"
   */
  amount: string;
  /**
   * Token price in USD
   * @example 1
   */
  priceInUsd: number;
  /**
   * Value of the token amount in USD
   * @example 9.834231
   */
  valueInUsd: number;
  /**
   * Minimum amount to be received
   * @example "9834231"
   */
  minAmountOut: string;
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

export namespace Api {
  /**
   * No description
   * @tags Core API
   * @name BungeeControllerReqStatusV1
   * @summary Get Request status
   * @request GET:/api/v1/bungee/status
   */
  export namespace BungeeControllerReqStatusV1 {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Request Hash from Bungee Auto, either requestHash or txHash should be present.
       * @example "0xd65300d945429398ccc5e4c496e27eb628b151f20d6ea402fa37b73e4ac4a68d"
       */
      requestHash?: string;
      /** Source Transaction Hash if transaction was created, either txHash or requestHash, one of them should be present. */
      txHash?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SuccessResponseDto & {
      result?: BungeeRequestStatusResponseDto[];
    };
  }
}
