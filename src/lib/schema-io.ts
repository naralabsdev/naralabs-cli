import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parse, stringify } from "yaml";

import type { ContractBundle } from "./schema-validate.js";

const SCHEMA_HEADER = `# NaraLabs event schema
# Contracts without on-chain event metadata require manual edits before publish.
# Map each event's prefix_topics and params to what your contract emits on-chain.

`;

export function readSchemaFile(path: string): ContractBundle {
  const raw = readFileSync(path, "utf8");
  const bundle = parse(raw) as ContractBundle;
  if (!bundle || typeof bundle !== "object") {
    throw new Error("Schema file is empty or invalid.");
  }
  return bundle;
}

export function writeSchemaFile(outputPath: string, bundle: ContractBundle): void {
  mkdirSync(dirname(outputPath), { recursive: true });
  const body = stringify(bundle, {
    lineWidth: 0,
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
  });
  writeFileSync(outputPath, `${SCHEMA_HEADER}${body}`);
}
