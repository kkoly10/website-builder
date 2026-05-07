#!/usr/bin/env node
/**
 * API smoke test — verifies every route responds correctly without writing
 * real data.  Uses invalid / missing bodies so DB writes never happen.
 *
 * Run against production (default):
 *   npm run smoke
 *
 * Run against local dev server:
 *   npm run smoke:local
 */

const BASE_URL = (process.env.BASE_URL ?? "https://crecystudio.com").replace(/\/$/, "");

// ─── Tiny test harness ────────────────────────────────────────────────────────

type Result = { name: string; pass: boolean; detail: string };
const results: Result[] = [];

function group(label: string) {
  console.log(`\n${label}`);
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, pass: true, detail: "ok" });
    console.log(`  ✓  ${name}`);
  } catch (err: any) {
    results.push({ name, pass: false, detail: err.message ?? String(err) });
    console.error(`  ✗  ${name}: ${err.message ?? err}`);
  }
}

function assert(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function assertJson(res: Response): Promise<any> {
  const ct = res.headers.get("content-type") ?? "";
  assert(ct.includes("application/json"), `expected JSON content-type, got "${ct}"`);
  return res.json();
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function get(path: string, opts?: RequestInit) {
  return fetch(`${BASE_URL}${path}`, { ...opts });
}

function post(path: string, body: unknown, opts?: RequestInit) {
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    ...opts,
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSmoke test → ${BASE_URL}`);
  console.log("=".repeat(60));

  // ── 1. Public GET routes ────────────────────────────────────────────────────
  group("Public GET routes");

  await test("GET /api/book-discovery-call/slots → 200 + {ok}", async () => {
    const res = await get("/api/book-discovery-call/slots");
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const json = await assertJson(res);
    assert("ok" in json, `missing "ok" field: ${JSON.stringify(json)}`);
  });

  // ── 2. Discovery call — validation ─────────────────────────────────────────
  group("POST /api/book-discovery-call — validation");

  await test("missing name → 400 ok:false", async () => {
    const res = await post("/api/book-discovery-call", { email: "smoke@example.com" });
    assert(res.status === 400, `expected 400, got ${res.status}`);
    const json = await assertJson(res);
    assert(json.ok === false, `expected ok:false, got ${JSON.stringify(json)}`);
  });

  await test("missing email → 400 ok:false", async () => {
    const res = await post("/api/book-discovery-call", { name: "Smoke Test" });
    assert(res.status === 400, `expected 400, got ${res.status}`);
    const json = await assertJson(res);
    assert(json.ok === false, `expected ok:false, got ${JSON.stringify(json)}`);
  });

  await test("bad email format → 400 ok:false", async () => {
    const res = await post("/api/book-discovery-call", { name: "Smoke Test", email: "not-an-email" });
    assert(res.status === 400, `expected 400, got ${res.status}`);
    const json = await assertJson(res);
    assert(json.ok === false, `expected ok:false, got ${JSON.stringify(json)}`);
  });

  // ── 3. Submit estimate — validation ────────────────────────────────────────
  group("POST /api/submit-estimate — validation");

  await test("empty body → 400 ok:false", async () => {
    const res = await post("/api/submit-estimate", {});
    assert(res.status === 400, `expected 400, got ${res.status}`);
    const json = await assertJson(res);
    assert(json.ok === false, `expected ok:false, got ${JSON.stringify(json)}`);
  });

  // ── 4. Ops intake — validation ──────────────────────────────────────────────
  group("POST /api/ops/submit-intake — validation");

  await test("empty body → 400", async () => {
    const res = await post("/api/ops/submit-intake", {});
    assert(res.status === 400, `expected 400, got ${res.status}`);
  });

  await test("missing email → 400", async () => {
    const res = await post("/api/ops/submit-intake", { companyName: "Test Co", contactName: "Test" });
    assert(res.status === 400, `expected 400, got ${res.status}`);
  });

  // ── 5. Ecommerce intake — validation ───────────────────────────────────────
  group("POST /api/ecommerce/submit-intake — validation");

  await test("empty body → 400", async () => {
    const res = await post("/api/ecommerce/submit-intake", {});
    assert(res.status === 400, `expected 400, got ${res.status}`);
  });

  // ── 6. Book (estimate accept) — validation ─────────────────────────────────
  group("POST /api/book — validation");

  await test("empty body → 4xx", async () => {
    const res = await post("/api/book", {});
    assert(res.status >= 400, `expected 4xx, got ${res.status}`);
  });

  // ── 7. Ops request-call — validation ───────────────────────────────────────
  group("POST /api/ops/request-call — validation");

  await test("empty body → 400", async () => {
    const res = await post("/api/ops/request-call", {});
    assert(res.status === 400, `expected 400, got ${res.status}`);
  });

  // ── 8. Ecommerce request-call — validation ─────────────────────────────────
  group("POST /api/ecommerce/request-call — validation");

  await test("empty body → 400", async () => {
    const res = await post("/api/ecommerce/request-call", {});
    assert(res.status === 400, `expected 400, got ${res.status}`);
  });

  // ── 9. Admin routes — unauthenticated → 401 ────────────────────────────────
  group("Admin routes (no auth → 401)");

  const adminRoutes: [string, string, unknown?][] = [
    ["GET",  "/api/internal/list-quotes"],
    ["GET",  "/api/internal/get-quote?id=smoke"],
    ["POST", "/api/internal/admin/status",            { quoteId: "smoke", pipelineStatus: "test" }],
    ["POST", "/api/internal/portal/create",           {}],
    ["POST", "/api/internal/admin/proposal",          {}],
    ["POST", "/api/internal/admin/scope",             {}],
    ["POST", "/api/internal/update-quote",            {}],
    ["POST", "/api/internal/lock-scope",              {}],
    ["GET",  "/api/internal/admin/certificates/smoke"],
    ["POST", "/api/internal/admin/certificates/smoke"],
    ["POST", "/api/internal/admin/messages",          {}],
    ["POST", "/api/internal/admin/adjustments",       {}],
    ["POST", "/api/internal/admin/change-order",      {}],
    ["POST", "/api/internal/admin/invoices",          {}],
    ["POST", "/api/internal/admin/invoices/send",     {}],
  ];

  for (const [method, path, body] of adminRoutes) {
    await test(`${method} ${path} → 401`, async () => {
      const res = method === "GET"
        ? await get(path)
        : await post(path, body ?? {});
      assert(res.status === 401, `expected 401, got ${res.status}`);
    });
  }

  // ── 10. Portal routes — fake token ─────────────────────────────────────────
  group("Portal routes (fake token → 4xx)");

  await test("GET /api/portal/smoke-fake-token → 4xx", async () => {
    const res = await get("/api/portal/smoke-fake-token");
    assert(res.status >= 400, `expected 4xx, got ${res.status}`);
  });

  await test("POST /api/portal/smoke-fake-token → 4xx", async () => {
    const res = await post("/api/portal/smoke-fake-token", { action: "smoke" });
    assert(res.status >= 400, `expected 4xx, got ${res.status}`);
  });

  await test("GET /api/portal/smoke-fake-token/certificate → 4xx", async () => {
    const res = await get("/api/portal/smoke-fake-token/certificate");
    assert(res.status >= 400, `expected 4xx, got ${res.status}`);
  });

  // ── 11. Stripe webhook — no signature → 400 ────────────────────────────────
  group("Webhook routes");

  await test("POST /api/webhooks/stripe without Stripe-Signature → 400", async () => {
    const res = await post("/api/webhooks/stripe", {});
    assert(res.status === 400, `expected 400, got ${res.status}`);
  });

  // ── Summary ─────────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed (${results.length} total)`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    for (const r of results.filter((r) => !r.pass)) {
      console.error(`  ✗  ${r.name}`);
      console.error(`     ${r.detail}`);
    }
    process.exit(1);
  } else {
    console.log("All tests passed ✓");
  }
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
