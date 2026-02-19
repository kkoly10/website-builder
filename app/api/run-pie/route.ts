// app/api/run-pie/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { evaluatePIE } from "@/lib/pie";

export const runtime = "nodejs";

type Body = { quoteId?: string };

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function firstLead(leads: any) {
  if (!leads) return null;
  return Array.isArray(leads) ? leads[0] ?? null : leads;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const quoteId = String(body?.quoteId ?? "").trim();

    if (!quoteId || !isUuid(quoteId)) {
      return NextResponse.json({ error: "Missing or invalid quoteId." }, { status: 400 });
    }

    // Load quote + lead
    const { data: quote, error } = await supabaseAdmin
      .from("quotes")
      .select(
        `
        id,
        lead_id,
        tier_recommended,
        estimate_total,
        estimate_low,
        estimate_high,
        intake_raw,
        intake_normalized,
        scope_snapshot,
        debug,
        leads (
          email,
          phone,
          name
        )
      `
      )
      .eq("id", quoteId)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: error?.message ?? "Quote not found." }, { status: 404 });
    }

    const lead = firstLead((quote as any).leads);

    // Build a payload compatible with what you already used in v1
    const payload = {
      source: "supabase",
      lead: {
        email: lead?.email ?? null,
        phone: lead?.phone ?? null,
        name: lead?.name ?? null,
      },
      intakeRaw: (quote as any).intake_raw ?? {},
      intakeNormalized: (quote as any).intake_normalized ?? {},
      scopeSnapshot: (quote as any).scope_snapshot ?? {},
      estimate: {
        total: Number((quote as any).estimate_total ?? 0),
        low: Number((quote as any).estimate_low ?? 0),
        high: Number((quote as any).estimate_high ?? 0),
        tierRecommended: (quote as any).tier_recommended ?? null,
      },
      debug: (quote as any).debug ?? {},
    };

    // Evaluate PIE (sync or async safe)
    const report = await Promise.resolve(evaluatePIE(payload as any));

    // Store PIE
    const insert = await supabaseAdmin
      .from("pie_reports")
      .insert({
        quote_id: quoteId,
        lead_id: (quote as any).lead_id ?? null,
        status: "generated",
        score: report?.score ?? null,
        tier: report?.tier ?? null,
        confidence: report?.confidence ?? null,
        summary: report?.summary ?? null,
        pricing_target: report?.pricing?.target ?? null,
        pricing_minimum: report?.pricing?.minimum ?? null,
        risks: report?.risks ?? [],
        pitch: report?.pitch ?? {},
        report: report ?? {},
        input: payload ?? {},
      })
      .select("id")
      .single();

    if (insert.error) {
      return NextResponse.json({ error: insert.error.message }, { status: 400 });
    }

    const pieReportId = insert.data.id;

    // Update quote pointer
    const upd = await supabaseAdmin
      .from("quotes")
      .update({ latest_pie_report_id: pieReportId })
      .eq("id", quoteId);

    if (upd.error) {
      return NextResponse.json({ error: upd.error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, pieReportId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}