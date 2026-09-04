import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export type CliConfig = {
  apiUrl?: string;
  network?: string;
  deployToken?: string;
};

const CONFIG_DIR = resolve(process.env.HOME ?? process.env.USERPROFILE ?? ".", ".naralabs");
export const CONFIG_PATH = resolve(CONFIG_DIR, "config.json");
export const DEFAULT_SCHEMA_FILE = "naralabs.schema.json";

export function loadConfig(): CliConfig {
  if (!existsSync(CONFIG_PATH)) {
    return {
      apiUrl: process.env.NARALABS_API_URL ?? "http://localhost:8080/api",
      network: process.env.NARALABS_NETWORK ?? "testnet",
      deployToken: process.env.NARALABS_DEPLOY_TOKEN,
    };
  }
  const file = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as CliConfig;
  return {
    apiUrl: process.env.NARALABS_API_URL ?? file.apiUrl ?? "http://localhost:8080/api",
    network: process.env.NARALABS_NETWORK ?? file.network ?? "testnet",
    deployToken: process.env.NARALABS_DEPLOY_TOKEN ?? file.deployToken,
  };
}

export function saveConfig(partial: CliConfig): void {
  const current = existsSync(CONFIG_PATH) ? loadConfig() : {};
  const merged = { ...current, ...partial };
  writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2));
}

export function resolveSchemaPath(file?: string): string {
  if (file) return resolve(process.cwd(), file);
  return resolve(process.cwd(), DEFAULT_SCHEMA_FILE);
}

export function requireSchemaPath(file?: string): string {
  const p = resolveSchemaPath(file);
  if (!existsSync(p)) {
    throw new Error(
      `No ${DEFAULT_SCHEMA_FILE} found. Run \`naralabs registry init <contract-id>\` or pass a file path.`,
    );
  }
  return p;
}
