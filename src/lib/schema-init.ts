import { resolve } from "node:path";
import { StrKey } from "@stellar/stellar-sdk";
import { parseContractMetadata } from "@stellar-expert/contract-wasm-interface-parser";

import { DEFAULT_SCHEMA_FILE, loadConfig } from "./config.js";
import { promptLine } from "./prompt.js";
import { fetchWasm, rpcUrlForNetwork } from "./rpc.js";
import { writeSchemaFile } from "./schema-io.js";
import { transformParserToBundle } from "./schema-generate.js";
import { createStarterBundle } from "./schema-template.js";
import type { ContractBundle } from "./schema-validate.js";

const CONTRACT_ID_LENGTH = 56;

export class ContractLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractLookupError";
  }
}

export function validateContractIdFormat(contractId: string): void {
  const id = contractId.trim();

  if (!id.startsWith("C")) {
    throw new ContractLookupError("Contract ID must start with C.");
  }

  if (id.length !== CONTRACT_ID_LENGTH) {
    throw new ContractLookupError(
      `Incomplete contract ID (${id.length}/${CONTRACT_ID_LENGTH} characters).`,
    );
  }

  try {
    StrKey.decodeContract(id);
  } catch {
    throw new ContractLookupError("Invalid contract ID.");
  }
}

function friendlyLookupError(err: unknown, contractId: string): string {
  if (err instanceof ContractLookupError) {
    return err.message;
  }

  const msg = err instanceof Error ? err.message : String(err);

  if (/not found|404|missing|does not exist|Entry not found/i.test(msg)) {
    return `Contract not found on this network: ${contractId}`;
  }
  if (/fetch failed|network|timeout|ECONNREFUSED/i.test(msg)) {
    return "Could not reach Stellar RPC.";
  }

  return "Could not verify contract.";
}

export async function verifyContract(rpcUrl: string, contractId: string): Promise<Buffer> {
  const id = contractId.trim();
  validateContractIdFormat(id);

  try {
    return await fetchWasm(rpcUrl, id);
  } catch (err) {
    throw new ContractLookupError(friendlyLookupError(err, id));
  }
}

export async function promptUntilValidContract(
  rpcUrl: string,
  network: string,
): Promise<string> {
  console.log(`\n  Network  ${network}\n`);

  while (true) {
    const contractId = await promptLine("  Contract ID › ");

    if (!contractId) {
      console.log("  ✗ Required.\n");
      continue;
    }

    process.stdout.write("  Verifying… ");
    try {
      await verifyContract(rpcUrl, contractId);
      console.log("ok\n");
      return contractId.trim();
    } catch (err) {
      console.log("failed\n");
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ ${message}\n`);
    }
  }
}

export async function generateSchemaBundle(
  rpcUrl: string,
  contractId: string,
  network: string,
): Promise<{ bundle: ContractBundle; manual: boolean }> {
  const wasm = await verifyContract(rpcUrl, contractId);
  const parsed = parseContractMetadata(wasm) as ReturnType<typeof parseContractMetadata>;
  const auto = transformParserToBundle(parsed as never, contractId.trim(), network);

  if (auto.events.length > 0) {
    return { bundle: auto, manual: false };
  }

  return {
    bundle: createStarterBundle(contractId.trim(), network),
    manual: true,
  };
}

export type InitProjectOptions = {
  network?: string;
  rpcUrl?: string;
  contractId?: string;
  outputPath?: string;
};

function logInitResult(bundle: ContractBundle, manual: boolean): void {
  if (manual) {
    console.log("ok\n  ✗ No events in contract metadata.");
    console.log("  Edit naralabs.schema.yaml — map topics and params to your contract.\n");
    return;
  }

  const names = bundle.events.map((event) => event.name);
  console.log(`ok\n  ✓ ${names.length} event(s) detected — review before publish.\n`);
}

export async function initProjectFolder(
  folderName: string,
  opts: InitProjectOptions = {},
): Promise<{ outputPath: string; bundle: ContractBundle; projectDir: string }> {
  const cfg = loadConfig();
  const network = opts.network ?? cfg.network ?? "testnet";
  const rpcUrl = rpcUrlForNetwork(network, opts.rpcUrl);
  const projectDir = resolve(process.cwd(), folderName);
  const outputPath = opts.outputPath ?? resolve(projectDir, DEFAULT_SCHEMA_FILE);

  console.log(`\n  Project  ./${folderName}/\n`);

  const contractId =
    opts.contractId?.trim() || (await promptUntilValidContract(rpcUrl, network));

  process.stdout.write("  Reading WASM… ");
  const { bundle, manual } = await generateSchemaBundle(rpcUrl, contractId, network);
  logInitResult(bundle, manual);

  writeSchemaFile(outputPath, bundle);

  console.log(`  ✓ ${folderName}/${DEFAULT_SCHEMA_FILE}`);
  if (manual) {
    console.log("  Edit events, prefix_topics, and params before publish.");
  }
  console.log(`\n  cd ${folderName}`);
  console.log("  naralabs registry validate");
  console.log("  naralabs registry publish\n");

  return { outputPath, bundle, projectDir };
}

export async function initSchemaFile(
  contractId: string,
  opts: InitProjectOptions = {},
): Promise<{ outputPath: string; bundle: ContractBundle }> {
  const cfg = loadConfig();
  const network = opts.network ?? cfg.network ?? "testnet";
  const rpcUrl = rpcUrlForNetwork(network, opts.rpcUrl);
  const outputPath = resolve(process.cwd(), opts.outputPath ?? DEFAULT_SCHEMA_FILE);

  process.stdout.write("  Reading WASM… ");
  const { bundle, manual } = await generateSchemaBundle(rpcUrl, contractId, network);
  logInitResult(bundle, manual);

  writeSchemaFile(outputPath, bundle);
  return { outputPath, bundle };
}
