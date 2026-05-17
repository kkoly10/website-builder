// lib/routeAuth.ts
// Shared helpers to protect /api/internal/* routes.
// Usage:
//   const authErr = await requireAdminRoute();
//   if (authErr) return authErr;
//   const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-foo" });
//   if (rlErr) return rlErr;

import { NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import {
  enforceRateLimitDurable,
  getIpFromHeaders,
  rateLimitResponse,
} from "@/lib/rateLimit";

export async function requireAdminRoute(): Promise<NextResponse | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = await isAdminUser({
      userId: user?.id ?? null,
      email: user?.email ?? null,
    });

    if (!admin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    return null; // authorized
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
}

// Rate-limit guard for /api/internal/admin/* routes. None of the admin
// endpoints had rate limiting before this — a compromised admin token
// could hammer expensive paths (PDF generation, email send, scope edits)
// without any throttle. Keying on IP rather than user.id keeps the
// helper cheap (no second auth fetch) at the cost of admins behind the
// same NAT sharing a bucket — acceptable for a small admin team.
//
// Defaults: 60/min for read-only paths, 30/min for state-changing ones.
// Callers pass `keyPrefix` so each route has its own bucket and
// monitoring/debugging stays decoupled across endpoints.
export async function enforceAdminRateLimit(
  req: Request,
  opts: { keyPrefix: string; limit?: number; windowMs?: number }
): Promise<NextResponse | null> {
  const ip = getIpFromHeaders(req.headers);
  const rl = await enforceRateLimitDurable({
    key: `${opts.keyPrefix}:${ip}`,
    limit: opts.limit ?? 60,
    windowMs: opts.windowMs ?? 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);
  return null;
}
