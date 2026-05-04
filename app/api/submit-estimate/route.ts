// app/api/submit-estimate/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerEvent } from "@/lib/analytics/server";
import { resolveQuoteAccess, sameNormalizedEmail } from "@/lib/accessControl";
import { pickPreferredLocale } from "@/lib/preferredLocale";
import { ensureCustomerPortalForQuoteId } from "@/lib/customerPortal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LooseObj = Record<string, any>;

function toNum(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function firstString(...vals: any[]) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

const PROJECT_TYPE_VALUES = [
  "website",
  "web_app",
  "automation",
  "ecommerce",
  "rescue",
] as const;
type ProjectType = (typeof PROJECT_TYPE_VALUES)[number];

function readProjectType(...vals: unknown[]): { value: ProjectType; explicit: boolean } {
  for (const v of vals) {
    if (typeof v === "string" && (PROJECT_TYPE_VALUES as readonly string[]).includes(v)) {
      return { value: v as ProjectType, explicit: true };
    }
  }
  return { value: "website", explicit: false };
}

function extractLeadEmail(body: LooseObj) {
  const raw = firstString(
    body?.leadEmail,
    body?.email,
    body?.contactEmail,
    body?.lead?.email,
    body?.intakeNormalized?.leadEmail,
    body?.intakeRaw?.leadEmail
  );
  const norm = raw.trim().toLowerCase();
  return norm.includes("@") ? norm : "";
}

function extractLeadName(body: LooseObj) {
  return firstString(
    body?.contactName,
    body?.lead?.name,
    body?.intakeNormalized?.contactName,
    body?.intakeRaw?.contactName,
    body?.intakeRaw?.name
  );
}

function extractEstimate(body: LooseObj) {
  const est = body?.estimate && typeof body.estimate === "object" ? body.estimate : {};
  const total = toNum(est?.total ?? est?.target ?? body?.estimate_total ?? body?.estimateTarget ?? body?.target);
  const low = toNum(est?.low ?? est?.min ?? body?.estimate_low ?? body?.estimateMin ?? body?.min);
  const high = toNum(est?.high ?? est?.max ?? body?.estimate_high ?? body?.estimateMax ?? body?.max);

  const safeLow = low > 0 ? low : Math.round(total * 0.9);
  const safeHigh = high > 0 ? high : Math.round(total * 1.15);

  return {
    total,
    low: Math.min(safeLow, safeHigh),
    high: Math.max(safeLow, safeHigh),
  };
}

function normalizePricing(body: LooseObj) {
  const estimate = extractEstimate(body);
  const pricing = body?.pricing && typeof body.pricing === "object" ? body.pricing : {};

  const bandMin = toNum(pricing?.band?.min ?? estimate.low);
  const bandMax = toNum(pricing?.band?.max ?? estimate.high);
  const bandTarget = toNum(pricing?.band?.target ?? estimate.total);

  return {
    version: firstString(pricing?.version) || "legacy",
    lane: firstString(pricing?.lane) || "website",
    tierKey: firstString(pricing?.tierKey) || "unknown",
    tierLabel: firstString(pricing?.tierLabel) || "Unclassified",
    position: firstString(pricing?.position) || "middle",
    isCustomScope: Boolean(pricing?.isCustomScope),
    band: {
      min: bandMin,
      max: bandMax,
      target: bandTarget,
    },
    displayRange: firstString(pricing?.displayRange),
    publicMessage: firstString(pricing?.publicMessage),
    summary: firstString(pricing?.summary),
    estimatorSummary: firstString(pricing?.estimatorSummary),
    reasons: Array.isArray(pricing?.reasons) ? pricing.reasons : [],
    complexityFlags: Array.isArray(pricing?.complexityFlags) ? pricing.complexityFlags : [],
    complexityScore: toNum(pricing?.complexityScore),
  };
}

async function findLeadByEmail(email: string) {
  const res = await supabaseAdmin.from("leads").select("id").eq("email", email).maybeSingle();
  if (!res.error && res.data?.id) return { id: String(res.data.id) };
  return null;
}

async function createLead(email: string, name: string | null, preferredLocale: string) {
  const res = await supabaseAdmin
    .from("leads")
    .insert({ email, preferred_locale: preferredLocale })
    .select("id")
    .single();
  if (res.error) throw new Error(res.error.message);
  const id = String(res.data.id);
  if (name) await supabaseAdmin.from("leads").update({ name }).eq("id", id);
  return id;
}

async function ensureLeadId(email: string, name: string | null, preferredLocale: string) {
  const existing = await findLeadByEmail(email);
  if (existing?.id) {
    // Refresh lead's locale preference whenever they re-engage so outbound
    // emails follow the language they're actually browsing in.
    await supabaseAdmin
      .from("leads")
      .update({ preferred_locale: preferredLocale })
      .eq("id", existing.id);
    return existing.id;
  }
  return await createLead(email, name, preferredLocale);
}

export async function POST(req: Request) {
  try {
    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({ key: `submit-estimate:${ip}`, limit: 12, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const body = (await req.json().catch(() => ({}))) as LooseObj;

    const leadEmail = extractLeadEmail(body);
    if (!leadEmail) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const leadName = extractLeadName(body) || null;
    const preferredLocale = pickPreferredLocale(body?.preferredLocale ?? body?.locale);
    const pricingTruth = normalizePricing(body);
    const { value: projectType, explicit: projectTypeExplicit } = readProjectType(
      body?.projectType,
      body?.project_type,
    );

    const total = pricingTruth.band.target || extractEstimate(body).total;
    const low = pricingTruth.band.min || extractEstimate(body).low;
    const high = pricingTruth.band.max || extractEstimate(body).high;

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const quoteId = String(body.quoteId ?? "").trim() || null;
    const quoteToken = String(body.quoteToken ?? body.token ?? "").trim() || null;
    const userEmail = normalizeEmail(user?.email);

    if (quoteId) {
      const access = await resolveQuoteAccess({
        quoteId,
        quoteToken,
        userId: user?.id ?? null,
        userEmail,
        leadEmail,
      });

      if (!access.ok) {
        return NextResponse.json(
          { ok: false, error: "You do not have permission to update this quote." },
          { status: 403 }
        );
      }
    }

    const leadId = await ensureLeadId(leadEmail, leadName, preferredLocale);

    const quoteJson = {
      ...body,
      leadEmail,
      pricingTruth,
      estimateComputed: { total, low, high },
    };

    const shouldAttachAuthUser = !!user?.id && sameNormalizedEmail(userEmail, leadEmail);

    const dbPayload: Record<string, unknown> = {
      lead_id: leadId,
      lead_email: leadEmail,
      owner_email_norm: normalizeEmail(leadEmail),
      tier_recommended: pricingTruth.tierLabel,
      quote_json: quoteJson,
      intake_raw:
        body?.intakeRaw && typeof body.intakeRaw === "object" ? body.intakeRaw : null,
      intake_normalized:
        body?.intakeNormalized && typeof body.intakeNormalized === "object"
          ? body.intakeNormalized
          : null,
      estimate_total: total,
      estimate_low: low,
      estimate_high: high,
      status: "submitted",
      preferred_locale: preferredLocale,
    };

    if (shouldAttachAuthUser) {
      dbPayload.auth_user_id = user?.id ?? null;
    } else if (!quoteId) {
      dbPayload.auth_user_id = null;
    }

    // For new quotes, always classify as the chosen lane (defaulting to
    // 'website' when the request omits one). For updates, only set
    // project_type when the request explicitly provided one — otherwise we'd
    // silently overwrite a previously classified non-website quote with the
    // 'website' default whenever an unrelated UPDATE call (e.g., from /book
    // or admin tools) reaches this endpoint without a lane field.
    if (!quoteId || projectTypeExplicit) {
      dbPayload.project_type = projectType;
    }

    let savedQuoteId: string;
    let savedQuoteToken: string | null = quoteToken;

    if (quoteId) {
      const { data, error } = await supabaseAdmin
        .from("quotes")
        .update(dbPayload)
        .eq("id", quoteId)
        .select("id, public_token")
        .single();

      if (error) throw new Error(error.message);
      savedQuoteId = String(data.id);
      savedQuoteToken = String(data.public_token ?? "").trim() || savedQuoteToken;
    } else {
      const { data, error } = await supabaseAdmin
        .from("quotes")
        .insert(dbPayload)
        .select("id, public_token")
        .single();

      if (error) throw new Error(error.message);
      savedQuoteId = String(data.id);
      savedQuoteToken = String(data.public_token ?? "").trim() || null;

      ensureCustomerPortalForQuoteId(savedQuoteId).catch((err) => {
        console.error("[submit-estimate] workspace auto-create failed for quote", savedQuoteId, err);
      });
    }

    await recordServerEvent({
      event: "estimate_submitted",
      page: "/estimate",
      ip,
      metadata: {
        quoteId: savedQuoteId,
        hasAuthUser: !!user?.id,
        pricingVersion: pricingTruth.version,
        tierKey: pricingTruth.tierKey,
        isCustomScope: pricingTruth.isCustomScope,
      },
    });

    const nextUrl =
      savedQuoteToken
        ? `/estimate?quoteId=${encodeURIComponent(savedQuoteId)}&token=${encodeURIComponent(savedQuoteToken)}`
        : `/estimate?quoteId=${encodeURIComponent(savedQuoteId)}`;

    return NextResponse.json({
      ok: true,
      quoteId: savedQuoteId,
      quoteToken: savedQuoteToken,
      nextUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
