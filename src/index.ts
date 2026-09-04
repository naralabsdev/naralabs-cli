#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync, writeFileSync } from "node:fs";
import { parseContractMetadata } from "@stellar-expert/contract-wasm-interface-parser";
import { loadConfig, saveConfig, CONFIG_PATH, requireSchemaPath, resolveSchemaPath } from "./lib/config.js";
import { fetchWasm, rpcUrlForNetwork } from "./lib/rpc.js";
import { transformParserToBundle } from "./lib/schema-generate.js";
import { validateBundle, type ContractBundle } from "./lib/schema-validate.js";
import { publishBundle, registerContract } from "./lib/api.js";

const program = new Command();
program.name("naralabs").description("NaraLabs Registry CLI").version("0.1.0");

program
  .command("auth")
  .argument("[token]", "Publish token from dashboard")
  .description("Save deploy token (The Graph pattern)")
  .action((token?: string) => {
    if (!token) {
      console.error("Usage: naralabs auth <nl_live_...>");
      process.exit(1);
    }
    saveConfig({ deployToken: token });
    console.log(`✓ Token saved to ${CONFIG_PATH}`);
  });

program
  .command("logout")
  .description("Remove deploy token")
  .action(() => {
    saveConfig({ deployToken: undefined });
    console.log("✓ Logged out");
  });

const configCmd = program.command("config").description("CLI settings");
configCmd
  .command("set")
  .argument("<key>", "api-url | network")
  .argument("<value>")
  .action((key: string, value: string) => {
    if (key === "api-url") saveConfig({ apiUrl: value });
    else if (key === "network") saveConfig({ network: value });
    else throw new Error(`unknown config key: ${key}`);
    console.log("✓ Config updated");
  });
configCmd.command("get").action(() => console.log(JSON.stringify(loadConfig(), null, 2)));
configCmd.command("path").action(() => console.log(CONFIG_PATH));

const registry = program.command("registry").description("Schema registry workflow");

registry
  .command("init")
  .argument("<contract-id>", "Soroban contract ID (C...)")
  .option("-n, --network <network>", "Network", loadConfig().network)
  .option("-o, --output <file>", "Output path")
  .option("--rpc-url <url>", "Stellar RPC URL")
  .action(async (contractId: string, opts: { network: string; output?: string; rpcUrl?: string }) => {
    const cfg = loadConfig();
    const network = opts.network ?? cfg.network ?? "testnet";
    const rpcUrl = rpcUrlForNetwork(network, opts.rpcUrl);

    console.log("Analyzing contract...");
    const wasm = await fetchWasm(rpcUrl, contractId);
    console.log("✓ Contract found");
    console.log("✓ WASM found");

    const parsed = parseContractMetadata(wasm) as ReturnType<typeof parseContractMetadata>;
    const bundle = transformParserToBundle(parsed as never, contractId, network);
    const count = bundle.events.length;
    console.log(`✓ Events detected${count ? `: ${bundle.events.map((e) => e.name).join(", ")}` : ""}`);

    const out = opts.output ?? resolveSchemaPath();
    writeFileSync(out, JSON.stringify(bundle, null, 2));
    console.log("Generating schema...");
    console.log(`✓ Created ${out.split("/").pop()}`);
  });

registry
  .command("validate")
  .argument("[file]", "Schema file (default: ./naralabs.schema.json)")
  .action((file?: string) => {
    const path = requireSchemaPath(file);
    const bundle = JSON.parse(readFileSync(path, "utf8")) as ContractBundle;
    validateBundle(bundle);
    console.log(`✓ Valid ${path}`);
  });

registry
  .command("publish")
  .argument("[file]", "Schema file (default: ./naralabs.schema.json)")
  .option("--canonical", "Request canonical status")
  .option("--on-chain", "Also submit on-chain registry tx")
  .action(async (file?: string, opts?: { canonical?: boolean; onChain?: boolean }) => {
    const path = requireSchemaPath(file);
    const bundle = JSON.parse(readFileSync(path, "utf8")) as ContractBundle;
    validateBundle(bundle);

    const cfg = loadConfig();
    if (!cfg.deployToken) {
      console.error("Not authenticated. Run: naralabs auth <nl_live_...>");
      process.exit(1);
    }

    await registerContract(bundle.contract, bundle.network);
    const result = await publishBundle(bundle);
    console.log("✓ Published to Registry");
    console.log(JSON.stringify(result, null, 2));

    if (opts?.canonical) {
      console.log("ℹ --canonical: use dashboard or API POST /v1/schemas/{id}/canonicalize with authority signature");
    }
    if (opts?.onChain) {
      console.log("ℹ --on-chain: requires Registry Soroban contract deployment (REGISTRY_CONTRACT_ID)");
    }
  });

registry
  .command("status")
  .argument("[file]", "Schema file")
  .action((file?: string) => {
    const path = requireSchemaPath(file);
    const bundle = JSON.parse(readFileSync(path, "utf8")) as ContractBundle;
    console.log(`Contract: ${bundle.contract} (${bundle.network})`);
    console.log(`Events: ${bundle.events.length}`);
  });

program.parse();
