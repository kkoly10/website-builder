import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Recommendation = {
  score?: number;
  tierLabel?: string;
  priceRange?: string;
  summary?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const companyName = String(body.companyName ?? "").trim();
    const contactName = String(body.contactName ?? "").trim();
    const email = normalizeEmail(String(body.email ?? ""));
    const phone = String(body.phone ?? "").trim() || null;

    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { ok: false, error: "companyName, contactName, and email are required." },
        { status: 400 }
      );
    }

    // Detect logged-in user (if any)
    let authUserId: string | null = null;
    let authUserEmail: string | null = null;

    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      authUserId = user?.id ?? null;
      authUserEmail = normalizeEmail(user?.email);
    } catch {
      // anonymous submit is allowed
    }

    const shouldAttachToUser = !!authUserId && !!authUserEmail && authUserEmail === email;

    const recommendation: Recommendation = body.recommendation ?? {};

    const payload: Record<string, any> = {
      company_name: companyName,
      contact_name: contactName,
      email,
      owner_email_norm: email,
      phone,
      industry: String(body.trade ?? body.industry ?? "").trim() || null,
      team_size: String(body.teamSize ?? body.team_size ?? "").trim() || null,
      job_volume: String(body.jobVolume ?? body.job_volume ?? "").trim() || null,
      urgency: String(body.urgency ?? "").trim() || null,
      readiness: String(body.readiness ?? "").trim() || null,
      current_tools: Array.isArray(body.currentTools) ? body.currentTools : [],
      pain_points: Array.isArray(body.painPoints) ? body.painPoints : [],
      workflows_needed: Array.isArray(body.workflowsNeeded) ? body.workflowsNeeded : [],
      notes: String(body.notes ?? "").trim() || null,

      recommendation_tier: String(recommendation.tierLabel ?? "").trim() || null,
      recommendation_price_range: String(recommendation.priceRange ?? "").trim() || null,
      recommendation_score: Number.isFinite(Number(recommendation.score))
        ? Number(recommendation.score)
        : null,

      status: "new",
    };

    if (shouldAttachToUser) {
      payload.auth_user_id = authUserId;
    }

    const { data, error } = await supabaseAdmin
      .from("ops_intakes")
      .insert(payload)
      .select("id")
      .single<{ id: string }>();

    if (error || !data?.id) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Failed to save ops intake." },
        { status: 500 }
      );
    }

    const opsIntakeId = data.id;

    return NextResponse.json({
      ok: true,
      opsIntakeId,
      nextUrl: `/ops-book?opsIntakeId=${encodeURIComponent(opsIntakeId)}`,
      attachedToUser: shouldAttachToUser,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
