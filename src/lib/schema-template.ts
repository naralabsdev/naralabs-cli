import type { ContractBundle } from "./schema-validate.js";

export function createStarterBundle(contract: string, network: string): ContractBundle {
  return {
    $schema: "https://naralabs.xyz/schemas/naralabs-contract/v1",
    contract,
    network,
    version: "1.0.0",
    source: "manual",
    generated_at: new Date().toISOString(),
    events: [
      {
        name: "counter_incremented",
        prefix_topics: ["cntr", "incr"],
        data_format: "single_value",
        doc: "Published on every increment.",
        params: [
          {
            name: "count",
            type: "u32",
            location: "data",
            doc: "Counter value after increment.",
          },
        ],
      },
      {
        name: "threshold_reached",
        prefix_topics: ["cntr", "thr"],
        data_format: "single_value",
        doc: "Published when count hits a multiple of 3.",
        params: [
          {
            name: "count",
            type: "u32",
            location: "data",
            doc: "Counter value at threshold.",
          },
        ],
      },
    ],
  };
}
