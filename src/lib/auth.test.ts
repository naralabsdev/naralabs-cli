import test from "node:test";
import assert from "node:assert/strict";
import {
  PUBLISH_TOKEN_ENV,
  requirePublishToken,
  resolvePublishToken,
  validatePublishToken,
} from "./auth.js";

test("validatePublishToken rejects empty", () => {
  assert.throws(() => validatePublishToken(""), /Usage:/);
});

test("validatePublishToken rejects bad prefix", () => {
  assert.throws(() => validatePublishToken("bad_token"), /nl_live_/);
});

test("resolvePublishToken prefers explicit arg over env", () => {
  const prev = process.env[PUBLISH_TOKEN_ENV];
  process.env[PUBLISH_TOKEN_ENV] = "nl_live_from_env";
  assert.equal(resolvePublishToken("nl_live_from_arg"), "nl_live_from_arg");
  process.env[PUBLISH_TOKEN_ENV] = prev;
});

test("requirePublishToken reads env", () => {
  const prev = process.env[PUBLISH_TOKEN_ENV];
  process.env[PUBLISH_TOKEN_ENV] = "nl_live_0123456789abcdef";
  assert.equal(requirePublishToken(), "nl_live_0123456789abcdef");
  process.env[PUBLISH_TOKEN_ENV] = prev;
});

test("requirePublishToken mentions env var when missing", () => {
  const prev = process.env[PUBLISH_TOKEN_ENV];
  delete process.env[PUBLISH_TOKEN_ENV];
  assert.throws(() => requirePublishToken(), /NARALABS_DEPLOY_TOKEN/);
  process.env[PUBLISH_TOKEN_ENV] = prev;
});
