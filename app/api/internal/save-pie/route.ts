// app/api/internal/save-pie/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { evaluatePIE } from "@/lib/pie";
import { requireAdminRoute } from "@/lib/routeAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const form = await req.formData();
  const quoteId = String(form.get("quoteId") ?? "").trim();

  if (!quoteId) {
    return NextResponse.json({ error: "Missing quoteId" }, { status: 400 });
  }

  const { data: quote, error } = await supabaseAdmin
    .from("quotes")
    .select("id,estimate_total,estimate_low,estimate_high,tier_recommended,intake_normalized,scope_snapshot,leads(email,phone,name)")
    .eq("id", quoteId)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: error?.message ?? "Quote not found" }, { status: 404 });
  }

  const leads = (quote as any).leads;
  const lead = Array.isArray(leads) ? leads[0] ?? {} : (leads ?? {});

  const report = evaluatePIE({
    ...(quote as any).intake_normalized,
    scopeSnapshot: (quote as any).scope_snapshot ?? {},
    estimate: {
      total: (quote as any).estimate_total,
      low: (quote as any).estimate_low,
      high: (quote as any).estimate_high,
      tier: (quote as any).tier_recommended,
    },
    lead,
  });

  const insert = await supabaseAdmin
    .from("pie_reports")
    .insert({ quote_id: quoteId, report_json: report })
    .select("id")
    .single();

  if (insert.error) {
    return NextResponse.json({ error: insert.error.message }, { status: 400 });
  }

  await supabaseAdmin
    .from("quotes")
    .update({ latest_pie_report_id: insert.data.id })
    .eq("id", quoteId);

  const redirectTo = `/internal/quotes/${quoteId}`;
  return NextResponse.redirect(new URL(redirectTo, req.url));
}