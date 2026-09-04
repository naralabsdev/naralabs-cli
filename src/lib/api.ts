import type { ContractBundle } from "./schema-validate.js";
import { loadConfig } from "./config.js";

type ApiEnvelope<T> = {
  code: string;
  message: string;
  data: T;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cfg = loadConfig();
  const token = cfg.deployToken;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${cfg.apiUrl}${path}`, { ...init, headers });
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok) {
    throw new Error(body.message ?? `API error ${res.status}`);
  }
  return body.data;
}

export async function registerContract(contract: string, network: string) {
  return apiFetch("/v1/contracts", {
    method: "POST",
    body: JSON.stringify({ contract_id: contract, network }),
  });
}

export async function publishBundle(bundle: ContractBundle) {
  return apiFetch("/v1/contracts/publish", {
    method: "POST",
    body: JSON.stringify(bundle),
  });
}

export async function createPublishToken(jwt: string, name?: string) {
  return apiFetch<{ token: string }>("/v1/tokens", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ name }),
  });
}
