import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type RecommendationPayload = {
  score?: number;
  tierLabel?: string;
  priceRange?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const companyName = String(body.companyName ?? body.company_name ?? "").trim();
    const contactName = String(body.contactName ?? body.contact_name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();

    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { ok: false, error: "companyName, contactName, and email are required." },
        { status: 400 }
      );
    }

    const recommendation = (body.recommendation || {}) as RecommendationPayload;

    const payload = {
      company_name: companyName,
      contact_name: contactName,
      email,
      phone: phone || null,

      industry: String(body.trade ?? body.industry ?? "").trim() || null,
      team_size: String(body.teamSize ?? body.team_size ?? "").trim() || null,
      job_volume: String(body.jobVolume ?? body.job_volume ?? "").trim() || null,
      urgency: String(body.urgency ?? "").trim() || null,
      readiness: String(body.readiness ?? "").trim() || null,

      current_tools: Array.isArray(body.currentTools ?? body.current_tools)
        ? (body.currentTools ?? body.current_tools)
        : [],
      pain_points: Array.isArray(body.painPoints ?? body.pain_points)
        ? (body.painPoints ?? body.pain_points)
        : [],
      workflows_needed: Array.isArray(body.workflowsNeeded ?? body.workflows_needed)
        ? (body.workflowsNeeded ?? body.workflows_needed)
        : [],

      notes: String(body.notes ?? "").trim() || null,

      recommendation_tier: recommendation.tierLabel ?? null,
      recommendation_price_range: recommendation.priceRange ?? null,
      recommendation_score:
        typeof recommendation.score === "number" ? recommendation.score : null,

      status: "new",
    };

    const { data, error } = await supabaseAdmin
      .from("ops_intakes")
      .insert(payload)
      .select("id")
      .single<{ id: string }>();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Failed to save ops intake." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      opsIntakeId: data.id,
      nextUrl: `/ops-book?opsIntakeId=${encodeURIComponent(data.id)}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}