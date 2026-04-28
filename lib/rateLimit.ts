import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

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

function enforceRateLimitLocal(options: RateLimitOptions): RateLimitResult {
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

async function lookupDurableResetAt(key: string, windowStartIso: string, windowMs: number) {
  const { data } = await supabaseAdmin
    .from("analytics_events")
    .select("created_at")
    .eq("event_name", "__rate_limit__")
    .eq("page", key)
    .gte("created_at", windowStartIso)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const oldest = String(data?.created_at ?? "").trim();
  if (!oldest) return Date.now() + windowMs;

  const oldestMs = new Date(oldest).getTime();
  if (Number.isNaN(oldestMs)) return Date.now() + windowMs;

  return oldestMs + windowMs;
}

export async function enforceRateLimitDurable(options: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const normalizedKey = String(options.key || "").slice(0, 200);
  const windowStartIso = new Date(now - options.windowMs).toISOString();

  try {
    const { count, error } = await supabaseAdmin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", "__rate_limit__")
      .eq("page", normalizedKey)
      .gte("created_at", windowStartIso);

    if (error) {
      return enforceRateLimitLocal(options);
    }

    const used = Number(count ?? 0);

    if (used >= options.limit) {
      return {
        ok: false,
        remaining: 0,
        resetAt: await lookupDurableResetAt(normalizedKey, windowStartIso, options.windowMs),
      };
    }

    const insert = await supabaseAdmin.from("analytics_events").insert({
      event_name: "__rate_limit__",
      page: normalizedKey,
      metadata: {
        limit: options.limit,
        windowMs: options.windowMs,
      },
      created_at: new Date(now).toISOString(),
    });

    if (insert.error) {
      return enforceRateLimitLocal(options);
    }

    return {
      ok: true,
      remaining: Math.max(options.limit - used - 1, 0),
      resetAt: now + options.windowMs,
    };
  } catch {
    return enforceRateLimitLocal(options);
  }
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
