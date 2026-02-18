// app/api/internal/quote/run-pie/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireInternalToken } from "@/lib/internalToken";
import { evaluatePIE } from "@/lib/pie";

export const runtime = "nodejs";

function pick(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function POST(req: Request) {
  const form = await req.formData();

  const token = pick(form, "token");
  const auth = requireInternalToken(token);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const quoteId = pick(form, "quoteId");
  if (!quoteId) return NextResponse.json({ error: "Missing quoteId" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("quotes")
    .select("id, intake_normalized, estimate_total, tier_recommended")
    .eq("id", quoteId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Quote not found" }, { status: 404 });
  }

  // Generate PIE from intake_normalized
  const payload = {
    intake: (data as any).intake_normalized ?? {},
    estimate_total: (data as any).estimate_total ?? null,
    tier_recommended: (data as any).tier_recommended ?? null,
  };

  const report = evaluatePIE(payload as any);

  const ins = await supabaseAdmin.from("pie_reports").insert({
    quote_id: quoteId,
    report,
  });

  if (ins.error) {
    return NextResponse.json({ error: ins.error.message }, { status: 400 });
  }

  const url = new URL(req.url);
  url.pathname = "/internal/dashboard";
  url.search = `token=${encodeURIComponent(token)}&quoteId=${encodeURIComponent(quoteId)}`;
  return NextResponse.redirect(url, { status: 303 });
}