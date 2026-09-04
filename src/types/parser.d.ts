declare module "@stellar-expert/contract-wasm-interface-parser" {
  export function parseContractMetadata(wasm: Buffer): Record<string, unknown>;
}
