import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  enforceRateLimitDurable,
  getIpFromHeaders,
  rateLimitResponse,
} from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Resend the email-verification link Supabase sent during signup. The
// audit flagged this as the missing piece of the auth flow: if a user
// signs up and the confirmation email lands in spam (or they typed
// the wrong email), there's no way to retry without contacting support.
//
// This endpoint is unauthenticated by design — the user can't log in
// until they confirm, so requiring a session would create a deadlock.
// Rate-limited per-IP (3/min) instead, which matches the cost profile
// (each request triggers an email send) without locking out a user
// who genuinely needs to retry a couple times.
export async function POST(req: NextRequest) {
  const ip = getIpFromHeaders(req.headers);
  const rl = await enforceRateLimitDurable({
    key: `auth-resend-confirm:${ip}`,
    limit: 3,
    windowMs: 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Valid email required." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });

  // Don't leak whether the email exists. Supabase's resend errors with
  // "User not found" if no signup happened — surfacing that to the
  // caller would let a scraper enumerate emails. Return ok even on
  // unknown-email errors; log the real error server-side for ops.
  if (error) {
    console.warn(`[auth.resend-confirmation] ${email}: ${error.message}`);
  }

  // Generic ack regardless of outcome.
  return NextResponse.json({
    ok: true,
    message:
      "If an account exists for that email and is unconfirmed, a new confirmation link is on the way.",
  });
}
