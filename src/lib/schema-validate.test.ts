import test from "node:test";
import assert from "node:assert/strict";
import { hashEvent, validateEvent } from "./schema-validate.js";

test("hashEvent is deterministic", async () => {
  const e = {
    name: "transfer",
    prefix_topics: ["transfer"],
    data_format: "map" as const,
    params: [{ name: "amount", type: "i128", location: "data" as const }],
  };
  validateEvent(e);
  const h1 = await hashEvent(e);
  const h2 = await hashEvent(e);
  assert.equal(h1, h2);
  assert.equal(h1.length, 64);
});
