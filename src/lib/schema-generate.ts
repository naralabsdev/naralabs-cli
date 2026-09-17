import type { ContractBundle, EventSchema, EventParam } from "./schema-validate.js";

type ParserEvent = {
  prefixTopics?: string[];
  dataFormat?: string;
  params?: Array<{ name: string; type: string; location: string; doc?: string }>;
  doc?: string;
};

type ParserResult = {
  events?: Record<string, ParserEvent>;
};

function normalizeDataFormat(v?: string): EventSchema["data_format"] {
  switch ((v ?? "Map").toLowerCase()) {
    case "vec":
      return "vec";
    case "singlevalue":
    case "single_value":
    case "single":
      return "single_value";
    default:
      return "map";
  }
}

function normalizeLocation(v: string): EventParam["location"] {
  const l = v.toLowerCase();
  return l === "data" ? "data" : "topic_list";
}

function normalizeType(t: string): string {
  return t === "Address" ? "address" : t.toLowerCase();
}

function eventName(key: string, pe: ParserEvent): string {
  const fromKey = key
    .replace(/Event$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();

  if (fromKey && fromKey !== "event") {
    return fromKey;
  }

  if (pe.prefixTopics?.length) {
    return pe.prefixTopics.map((topic) => topic.toLowerCase()).join("_");
  }

  return key.toLowerCase();
}

export function transformParserToBundle(
  parsed: ParserResult,
  contract: string,
  network: string,
): ContractBundle {
  const events: EventSchema[] = [];
  for (const [key, pe] of Object.entries(parsed.events ?? {})) {
    events.push({
      name: eventName(key, pe),
      prefix_topics: (pe.prefixTopics ?? []).map((t) => t.toLowerCase()),
      data_format: normalizeDataFormat(pe.dataFormat),
      doc: pe.doc,
      params: (pe.params ?? []).map((p) => ({
        name: p.name,
        type: normalizeType(p.type),
        location: normalizeLocation(p.location),
        doc: p.doc,
      })),
    });
  }
  return {
    $schema: "https://naralabs.xyz/schemas/naralabs-contract/v1",
    contract,
    network,
    version: "1.0.0",
    source: "on_chain_metadata",
    generated_at: new Date().toISOString(),
    events,
  };
}
