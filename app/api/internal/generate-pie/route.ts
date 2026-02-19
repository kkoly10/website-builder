// app/api/internal/generate-pie/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildPieReport } from "@/lib/pie/buildPieReport";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const quoteId = String(body?.quoteId || "").trim();
  if (!quoteId) {
    return NextResponse.json({ error: "Missing quoteId" }, { status: 400 });
  }

  const { data: quote, error: qErr } = await supabaseAdmin
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (qErr || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  let lead: any = null;
  const leadId = quote?.lead_id ? String(quote.lead_id) : "";
  if (leadId) {
    const { data } = await supabaseAdmin.from("leads").select("*").eq("id", leadId).single();
    lead = data ?? null;
  }

  const pie = buildPieReport({ quote, lead });

  const { data: inserted, error: insErr } = await supabaseAdmin
    .from("pie_reports")
    .insert({
      quote_id: quoteId,
      lead_id: leadId || null,
      version: pie.version,
      score: pie.lead.score,
      tier: pie.pricing.tierRecommended,
      raw: pie,
    })
    .select("id")
    .single();

  if (insErr || !inserted?.id) {
    return NextResponse.json({ error: insErr?.message || "Failed to insert pie report" }, { status: 500 });
  }

  // update quotes.latest_pie_report_id (and optionally status)
  await supabaseAdmin
    .from("quotes")
    .update({
      latest_pie_report_id: inserted.id,
      status: quote?.status === "new" ? "pie_ready" : quote?.status,
    })
    .eq("id", quoteId);

  return NextResponse.json({ pieReportId: inserted.id }, { status: 200 });
}