import type { ContractBundle, EventSchema } from "./schema-validate.js";
import { loadConfig } from "./config.js";

export type PublishedSchema = {
  id: string;
  contractId: string;
  network: string;
  eventName: string;
  version: number;
  trustTier: string;
  status: string;
  createdAt: string;
};

function normalizeApiBaseUrl(apiUrl?: string): string {
  const raw = (apiUrl ?? "http://localhost:8080").replace(/\/$/, "");
  return raw.endsWith("/api") ? raw.slice(0, -4) : raw;
}

function parseApiError(body: unknown, status: number): string {
  if (!body || typeof body !== "object") {
    return `API error ${status}`;
  }

  const problem = body as {
    detail?: string;
    title?: string;
    message?: string;
    errors?: Array<{ message?: string; value?: string; location?: string }>;
  };

  const codeEntry = problem.errors?.find((entry) => entry.location === "code");
  return (
    problem.detail?.trim() ||
    codeEntry?.message?.trim() ||
    problem.message?.trim() ||
    problem.title?.trim() ||
    `API error ${status}`
  );
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cfg = loadConfig();
  const token = cfg.deployToken;
  const baseUrl = normalizeApiBaseUrl(cfg.apiUrl);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${baseUrl}${normalizedPath}`, { ...init, headers });
  const contentType = res.headers.get("content-type") ?? "";
  const body = contentType.includes("json") ? await res.json() : null;

  if (!res.ok) {
    throw new Error(parseApiError(body, res.status));
  }

  return body as T;
}

function eventToSchemaBody(event: EventSchema) {
  return {
    name: event.name,
    prefix_topics: event.prefix_topics,
    data_format: event.data_format,
    params: event.params,
    ...(event.doc ? { doc: event.doc } : {}),
  };
}

export async function publishEventSchema(input: {
  contractId: string;
  network: string;
  eventName: string;
  schemaBody: unknown;
  author?: string;
}) {
  return apiFetch<PublishedSchema>("/v1/schemas", {
    method: "POST",
    body: JSON.stringify({
      contractId: input.contractId,
      network: input.network,
      eventName: input.eventName,
      schemaBody: input.schemaBody,
      author: input.author,
    }),
  });
}

export async function publishBundle(bundle: ContractBundle) {
  const results: PublishedSchema[] = [];

  for (const event of bundle.events) {
    const result = await publishEventSchema({
      contractId: bundle.contract,
      network: bundle.network,
      eventName: event.name,
      schemaBody: eventToSchemaBody(event),
    });
    results.push(result);
  }

  return results;
}

export async function createPublishToken(jwt: string, name?: string) {
  return apiFetch<{ token: string; id: string; prefix: string; label: string }>("/v1/tokens", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ label: name }),
  });
}
