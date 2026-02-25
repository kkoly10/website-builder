import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";

type LooseObj = Record<string, any>;

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function extractEstimate(payload: LooseObj) {
  const estimate = (payload.estimate && typeof payload.estimate === "object" ? payload.estimate : null) || {};
  const target = n(estimate.target ?? payload.estimateTarget ?? payload.target);
  const min = n(estimate.min ?? payload.estimateMin ?? payload.min);
  const max = n(estimate.max ?? payload.estimateMax ?? payload.max);
  return { target, min, max };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as LooseObj;
    const rawEmail = String(body.leadEmail ?? body.email ?? body.contactEmail ?? body?.lead?.email ?? "").trim();
    if (!rawEmail.includes("@")) return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    
    const leadEmail = rawEmail.toLowerCase();

    // 1. Relational Logic: Find or Create Lead
    let { data: lead } = await supabaseAdmin.from("leads").select("id").eq("email", leadEmail).maybeSingle();
    if (!lead) {
      const { data: newLead, error: lErr } = await supabaseAdmin.from("leads").insert({ email: leadEmail, name: body.contactName || null }).select("id").single();
      if (lErr) throw lErr;
      lead = newLead;
    }

    // 2. Prepare Data
    const est = extractEstimate(body);
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // RESTORED: Look for existing quoteId to prevent duplicates
    const quoteId = String(body.quoteId ?? "").trim() || null;
    let savedQuoteId: string | null = quoteId;

    const dbPayload = {
      lead_id: lead.id,
      lead_email: leadEmail,
      owner_email_norm: normalizeEmail(leadEmail),
      auth_user_id: user?.id ?? null,
      quote_json: body,
      estimate_total: est.target,
      estimate_low: est.min,
      estimate_high: est.max,
      status: "submitted",
      updated_at: new Date().toISOString()
    };

    if (quoteId) {
      // RESTORED: Update existing quote
      const { data, error: updateError } = await supabaseAdmin
        .from("quotes")
        .update(dbPayload)
        .eq("id", quoteId)
        .select("id")
        .single();

      if (updateError) throw updateError;
      savedQuoteId = data.id;
    } else {
      // RESTORED: Insert new quote
      const { data, error: insertError } = await supabaseAdmin
        .from("quotes")
        .insert([dbPayload])
        .select("id")
        .single();

      if (insertError) throw insertError;
      savedQuoteId = data.id;
    }

    return NextResponse.json({ ok: true, quoteId: savedQuoteId, nextUrl: `/book?quoteId=${savedQuoteId}` });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
