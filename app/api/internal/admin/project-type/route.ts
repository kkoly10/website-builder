import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIpFromHeaders } from "@/lib/rateLimit";
import { setProjectTypeByQuoteId } from "@/lib/customerPortal";
import { isProjectType } from "@/lib/workflows/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH the project type (lane) on a quote + its portal row. Updates
// both sources of truth in lockstep so the direction-submit dispatcher
// never sees them disagreeing.
export async function PATCH(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const quoteId = String(body?.quoteId || "").trim();
  const projectType = String(body?.projectType || "").trim();
  if (!quoteId) {
    return NextResponse.json({ ok: false, error: "quoteId required" }, { status: 400 });
  }
  if (!isProjectType(projectType)) {
    return NextResponse.json(
      { ok: false, error: "projectType must be one of website, web_app, automation, ecommerce, rescue" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const actor = {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    ip: getIpFromHeaders(req.headers),
  };

  try {
    const result = await setProjectTypeByQuoteId({ quoteId, projectType, actor });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed" },
      { status: 500 },
    );
  }
}
