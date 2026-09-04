export type EventParam = {
  name: string;
  type: string;
  location: "topic_list" | "data";
  doc?: string;
};

export type EventSchema = {
  name: string;
  prefix_topics: string[];
  data_format: "map" | "vec" | "single_value";
  params: EventParam[];
  doc?: string;
};

export type ContractBundle = {
  $schema?: string;
  contract: string;
  network: string;
  version: string;
  source?: string;
  generated_at?: string;
  events: EventSchema[];
};

export function validateEvent(e: EventSchema): void {
  if (!e.name?.trim()) throw new Error("event name is required");
  if (!e.prefix_topics?.length) throw new Error(`event ${e.name}: prefix_topics required`);
  if (!["map", "vec", "single_value"].includes(e.data_format)) {
    throw new Error(`event ${e.name}: invalid data_format`);
  }
  for (const p of e.params ?? []) {
    if (!p.name || !p.type || !p.location) {
      throw new Error(`event ${e.name}: param name, type, location required`);
    }
  }
}

export function validateBundle(b: ContractBundle): void {
  if (!b.contract?.trim()) throw new Error("contract is required");
  if (!b.network?.trim()) throw new Error("network is required");
  if (!b.events?.length) throw new Error("at least one event is required");
  for (const e of b.events) validateEvent(e);
}

function sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = obj[k];
      return acc;
    }, {});
}

export async function hashEvent(e: EventSchema): Promise<string> {
  const { createHash } = await import("node:crypto");
  const normalized = {
    name: e.name.toLowerCase().trim(),
    prefix_topics: [...e.prefix_topics].map((t) => t.toLowerCase()).sort(),
    data_format: e.data_format,
    params: [...(e.params ?? [])]
      .map((p) => ({
        name: p.name,
        type: p.type.toLowerCase(),
        location: p.location,
        ...(p.doc ? { doc: p.doc } : {}),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    ...(e.doc ? { doc: e.doc } : {}),
  };
  const json = JSON.stringify(sortKeys(normalized as Record<string, unknown>));
  return createHash("sha256").update(json).digest("hex");
}
