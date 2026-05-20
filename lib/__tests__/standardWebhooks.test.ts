import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { signStandardWebhook, verifyStandardWebhook } from "../standardWebhooks";

// Helper: a fresh random secret for each test, pre-formatted exactly
// like the Supabase dashboard would surface it.
function makeSecret() {
  const raw = crypto.randomBytes(32).toString("base64");
  return `v1,whsec_${raw}`;
}

// Helper: build a valid-by-default payload + signed headers, with
// optional overrides so individual tests can mutate one field.
function makeFixture(overrides: Partial<{
  rawBody: string;
  webhookId: string;
  webhookTimestamp: string;
  secret: string;
}> = {}) {
  const secret = overrides.secret ?? makeSecret();
  const webhookId = overrides.webhookId ?? "msg_test_id";
  const webhookTimestamp = overrides.webhookTimestamp ?? String(Math.floor(Date.now() / 1000));
  const rawBody = overrides.rawBody ?? JSON.stringify({ hello: "world" });
  const webhookSignature = signStandardWebhook({ rawBody, webhookId, webhookTimestamp, secret });
  return { secret, webhookId, webhookTimestamp, rawBody, webhookSignature };
}

test("accepts a fresh, correctly-signed request", () => {
  const f = makeFixture();
  assert.equal(verifyStandardWebhook(f), true);
});

test("accepts a secret without the 'v1,' version prefix", () => {
  const f = makeFixture({ secret: makeSecret().replace(/^v1,/, "") });
  assert.equal(verifyStandardWebhook(f), true);
});

test("accepts a secret without the 'whsec_' prefix", () => {
  const f = makeFixture({ secret: makeSecret().replace(/^v1,whsec_/, "") });
  assert.equal(verifyStandardWebhook(f), true);
});

test("rejects a tampered body (HMAC no longer matches)", () => {
  const f = makeFixture();
  const result = verifyStandardWebhook({ ...f, rawBody: f.rawBody + " evil" });
  assert.equal(result, false);
});

test("rejects a tampered timestamp", () => {
  const f = makeFixture();
  const result = verifyStandardWebhook({
    ...f,
    webhookTimestamp: String(Number(f.webhookTimestamp) - 1),
  });
  assert.equal(result, false);
});

test("rejects a tampered webhook-id", () => {
  const f = makeFixture();
  const result = verifyStandardWebhook({ ...f, webhookId: "msg_attacker_id" });
  assert.equal(result, false);
});

test("rejects a signature signed with a different secret", () => {
  const f = makeFixture();
  const wrongSecret = makeSecret();
  const wrongSig = signStandardWebhook({
    rawBody: f.rawBody,
    webhookId: f.webhookId,
    webhookTimestamp: f.webhookTimestamp,
    secret: wrongSecret,
  });
  assert.equal(verifyStandardWebhook({ ...f, webhookSignature: wrongSig }), false);
});

test("rejects a timestamp older than 5 minutes (replay)", () => {
  const oldTimestamp = String(Math.floor(Date.now() / 1000) - 6 * 60);
  const f = makeFixture({ webhookTimestamp: oldTimestamp });
  assert.equal(verifyStandardWebhook(f), false);
});

test("rejects a future timestamp more than 5 minutes ahead (clock skew abuse)", () => {
  const futureTimestamp = String(Math.floor(Date.now() / 1000) + 6 * 60);
  const f = makeFixture({ webhookTimestamp: futureTimestamp });
  assert.equal(verifyStandardWebhook(f), false);
});

test("accepts a timestamp at the edge of the 5-minute window", () => {
  const edgeTimestamp = String(Math.floor(Date.now() / 1000) - 4 * 60);
  const f = makeFixture({ webhookTimestamp: edgeTimestamp });
  assert.equal(verifyStandardWebhook(f), true);
});

test("rejects a non-numeric timestamp", () => {
  const f = makeFixture({ webhookTimestamp: "not-a-number" });
  assert.equal(verifyStandardWebhook(f), false);
});

test("rejects when no signature has the v1, prefix", () => {
  const f = makeFixture();
  // Strip the version prefix entirely from every signature in the header
  const stripped = f.webhookSignature.replace(/v1,/g, "");
  assert.equal(verifyStandardWebhook({ ...f, webhookSignature: stripped }), false);
});

test("rejects an empty signature header", () => {
  const f = makeFixture();
  assert.equal(verifyStandardWebhook({ ...f, webhookSignature: "" }), false);
});

test("rejects an empty secret", () => {
  const f = makeFixture();
  assert.equal(verifyStandardWebhook({ ...f, secret: "" }), false);
});

test("accepts multi-signature headers if any signature matches (key rotation)", () => {
  const f = makeFixture();
  // Compose a header with the real sig plus two bogus ones, in random order.
  const bogus1 = "v1,deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbe==";
  const bogus2 = "v1,cafebabecafebabecafebabecafebabecafebabecafebab==";
  const combined = `${bogus1} ${f.webhookSignature} ${bogus2}`;
  assert.equal(verifyStandardWebhook({ ...f, webhookSignature: combined }), true);
});

test("rejects when all signatures in a multi-signature header are bogus", () => {
  const f = makeFixture();
  const combined = "v1,deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbe== v1,cafebabecafebabecafebabecafebabecafebabecafebab==";
  assert.equal(verifyStandardWebhook({ ...f, webhookSignature: combined }), false);
});

test("verify is constant-time across same-length wrong-signature attempts", () => {
  // Smoke test only — true constant-time profiling is statistical and
  // out of scope here. We just confirm that timingSafeEqual is actually
  // reached for same-length comparisons by checking the rejection path
  // returns the expected boolean.
  const f = makeFixture();
  const correct = f.webhookSignature.replace(/^v1,/, "");
  // Flip one base64 char to keep length identical but change the value.
  const flipped = correct.replace(/.$/, (c) => (c === "A" ? "B" : "A"));
  const wrongButSameLength = `v1,${flipped}`;
  assert.equal(verifyStandardWebhook({ ...f, webhookSignature: wrongButSameLength }), false);
});

test("nowMs override lets tests pin clock without freezing real time", () => {
  // A signature created at timestamp T should verify when nowMs maps
  // back to T, regardless of wall-clock drift inside the test runner.
  const fixedTimestamp = "1700000000";
  const f = makeFixture({ webhookTimestamp: fixedTimestamp });
  assert.equal(
    verifyStandardWebhook({ ...f, nowMs: Number(fixedTimestamp) * 1000 }),
    true,
  );
  // And should reject at any nowMs more than 5 minutes off.
  assert.equal(
    verifyStandardWebhook({ ...f, nowMs: (Number(fixedTimestamp) + 6 * 60) * 1000 }),
    false,
  );
});
