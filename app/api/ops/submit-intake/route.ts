import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerEvent } from "@/lib/analytics/server";
import { pickPreferredLocale } from "@/lib/preferredLocale";

export const dynamic = "force-dynamic";

type Recommendation = {
  score?: number;
  tierLabel?: string;
  priceRange?: string;
  summary?: string;
  pricingVersion?: string;
  position?: string;
  isCustomScope?: boolean;
  band?: {
    min?: number;
    max?: number;
    target?: number;
  };
  reasons?: unknown[];
  complexityFlags?: unknown[];
};

function firstString(...vals: unknown[]) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function toNum(v: unknown) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function normalizeRecommendation(input: unknown) {
  const recommendation =
    input && typeof input === "object" ? (input as Recommendation) : {};

  return {
    score: toNum(recommendation.score),
    tierLabel: firstString(recommendation.tierLabel) || null,
    priceRange: firstString(recommendation.priceRange) || null,
    summary: firstString(recommendation.summary) || null,
    pricingVersion: firstString(recommendation.pricingVersion) || null,
    position: firstString(recommendation.position) || null,
    isCustomScope: Boolean(recommendation.isCustomScope),
    band: {
      min: toNum(recommendation.band?.min),
      max: toNum(recommendation.band?.max),
      target: toNum(recommendation.band?.target),
    },
    reasons: Array.isArray(recommendation.reasons) ? recommendation.reasons : [],
    complexityFlags: Array.isArray(recommendation.complexityFlags)
      ? recommendation.complexityFlags
      : [],
  };
}

async function insertOpsIntake(
  basePayload: Record<string, any>,
  recommendationSnapshot: Record<string, any>
) {
  const firstAttempt = await supabaseAdmin
    .from("ops_intakes")
    .insert({
      ...basePayload,
      recommendation_json: recommendationSnapshot,
    })
    .select("id")
    .single<{ id: string }>();

  if (!firstAttempt.error && firstAttempt.data?.id) {
    return firstAttempt;
  }

  const errorMessage = String(firstAttempt.error?.message || "");
  const missingRecommendationJsonColumn =
    /recommendation_json/i.test(errorMessage);

  if (!missingRecommendationJsonColumn) {
    return firstAttempt;
  }

  return await supabaseAdmin
    .from("ops_intakes")
    .insert(basePayload)
    .select("id")
    .single<{ id: string }>();
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({ key: `ops-submit-intake:${ip}`, limit: 8, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

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
    const recommendation = normalizeRecommendation(body.recommendation);
    const preferredLocale = pickPreferredLocale(body?.preferredLocale ?? body?.locale);

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
      recommendation_tier: recommendation.tierLabel,
      recommendation_price_range: recommendation.isCustomScope
        ? recommendation.priceRange || "Custom ops scope — strategy call required."
        : recommendation.priceRange,
      recommendation_score: recommendation.score || null,
      status: "new",
      preferred_locale: preferredLocale,
    };

    if (shouldAttachToUser) {
      payload.auth_user_id = authUserId;
    }

    const recommendationSnapshot = {
      ...recommendation,
      source: "ops-intake",
    };

    const { data, error } = await insertOpsIntake(payload, recommendationSnapshot);

    if (error || !data?.id) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Failed to save ops intake." },
        { status: 500 }
      );
    }

    const opsIntakeId = data.id;

    await recordServerEvent({
      event: "ops_intake_submitted",
      page: "/ops-intake",
      ip,
      metadata: {
        opsIntakeId,
        attachedToUser: shouldAttachToUser,
        pricingVersion: recommendation.pricingVersion,
        tierLabel: recommendation.tierLabel,
        isCustomScope: recommendation.isCustomScope,
      },
    });

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
