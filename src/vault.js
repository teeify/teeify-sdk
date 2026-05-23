/** Hardware bridge: enclave wallet identity, secrets map, invocation input. */
export class Vault {
  address() {
    return teeify.address;
  }

  /**
   * @param {string} name
   * @returns {string | undefined}
   */
  secret(name) {
    return TEEIFY_SECRETS?.[name];
  }

  /** @returns {Record<string, unknown>} */
  input() {
    return typeof TEEIFY_REQUEST !== "undefined" ? TEEIFY_REQUEST : {};
  }
}
