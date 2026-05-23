import { Interface } from "ethers/abi";
import { Transaction } from "ethers/transaction";
import { parseUnits } from "ethers/utils";
import { Vault } from "./vault.js";

export class Blockchain {
  /**
   * @param {string} rpcUrl
   * @param {number} chainId
   */
  constructor(rpcUrl, chainId) {
    this.rpcUrl = rpcUrl;
    this.chainId = chainId;
    this.vault = new Vault();
  }

  /**
   * @param {string} method
   * @param {unknown[]} [params]
   */
  async #rpcCall(method, params = []) {
    const raw = await teeify.fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const json = JSON.parse(raw);
    if (json.error) throw new Error(`RPC Error: ${json.error.message}`);
    return json.result;
  }

  /**
   * @param {string} contractAddress
   * @param {import("ethers").JsonFragment[] | string[]} abi
   * @param {string} method
   * @param {unknown[]} [params]
   */
  async read(contractAddress, abi, method, params = []) {
    const iface = new Interface(abi);
    const data = iface.encodeFunctionData(method, params);
    const result = await this.#rpcCall("eth_call", [
      { to: contractAddress, data },
      "latest",
    ]);
    const decoded = iface.decodeFunctionResult(method, result);
    return decoded.length === 1 ? decoded[0] : decoded;
  }

  /**
   * @param {string} contractAddress
   * @param {import("ethers").JsonFragment[] | string[]} abi
   * @param {string} method
   * @param {unknown[]} [params]
   * @param {{
   *   gasLimit?: bigint;
   *   maxFeePerGas?: bigint;
   *   maxPriorityFeePerGas?: bigint;
   *   value?: bigint;
   * }} [options]
   * @returns {Promise<{ hash: string }>}
   */
  async send(contractAddress, abi, method, params = [], options = {}) {
    const iface = new Interface(abi);
    const data = iface.encodeFunctionData(method, params);

    const nonceHex = await this.#rpcCall("eth_getTransactionCount", [
      this.vault.address(),
      "latest",
    ]);
    const nonce = Number.parseInt(String(nonceHex), 16);

    const gasLimit = options.gasLimit ?? 150_000n;
    const maxPriorityFeePerGas =
      options.maxPriorityFeePerGas ?? parseUnits("1", "gwei");
    const maxFeePerGas = options.maxFeePerGas ?? parseUnits("2", "gwei");
    const value = options.value ?? 0n;

    const tx = Transaction.from({
      type: 2,
      chainId: this.chainId,
      nonce,
      to: contractAddress,
      data,
      gasLimit,
      maxPriorityFeePerGas,
      maxFeePerGas,
      value,
    });

    const signature = await teeify.signTransaction(tx.unsignedHash);
    tx.signature = signature;

    const hash = await this.#rpcCall("eth_sendRawTransaction", [tx.serialized]);
    return { hash };
  }
}
