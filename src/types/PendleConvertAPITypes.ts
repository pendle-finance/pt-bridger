import type { Address } from 'viem';

export type PendleConvertAPIRequestBody = {
    inputs: TokenAmount[];
    outputs: Address[];
    slippage: number;

    additionalData?: string;
    aggregators?: string[];
    enableAggregator?: boolean;
    needScale?: boolean;
    okxSwapParams?: unknown; // we don't use this in this repo
    receiver?: Address;
    redeemRewards?: boolean;
    useLimitOrder?: boolean;
};

export type TokenAmount = {
    token: Address;
    amount: string;
};

export type PendleConvertAPIReponse = {
    /**
     * The action that was performed
     */
    action:
        | 'swap'
        | 'add-liquidity'
        | 'remove-liquidity'
        | 'exit-market'
        | 'transfer-liquidity'
        | 'roll-over-pt'
        | 'add-liquidity-dual'
        | 'remove-liquidity-dual'
        | 'mint-py'
        | 'redeem-py'
        | 'mint-sy'
        | 'redeem-sy'
        | 'pendle-swap'
        | 'convert-lp-to-pt';
    /**
     * Input token amounts for the action
     */
    inputs: TokenAmount[];
    requiredApprovals?: TokenAmount[];
    routes: {
        /**
         * Contract params info
         */
        contractParamInfo: {
            /**
             * Method name
             */
            method: string;
            /**
             * Contract call parameters name
             */
            contractCallParamsName: string[];
            /**
             * Contract call parameters
             */
            contractCallParams: unknown[][];
        };
        /**
         * Transaction data
         */
        tx: {
            /**
             * Transaction data
             */
            data: string;
            /**
             * Transaction receiver
             */
            to: string;
            /**
             * Transaction sender
             */
            from: string;
            /**
             * Transaction value
             */
            value: string;
        };
        /**
         * Output token amounts from the action
         */
        outputs: TokenAmount[];
        data: {
            aggregatorType: string;
            priceImpact: number;
            impliedApy?: {
                before: number;
                after: number;
            };
            priceImpactBreakDown: {
                internalPriceImpact: number;
                externalPriceImpact: number;
            };
            effectiveApy?: number;
            /**
             * Parameter breakdown for transfer liquidity
             */
            paramsBreakdown?: {
                selfCall1: {
                    /**
                     * Method name
                     */
                    method: string;
                    /**
                     * Contract call parameters name
                     */
                    contractCallParamsName: string[];
                    /**
                     * Contract call parameters
                     */
                    contractCallParams: unknown[][];
                };
                selfCall2?: {
                    /**
                     * Method name
                     */
                    method: string;
                    /**
                     * Contract call parameters name
                     */
                    contractCallParamsName: string[];
                    /**
                     * Contract call parameters
                     */
                    contractCallParams: unknown[][];
                };
                reflectCall: {
                    /**
                     * Method name
                     */
                    method: string;
                    /**
                     * Contract call parameters name
                     */
                    contractCallParamsName: string[];
                    /**
                     * Contract call parameters
                     */
                    contractCallParams: unknown[][];
                };
            };
            /**
             * Fee in USD
             */
            fee?: {
                usd: number;
            };
        };
    }[];
    /**
     * Reward token amounts from redeem action
     */
    rewards?: TokenAmount[];
};
