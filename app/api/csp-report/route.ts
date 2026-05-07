import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { enforceRateLimitDurable, getIpFromHeaders } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accepts both legacy report-uri payloads (application/csp-report) and
// modern report-to payloads (application/reports+json). Stores each
// violation in csp_violations. Always returns 204 — browsers don't surface
// errors here and we don't want to incur a penalty for a missing table.
//
// Rate-limited per IP: a single page load can fire several legitimate
// reports, but we cap at 60/min to prevent floods filling the table.
export async function POST(req: NextRequest) {
  const ip = getIpFromHeaders(req.headers);
  const rl = await enforceRateLimitDurable({
    key: `csp-report:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    // Silently drop excess reports — never expose 429 to the browser, since
    // browsers may stop sending future reports if they get error responses.
    return new NextResponse(null, { status: 204 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  // Modern Reporting API sends an array of reports; legacy sends a single
  // object wrapped under "csp-report".
  const reports: Array<Record<string, unknown>> = Array.isArray(payload)
    ? (payload as Array<Record<string, unknown>>)
        .map((r) => (r && typeof r === "object" ? ((r as { body?: unknown }).body as Record<string, unknown>) ?? r : r))
        .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
    : payload && typeof payload === "object" && "csp-report" in (payload as Record<string, unknown>)
      ? [(payload as Record<string, Record<string, unknown>>)["csp-report"]]
      : payload && typeof payload === "object"
        ? [payload as Record<string, unknown>]
        : [];

  if (reports.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const userAgent = req.headers.get("user-agent") || null;
  const referer = req.headers.get("referer") || null;

  const rows = reports.map((r) => {
    const get = (k: string) =>
      typeof r[k] === "string" ? (r[k] as string) : null;
    return {
      document_uri: get("document-uri") || get("documentURL"),
      blocked_uri: get("blocked-uri") || get("blockedURL"),
      violated_directive: get("violated-directive") || get("effectiveDirective"),
      effective_directive: get("effective-directive") || get("effectiveDirective"),
      disposition: get("disposition"),
      status_code: typeof r["status-code"] === "number" ? (r["status-code"] as number) : null,
      user_agent: userAgent,
      referer,
      ip,
      raw: r,
    };
  });

  try {
    await supabaseAdmin.from("csp_violations").insert(rows);
  } catch {
    // Table may not exist yet, or insert may fail. We don't want to
    // surface errors to the browser — just log and move on.
    console.warn("[csp-report] insert failed");
  }

  return new NextResponse(null, { status: 204 });
}
