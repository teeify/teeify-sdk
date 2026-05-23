# @teeify/sdk — Sovereign AI Hardware Primitives

**Mission:** The standard library for building autonomous AI agents inside AWS Nitro Enclaves.

This package exposes two layers only: **Vault** (hardware and host-provided payloads) and **Blockchain** (EVM read/write). It does **not** include AI or HTTP client helpers—call models and other APIs yourself with `teeify.fetch`.

## Key Features

- **Vault**
  - `address()` — hardware wallet identity (`teeify.address`).
  - `secret(name)` — value from `TEEIFY_SECRETS` (KMS-sealed in production); `undefined` if missing.
  - `input()` — invocation payload from `TEEIFY_REQUEST` (empty object if unset).
- **Blockchain**
  - JSON-RPC over **`teeify.fetch`** only (no `JsonRpcProvider`, compatible with the enclave egress proxy).
  - **`read`** / **`send`** using targeted **`ethers`** submodules (`ethers/abi`, `ethers/transaction`, `ethers/utils`) to keep bundles smaller than pulling the full stack.
  - **Chain-agnostic:** no block explorer URLs or chain-specific UI—`send` returns **`{ hash: string }`**.
  - Optional **`send`** overrides: `gasLimit`, `maxFeePerGas`, `maxPriorityFeePerGas`, `value` (EIP-1559 type-2 transactions; hardware signing via `teeify.signTransaction`).

## Installation

```bash
npm install @teeify/sdk
```

## Usage

```javascript
import { Vault, Blockchain } from "@teeify/sdk";
const vault = new Vault();
const chain = new Blockchain(RPC_URL, CHAIN_ID);
const value = await chain.read(CONTRACT, ABI, "balanceOf", [vault.address()]);
const { hash } = await chain.send(CONTRACT, ABI, "transfer", [recipient, value]);
```

`Vault` also exposes `secret("KEY")` for `TEEIFY_SECRETS` and `input()` for `TEEIFY_REQUEST`.

## Security note

This SDK is designed specifically for Trusted Execution Environments (TEEs) and utilizes `teeify.fetch` for secure egress.

## License

Released under the [MIT License](LICENSE).
