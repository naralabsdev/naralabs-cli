#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "node:path";

import { publishBundle } from "./lib/api.js";
import { loadConfig, saveConfig, CONFIG_PATH, requireSchemaPath, resolveSchemaPath } from "./lib/config.js";
import {
  ContractLookupError,
  initProjectFolder,
  initSchemaFile,
} from "./lib/schema-init.js";
import { readSchemaFile } from "./lib/schema-io.js";
import { rpcUrlForNetwork } from "./lib/rpc.js";
import { validateBundle } from "./lib/schema-validate.js";

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

program
  .command("init")
  .argument("<folder>", "Project folder (e.g. indramahesa)")
  .option("-n, --network <network>", "Network", loadConfig().network)
  .option("--rpc-url <url>", "Stellar RPC URL")
  .description("Create a schema project and write naralabs.schema.yaml")
  .action(async (folder: string, opts: { network?: string; rpcUrl?: string }) => {
    try {
      await initProjectFolder(folder, opts);
    } catch (err) {
      console.error(`\n  ✗ ${err instanceof Error ? err.message : err}\n`);
      process.exit(1);
    }
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
  .description("Verify contract and write naralabs.schema.yaml")
  .action(async (contractId: string, opts: { network?: string; output?: string; rpcUrl?: string }) => {
    const cfg = loadConfig();
    const network = opts.network ?? cfg.network ?? "testnet";
    const rpcUrl = rpcUrlForNetwork(network, opts.rpcUrl);
    const outputPath = resolve(process.cwd(), opts.output ?? resolveSchemaPath());

    console.log(`\n  Network  ${network}`);
    console.log(`  Contract ${contractId}\n`);

    try {
      const { outputPath: written } = await initSchemaFile(contractId, {
        network,
        rpcUrl,
        outputPath,
      });

      console.log(`  ✓ ${written.split("/").pop()}\n`);
    } catch (err) {
      console.error(`  ✗ ${err instanceof ContractLookupError ? err.message : err instanceof Error ? err.message : err}\n`);
      process.exit(1);
    }
  });

registry
  .command("validate")
  .argument("[file]", "Schema file (default: ./naralabs.schema.yaml)")
  .action((file?: string) => {
    const path = requireSchemaPath(file);
    const bundle = readSchemaFile(path);
    validateBundle(bundle);
    console.log(`✓ Valid ${path}`);
  });

registry
  .command("publish")
  .argument("[file]", "Schema file (default: ./naralabs.schema.yaml)")
  .option("--canonical", "Request canonical status")
  .option("--on-chain", "Also submit on-chain registry tx")
  .action(async (file?: string, opts?: { canonical?: boolean; onChain?: boolean }) => {
    const path = requireSchemaPath(file);
    const bundle = readSchemaFile(path);
    validateBundle(bundle);

    const cfg = loadConfig();
    if (!cfg.deployToken) {
      console.error("Not authenticated. Run: naralabs auth <nl_live_...>");
      process.exit(1);
    }

    const results = await publishBundle(bundle);
    console.log(`✓ Published ${results.length} event schema(s)`);
    console.log(JSON.stringify(results, null, 2));

    if (opts?.canonical) {
      console.log("ℹ Canonical status: use dashboard verify flow.");
    }
    if (opts?.onChain) {
      console.log("ℹ On-chain registry: set REGISTRY_CONTRACT_ID.");
    }
  });

registry
  .command("status")
  .argument("[file]", "Schema file")
  .action((file?: string) => {
    const path = requireSchemaPath(file);
    const bundle = readSchemaFile(path);
    console.log(`Contract: ${bundle.contract} (${bundle.network})`);
    console.log(`Source: ${bundle.source ?? "unknown"}`);
    console.log(`Events: ${bundle.events.length}`);
  });

program.parse();
