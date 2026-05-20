import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Uptime monitor target. Returns 200 when the app can reach Supabase
// (the only stateful dependency in the request path), 503 otherwise.
// Kept intentionally small — pingdom / better-uptime / cron-job.org
// hit this every minute, so the work has to stay sub-millisecond.
//
// Not for liveness vs readiness distinction — Vercel doesn't have a
// concept of unhealthy-but-restarting workers. A 503 here means
// "something downstream is broken, page the human."
export async function GET() {
  const startedAt = Date.now();
  try {
    // SELECT 1-style probe. Cheap because of the LIMIT and because
    // we're not joining or filtering on any column. If Supabase is
    // down or the service-role key is wrong, this throws.
    const { error } = await supabaseAdmin
      .from("quotes")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Database probe failed.",
          latencyMs: Date.now() - startedAt,
          timestamp: new Date().toISOString(),
        },
        {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Healthcheck failed.",
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
