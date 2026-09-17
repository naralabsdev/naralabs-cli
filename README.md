# NaraLabs CLI

Developer CLI for NaraLabs Registry (SEP-0048 event schemas).

Schema files use **`naralabs.schema.yaml`**. Most Soroban contracts emit events without on-chain metadata — developers map topics and params manually before publish.

## Install

```bash
npx @naralabs/cli@latest
npm install -g @naralabs/cli
```

## Happy path

```bash
# 1. Auth — token from NaraLabs Dashboard
naralabs auth nl_live_your_token_here

# 2. Initialize project folder (prompts for contract ID)
naralabs init my-schema

# 3. Edit naralabs.schema.yaml — events, prefix_topics, params

# 4. Validate locally
cd my-schema
naralabs registry validate

# 5. Publish to Registry API
naralabs registry publish
```

## Commands

| Command | Description |
|---------|-------------|
| `naralabs auth <TOKEN>` | Save publish token |
| `naralabs init <folder>` | Verify contract + write `naralabs.schema.yaml` |
| `naralabs config set api-url <url>` | Set API URL |
| `naralabs config set network testnet` | Set default network |
| `naralabs registry init <contract-id>` | Verify contract + write schema YAML |
| `naralabs registry validate [file]` | Validate schema file |
| `naralabs registry publish [file]` | Publish to Registry |
| `naralabs registry status [file]` | Show local schema info |

## Schema file

When WASM has **no event metadata**, `init` writes a **starter template** (`source: manual`). Edit:

- `events[].name` — semantic event name for explorers
- `prefix_topics` — topic symbols your contract emits (order matters)
- `params` — field names, types, and `location` (`data` or `topic_list`)

Contracts with modern `#[contractevent]` metadata may pre-fill events — still review before publish.

## CI

```bash
export NARALABS_DEPLOY_TOKEN=nl_live_...
naralabs registry validate
naralabs registry publish
```

## Maintainer

- **Indra Mahesa** ([@zinct](https://github.com/zinct)) · indramahesa128@gmail.com
