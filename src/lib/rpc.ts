import { rpc } from "@stellar/stellar-sdk";

export async function fetchWasm(rpcUrl: string, contractId: string): Promise<Buffer> {
  const server = new rpc.Server(rpcUrl);
  const wasm = await server.getContractWasmByContractId(contractId);
  return Buffer.from(wasm);
}

export function rpcUrlForNetwork(network: string, override?: string): string {
  if (override) return override;
  switch (network) {
    case "mainnet":
      return "https://soroban-mainnet.stellar.org";
    case "futurenet":
      return "https://rpc-futurenet.stellar.org";
    default:
      return "https://soroban-testnet.stellar.org";
  }
}
