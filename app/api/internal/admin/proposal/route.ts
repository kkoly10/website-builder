// app/api/internal/admin/proposal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyObj = Record<string, any>;

function toObj(v: any): AnyObj {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function asList(v: any): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];
}

function money(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(x);
}

function safeNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function computeAdjustedTarget(baseTarget: number | null, adjustments: AnyObj) {
  const customTarget = safeNum(adjustments?.customTarget);
  if (customTarget !== null) return Math.round(customTarget);

  if (baseTarget === null) return null;
  let result = baseTarget;

  const discountPct = safeNum(adjustments?.discountPct);
  const discountAmount = safeNum(adjustments?.discountAmount);
  const increaseAmount = safeNum(adjustments?.increaseAmount);

  if (discountPct !== null) result -= result * (discountPct / 100);
  if (discountAmount !== null) result -= discountAmount;
  if (increaseAmount !== null) result += increaseAmount;

  return Math.max(0, Math.round(result));
}

function buildProposalText(params: {
  quote: AnyObj;
  lead: AnyObj | null;
  callRequest: AnyObj | null;
  pieRow: AnyObj | null;
}) {
  const { quote, lead, callRequest, pieRow } = params;

  const pie = toObj(pieRow?.report);
  const debug = toObj(quote.debug);
  const admin = toObj(debug.admin_v15);
  const adjustments = toObj(admin.pricingAdjustments);

  const tier =
    pie?.tier ||
    quote?.tier_recommended ||
    quote?.scope_snapshot?.tier ||
    "Essential";

  const piePricing = toObj(pie?.pricing);
  const baseTarget =
    safeNum(piePricing.target) ??
    safeNum(piePricing.recommended) ??
    safeNum(quote.estimated_total);

  const baseFloor =
    safeNum(piePricing.minimum) ??
    safeNum(piePricing.floor) ??
    safeNum(quote.estimated_low);

  const baseCeiling =
    safeNum(piePricing.maximum) ??
    safeNum(piePricing.ceiling) ??
    safeNum(quote.estimated_high);

  const adjustedTarget = computeAdjustedTarget(baseTarget, adjustments);

  const effort = toObj(pie.effort);
  const timeline = toObj(pie.timeline);
  const buildPlan = toObj(pie.build_plan);

  const hours =
    safeNum(effort.estimated_hours) ??
    safeNum(effort.hours) ??
    safeNum(buildPlan.total_hours_estimate);

  const hourlyRate =
    safeNum(effort.hourly_rate) ??
    safeNum(effort.rate_per_hour) ??
    safeNum(buildPlan.hourly_rate) ??
    40;

  const laborAtRate =
    safeNum(effort.labor_at_hourly_rate) ??
    (hours !== null ? Math.round(hours * hourlyRate) : null);

  const days =
    safeNum(timeline.estimated_days) ??
    safeNum(timeline.days) ??
    safeNum(buildPlan.estimated_days);

  const weeks =
    safeNum(timeline.estimated_weeks) ??
    safeNum(timeline.weeks) ??
    safeNum(buildPlan.estimated_weeks);

  const summary =
    String(
      pie.summary ||
        pie.executive_summary ||
        "This project appears to be a good fit for a phased website build with a clear scope and launch path."
    );

  const drivers = asList(pie.complexity_drivers || pie.drivers || pie.factors);
  const risks = asList(pie.risks);
  const questions = asList(pie.discovery_questions || pie.questions_to_ask || pie.questions);

  const leadEmail =
    lead?.email ||
    quote?.scope_snapshot?.contact?.email ||
    "client@email.com";

  const leadName =
    lead?.name ||
    lead?.full_name ||
    quote?.scope_snapshot?.contact?.name ||
    quote?.business_name ||
    "Client";

  const projectType =
    quote?.project_kind ||
    quote?.scope_snapshot?.projectType ||
    quote?.scope_snapshot?.project_kind ||
    "Website project";

  const platform =
    quote?.selected_platform ||
    quote?.scope_snapshot?.platform ||
    "Platform TBD";

  const timelineWanted =
    quote?.timeline ||
    quote?.scope_snapshot?.timeline ||
    callRequest?.best_time_to_call ||
    "TBD";

  const bullets = (arr: string[]) =>
    arr.length ? arr.map((x) => `- ${x}`).join("\n") : "- To be confirmed during kickoff";

  const adjustmentNote =
    typeof adjustments.note === "string" && adjustments.note.trim()
      ? adjustments.note.trim()
      : null;

  return `Proposal Draft — ${leadName}

Client: ${leadName}
Email: ${leadEmail}
Quote ID: ${quote.id}

Recommended Tier: ${tier}
Project Type: ${projectType}
Preferred Platform: ${platform}
Requested Timeline: ${timelineWanted}

Overview
${summary}

Scope & Complexity Notes
${bullets(drivers)}

Estimated Build Effort
- Estimated hours: ${hours ?? "TBD"} hour(s)
- Planning rate check: ${money(hourlyRate)}/hr
- Labor at rate: ${laborAtRate !== null ? money(laborAtRate) : "TBD"}
- Estimated timeline: ${
    weeks !== null
      ? `${weeks} week(s)`
      : days !== null
      ? `${days} day(s)`
      : "TBD (depends on content readiness and revisions)"
  }

Pricing Guidance
- Base target: ${baseTarget !== null ? money(baseTarget) : "TBD"}
- Floor: ${baseFloor !== null ? money(baseFloor) : "TBD"}
- Ceiling / upper range: ${baseCeiling !== null ? money(baseCeiling) : "TBD"}
- Admin adjusted target: ${adjustedTarget !== null ? money(adjustedTarget) : "TBD"}
${
  adjustmentNote
    ? `- Admin pricing note: ${adjustmentNote}`
    : ""
}

Risks / Dependencies
${bullets(risks)}

Questions to Confirm Before Final Proposal
${bullets(questions)}

Suggested Next Step
- 15–20 minute scope confirmation call
- Confirm pages/features/content readiness
- Finalize platform and timeline
- Send final proposal + deposit invoice

Notes for internal use
- This draft was generated from the quote + PIE report and should be reviewed before sending.
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { quoteId?: string };
    const quoteId = String(body.quoteId || "").trim();

    if (!quoteId) {
      return NextResponse.json({ ok: false, error: "quoteId is required" }, { status: 400 });
    }

    const { data: quote, error: qErr } = await supabaseAdmin
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (qErr || !quote) {
      return NextResponse.json(
        { ok: false, error: qErr?.message || "Quote not found" },
        { status: 404 }
      );
    }

    const [{ data: lead }, { data: callRow }, { data: pieRow }] = await Promise.all([
      quote.lead_id
        ? supabaseAdmin.from("leads").select("*").eq("id", quote.lead_id).single()
        : Promise.resolve({ data: null as any }),
      supabaseAdmin
        .from("call_requests")
        .select("*")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("pie_reports")
        .select("id, quote_id, created_at, score, tier, confidence, report")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const proposalText = buildProposalText({
      quote,
      lead: lead ?? null,
      callRequest: callRow ?? null,
      pieRow: pieRow ?? null,
    });

    const debug = toObj(quote.debug);
    const admin = toObj(debug.admin_v15);

    admin.proposalDraft = proposalText;
    admin.proposalGeneratedAt = new Date().toISOString();
    debug.admin_v15 = admin;

    const { error: updErr } = await supabaseAdmin
      .from("quotes")
      .update({ debug })
      .eq("id", quoteId);

    if (updErr) {
      return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      proposalText,
      pieReportId: pieRow?.id ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}