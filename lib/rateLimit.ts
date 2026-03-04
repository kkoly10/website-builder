import { NextResponse } from "next/server";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, Bucket>;

function getStore(): RateLimitStore {
  const globalKey = "__crecy_rate_limit_store__";
  const g = globalThis as unknown as Record<string, RateLimitStore | undefined>;
  if (!g[globalKey]) g[globalKey] = new Map<string, Bucket>();
  return g[globalKey] as RateLimitStore;
}

export function getIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for") || headers.get("x-real-ip") || "";
  const ip = forwarded.split(",")[0]?.trim();
  return ip || "unknown";
}

export function enforceRateLimit(options: RateLimitOptions) {
  const now = Date.now();
  const store = getStore();
  const existing = store.get(options.key);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + options.windowMs;
    store.set(options.key, { count: 1, resetAt });
    return {
      ok: true,
      remaining: Math.max(options.limit - 1, 0),
      resetAt,
    };
  }

  if (existing.count >= options.limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  store.set(options.key, existing);

  return {
    ok: true,
    remaining: Math.max(options.limit - existing.count, 0),
    resetAt: existing.resetAt,
  };
}

export function rateLimitResponse(resetAt: number) {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    {
      ok: false,
      error: "Too many requests. Please wait and try again.",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}
