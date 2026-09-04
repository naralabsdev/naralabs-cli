# NaraLabs CLI — Agent Rules

TypeScript CLI for NaraLabs Registry. Pairs with `naralabs-backend` (API) and `naralabs` (frontend).

## Stack

- Node **>=18**
- **commander** (CLI)
- **@stellar-expert/contract-wasm-interface-parser** (WASM → schema)
- **@stellar/stellar-sdk** (RPC)

## Structure

```
src/
  index.ts          # CLI entry + commands
  lib/              # config, rpc, api, schema-generate, schema-validate
  types/
```

Binary: **`naralabs`** · npm: **`@naralabs/cli`**

## Validasi sebelum selesai

```bash
npm run build
npm test
```

## Skill

| Skill | Path |
|-------|------|
| Backend architecture | `../naralabs-backend/.cursor/skills/naralabs-backend-architecture/` |
| Frontend architecture | `../naralabs/.cursor/skills/naralabs-architecture/` |
