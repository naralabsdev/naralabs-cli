export const PUBLISH_TOKEN_PREFIX = "nl_live_";

export function validatePublishToken(token?: string): string {
  const value = token?.trim();
  if (!value) {
    throw new Error("Usage: naralabs auth <nl_live_...>");
  }
  if (!value.startsWith(PUBLISH_TOKEN_PREFIX)) {
    throw new Error("Publish token must start with nl_live_.");
  }
  if (value.length < PUBLISH_TOKEN_PREFIX.length + 8) {
    throw new Error("Publish token looks incomplete.");
  }
  return value;
}

export function resolvePublishToken(explicit?: string): string | undefined {
  const fromFlag = explicit?.trim();
  if (fromFlag) return fromFlag;

  const fromEnv = process.env.NARALABS_DEPLOY_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  return undefined;
}

export function requirePublishToken(explicit?: string): string {
  const token = resolvePublishToken(explicit);
  if (!token) {
    throw new Error("Publish token required. Set NARALABS_DEPLOY_TOKEN or pass --token nl_live_…");
  }
  return validatePublishToken(token);
}

export function printTokenUsageHint(): void {
  console.log("\n  Token is not saved to disk.");
  console.log("  export NARALABS_DEPLOY_TOKEN=nl_live_…");
  console.log("  # or: naralabs registry publish --token nl_live_…\n");
}
