# NaraLabs CLI

Developer CLI for NaraLabs Registry (SEP-0048 event schemas).

## Install

```bash
npx @naralabs/cli@latest registry init CABC123...
npm install -g @naralabs/cli
```

## Happy path

```bash
# 1. Auth — token from NaraLabs Dashboard
naralabs auth nl_live_your_token_here

# 2. Generate schema from contract WASM
naralabs registry init CABC123...

# 3. Validate locally
naralabs registry validate

# 4. Publish to Registry API
naralabs registry publish
```

## Commands

| Command | Description |
|---------|-------------|
| `naralabs auth <TOKEN>` | Save publish token |
| `naralabs config set api-url <url>` | Set API URL |
| `naralabs config set network testnet` | Set default network |
| `naralabs registry init <contract-id>` | Fetch WASM → `naralabs.schema.json` |
| `naralabs registry validate [file]` | Validate schema file |
| `naralabs registry publish [file]` | Publish to Registry |
| `naralabs registry status [file]` | Show local schema info |

## CI

```bash
export NARALABS_DEPLOY_TOKEN=nl_live_...
naralabs registry validate
naralabs registry publish
```

## Maintainer

- **Indra Mahesa** ([@zinct](https://github.com/zinct)) · indramahesa128@gmail.com
