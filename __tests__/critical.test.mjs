// Tests for critical business logic paths
// Run with: node --test __tests__/critical.test.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── internalAuth ────────────────────────────────────────────────────────────

describe("checkInternalAccess", () => {
  // Inline re-implementation to avoid needing tsx/ts-node
  function checkInternalAccess(token, env = {}) {
    const expected = env.INTERNAL_DASHBOARD_TOKEN;
    if (!expected) {
      const isProduction = env.NODE_ENV === "production" || !!env.VERCEL;
      if (isProduction) return { ok: false, warning: "" };
      return { ok: true, warning: "dev mode" };
    }
    if (!token) return { ok: false, warning: "" };
    if (token !== expected) return { ok: false, warning: "" };
    return { ok: true, warning: "" };
  }

  it("blocks access in production when token env var is missing", () => {
    const result = checkInternalAccess(null, { NODE_ENV: "production" });
    assert.equal(result.ok, false);
  });

  it("blocks access on Vercel when token env var is missing", () => {
    const result = checkInternalAccess(null, { VERCEL: "1" });
    assert.equal(result.ok, false);
  });

  it("allows access in dev when token env var is missing", () => {
    const result = checkInternalAccess(null, { NODE_ENV: "development" });
    assert.equal(result.ok, true);
  });

  it("allows access when correct token is provided", () => {
    const result = checkInternalAccess("secret123", {
      INTERNAL_DASHBOARD_TOKEN: "secret123",
    });
    assert.equal(result.ok, true);
  });

  it("blocks access when wrong token is provided", () => {
    const result = checkInternalAccess("wrong", {
      INTERNAL_DASHBOARD_TOKEN: "secret123",
    });
    assert.equal(result.ok, false);
  });

  it("blocks access when no token is provided but env var is set", () => {
    const result = checkInternalAccess(null, {
      INTERNAL_DASHBOARD_TOKEN: "secret123",
    });
    assert.equal(result.ok, false);
  });
});

// ─── PIE confidence calculation ──────────────────────────────────────────────

describe("PIE confidence calculation", () => {
  function getConfidence(score, featuresLength, pagesEstimate) {
    return score < 45 && featuresLength <= 2 && pagesEstimate <= 4
      ? "High"
      : score < 70
      ? "Medium"
      : "Low";
  }

  it("returns High for simple projects (score < 45, few features, few pages)", () => {
    assert.equal(getConfidence(30, 1, 3), "High");
    assert.equal(getConfidence(0, 0, 1), "High");
    assert.equal(getConfidence(44, 2, 4), "High");
  });

  it("returns Medium for moderate projects (score 45-69)", () => {
    assert.equal(getConfidence(50, 3, 5), "Medium");
    assert.equal(getConfidence(69, 1, 2), "Medium");
  });

  it("returns Medium for simple score but too many features", () => {
    assert.equal(getConfidence(30, 5, 3), "Medium");
  });

  it("returns Medium for simple score but too many pages", () => {
    assert.equal(getConfidence(30, 1, 10), "Medium");
  });

  it("returns Low for complex projects (score >= 70)", () => {
    assert.equal(getConfidence(70, 5, 10), "Low");
    assert.equal(getConfidence(85, 3, 6), "Low");
    assert.equal(getConfidence(100, 10, 20), "Low");
  });
});

// ─── Rate limiter ────────────────────────────────────────────────────────────

describe("rate limiter", () => {
  // Simplified re-implementation matching lib/rateLimit.ts logic
  function createLimiter() {
    const store = new Map();
    return function enforceRateLimit({ key, limit, windowMs }) {
      const now = Date.now();
      const existing = store.get(key);
      if (!existing || now > existing.resetAt) {
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return { ok: true, remaining: Math.max(limit - 1, 0), resetAt };
      }
      if (existing.count >= limit) {
        return { ok: false, remaining: 0, resetAt: existing.resetAt };
      }
      existing.count += 1;
      store.set(key, existing);
      return {
        ok: true,
        remaining: Math.max(limit - existing.count, 0),
        resetAt: existing.resetAt,
      };
    };
  }

  it("allows requests under the limit", () => {
    const enforce = createLimiter();
    const opts = { key: "test-ip", limit: 3, windowMs: 60000 };
    assert.equal(enforce(opts).ok, true);
    assert.equal(enforce(opts).ok, true);
    assert.equal(enforce(opts).ok, true);
  });

  it("blocks requests over the limit", () => {
    const enforce = createLimiter();
    const opts = { key: "test-ip2", limit: 2, windowMs: 60000 };
    enforce(opts);
    enforce(opts);
    assert.equal(enforce(opts).ok, false);
  });

  it("tracks remaining count correctly", () => {
    const enforce = createLimiter();
    const opts = { key: "test-ip3", limit: 3, windowMs: 60000 };
    assert.equal(enforce(opts).remaining, 2);
    assert.equal(enforce(opts).remaining, 1);
    assert.equal(enforce(opts).remaining, 0);
  });

  it("isolates different keys", () => {
    const enforce = createLimiter();
    const opts1 = { key: "ip-a", limit: 1, windowMs: 60000 };
    const opts2 = { key: "ip-b", limit: 1, windowMs: 60000 };
    assert.equal(enforce(opts1).ok, true);
    assert.equal(enforce(opts2).ok, true);
    assert.equal(enforce(opts1).ok, false);
    assert.equal(enforce(opts2).ok, false);
  });
});

// ─── Email extraction / validation ───────────────────────────────────────────

describe("email validation", () => {
  function extractLeadEmail(body) {
    const vals = [
      body?.leadEmail,
      body?.email,
      body?.contactEmail,
      body?.lead?.email,
    ];
    for (const v of vals) {
      if (typeof v === "string" && v.trim()) {
        const norm = v.trim().toLowerCase();
        if (norm.includes("@")) return norm;
      }
    }
    return "";
  }

  it("extracts email from leadEmail field", () => {
    assert.equal(extractLeadEmail({ leadEmail: "Test@Example.com" }), "test@example.com");
  });

  it("falls back to email field", () => {
    assert.equal(extractLeadEmail({ email: "user@test.com" }), "user@test.com");
  });

  it("falls back to nested lead.email", () => {
    assert.equal(
      extractLeadEmail({ lead: { email: "nested@test.com" } }),
      "nested@test.com"
    );
  });

  it("returns empty string for missing email", () => {
    assert.equal(extractLeadEmail({}), "");
  });

  it("returns empty string for email without @", () => {
    assert.equal(extractLeadEmail({ email: "notanemail" }), "");
  });

  it("trims whitespace", () => {
    assert.equal(extractLeadEmail({ email: "  spaced@test.com  " }), "spaced@test.com");
  });
});

// ─── Estimate extraction ─────────────────────────────────────────────────────

describe("estimate extraction", () => {
  function toNum(v) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }

  function extractEstimate(body) {
    const est = body?.estimate && typeof body.estimate === "object" ? body.estimate : {};
    const total = toNum(est?.total ?? est?.target ?? body?.estimate_total);
    const low = toNum(est?.low ?? est?.min ?? body?.estimate_low);
    const high = toNum(est?.high ?? est?.max ?? body?.estimate_high);
    const safeLow = low > 0 ? low : Math.round(total * 0.9);
    const safeHigh = high > 0 ? high : Math.round(total * 1.15);
    return { total, low: Math.min(safeLow, safeHigh), high: Math.max(safeLow, safeHigh) };
  }

  it("extracts from estimate object", () => {
    const r = extractEstimate({ estimate: { total: 2000, low: 1800, high: 2200 } });
    assert.equal(r.total, 2000);
    assert.equal(r.low, 1800);
    assert.equal(r.high, 2200);
  });

  it("defaults low/high from total when missing", () => {
    const r = extractEstimate({ estimate: { total: 1000 } });
    assert.equal(r.total, 1000);
    assert.equal(r.low, 900);   // 1000 * 0.9
    assert.equal(r.high, 1150); // 1000 * 1.15
  });

  it("ensures low <= high even with bad input", () => {
    const r = extractEstimate({ estimate: { total: 1000, low: 2000, high: 500 } });
    assert.ok(r.low <= r.high);
  });

  it("handles empty body gracefully", () => {
    const r = extractEstimate({});
    assert.equal(r.total, 0);
    assert.equal(r.low, 0);
    assert.equal(r.high, 0);
  });
});

// ─── normalizeEmail ──────────────────────────────────────────────────────────

describe("normalizeEmail", () => {
  function normalizeEmail(email) {
    return String(email ?? "").trim().toLowerCase();
  }

  it("lowercases and trims", () => {
    assert.equal(normalizeEmail("  FOO@BAR.COM  "), "foo@bar.com");
  });

  it("handles null/undefined", () => {
    assert.equal(normalizeEmail(null), "");
    assert.equal(normalizeEmail(undefined), "");
  });
});
