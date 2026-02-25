# pt-bridger

This script helps performing the bridging and swapping PT with another token. Basically it allows to do the following actions sequentially, in one go:

- Bridge PT from chain `A` to chain `B` (via LayerZero natively);
- Swap PT to another token on chain `B` (via PendleRouter);
- Bridge the token from chain `B` back to chain `A` (via Bungee).

This 2-way bridging is required as the bridged PT need to be bridged back to its original chain in order to swap with another token.

# Demo

![](./media/demo.gif)

# Usage

## Installation

Clone this repo. Run

```sh
yarn install
```

## Filling parameters in the environment

Copy `.env.example` to `.env` and fill in the parameters.

- Note that the parameters uses the naming convention for chain `A` and chain `B`.
    - Chain `A` is where the **bridged** PT is deployed.
    - Chain `B` is where the **original** PT is deployed.
- `PRIVATE_KEY` is used to derive your account on both chain `A` and chain `B` to.
    - All tokens are sent to your account in every action.
- `RAW_AMOUNT` is the amount of bridged PT you want to swap, in wei.
    - Foundry command like `cast to-wei` and `cast to-unit` is helpful to convert between units.

An example of an `.env` file for bridging and swapping bridged 15 PT USDai (2026JUN) on **unichain** to USDC.

```sh
PRIVATE_KEY=0xYourPrivateKey

RAW_AMOUNT=15000000000000000000 # 15 * 10**18 (as the PT has 18 decimals)
SLIPPAGE=0.005 # 0.5%

A_RPC_URL=https://rpc-url-for-unichain
A_OFT=0xa6656e5456809b028c05531ad20dc2897b4dad91 # bridged PT address on unichain
A_TOKEN=0x078D782b760474a361dDA0AF3839290b0EF57AD6 # usdc on unichain

B_RPC_URL=https://rpc-url-for-arbitrum # arbitrum is where the original PT USDai (2026JUN) is deployed
B_TOKEN=0xaf88d065e77c8cC2239327C5EDb3A432268e5831 # usdc on arbitrum
```

### Where to find the addresses

- The bridge PT address can be found directly on Pendle APP:

| Click the `Specs` button                                  | See the addresses                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| ![Click the `Specs` button](./media/pendle-app-specs.png) | ![See the addresses](./media/pendle-app-bridged-pt-addresses.png) |

- The full list of tokens that is supported by Bungee can be found via Bungee's API: https://public-backend.bungee.exchange/api/v1/tokens/list

## Running the script

```sh
yarn bridge-pt-swap-bridge-back
```

This command will read the `.env` file and execute the bridge, swap, and bridge back in order.

Please note that the script **prompts** you for confirmation at every steps. If you wish to run this script without any confirmation, set the environment variable `NO_CONFIRM=1`:

```sh
NO_CONFIRM=1 yarn bridge-pt-swap-bridge-back
```

## Failure recovery/Running each steps individually

If you wish to run each steps individually to confirm the result of each steps, or to **recover from failure** from the main script `bridge-pt-swap-bridge-back`, run the following commands.

```sh
# Bridge pt from chain A to chain B
yarn bridge-pt

# swap pt to token on chain B
yarn pendle-swap-pt-to-token

# bridge token from chain B back to chain A
yarn bridge-token-via-bungee
```

These scripts are designed to be simple for recovery, therefore it will not save immediate values anywhere. They only rely on the `.env` file and the current blockchain state:

- `bridge-pt` and `pendle-swap-pt-to-token` will use `RAW_AMOUNT` as the amount to bridge/swap.
- `bridge-token-via-bungee` will **NOT** use `RAW_AMOUNT`. Instead, it will bridge **ALL** balance of token. Proceed with caution, and confirm the script's prompts at every step.

# Known issues

- Bungee will not produce any routes if the bridge amount is too small (< 1$). Check your bridging amount first.
