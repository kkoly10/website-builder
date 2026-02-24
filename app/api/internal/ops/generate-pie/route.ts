import { NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateOpsPieForIntake } from "@/lib/opsPie";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function userIsAdmin(email?: string | null, userId?: string | null) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail) return false;

  // 1) ENV admin emails
  if (isAdminEmail(normalizedEmail)) return true;

  // 2) profiles.role fallback
  if (userId) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("role,email")
      .eq("id", userId)
      .maybeSingle();

    if (String(data?.role || "").toLowerCase() === "admin") return true;
  }

  // 3) profiles.email fallback (if profile row isn't attached by id yet)
  const { data: byEmail } = await supabaseAdmin
    .from("profiles")
    .select("role,email")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  return String(byEmail?.role || "").toLowerCase() === "admin";
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminOk = await userIsAdmin(user.email, user.id);
    if (!adminOk) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Accept JSON body and a few key variants for compatibility
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const url = new URL(req.url);

    const opsIntakeId =
      String(
        body?.opsIntakeId ||
          body?.ops_intake_id ||
          url.searchParams.get("opsIntakeId") ||
          url.searchParams.get("ops_intake_id") ||
          ""
      ).trim();

    if (!opsIntakeId) {
      return NextResponse.json(
        {
          error:
            "Missing ops intake id. Send { opsIntakeId } in the POST body.",
        },
        { status: 400 }
      );
    }

    const force =
      body?.force === true ||
      body?.force === "true" ||
      url.searchParams.get("force") === "true";

    const report = await generateOpsPieForIntake(opsIntakeId, { force });

    return NextResponse.json({
      ok: true,
      report: {
        id: report.id,
        ops_intake_id: report.ops_intake_id,
        generator: report.generator,
        model: report.model,
        status: report.status,
        summary: report.summary,
        created_at: report.created_at,
      },
    });
  } catch (error: any) {
    console.error("[/api/internal/ops/generate-pie] error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Failed to generate PIE report",
      },
      { status: 500 }
    );
  }
}