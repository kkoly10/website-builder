import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LooseObj = Record<string, any>;

function toNum(v: any) { const x = Number(v); return Number.isFinite(x) ? x : 0; }
function firstString(...vals: any[]) { for (const v of vals) { if (typeof v === "string" && v.trim()) return v.trim(); } return ""; }

function extractLeadEmail(body: LooseObj) {
  const raw = firstString(body?.leadEmail, body?.email, body?.contactEmail, body?.lead?.email, body?.intakeNormalized?.leadEmail, body?.intakeRaw?.leadEmail);
  const norm = raw.trim().toLowerCase();
  return norm.includes("@") ? norm : "";
}

function extractLeadName(body: LooseObj) {
  return firstString(body?.contactName, body?.lead?.name, body?.intakeNormalized?.contactName, body?.intakeRaw?.contactName, body?.intakeRaw?.name);
}

function extractEstimate(body: LooseObj) {
  const est = body?.estimate && typeof body.estimate === "object" ? body.estimate : {};
  const total = toNum(est?.total ?? est?.target ?? body?.estimate_total ?? body?.estimateTarget ?? body?.target);
  const low = toNum(est?.low ?? est?.min ?? body?.estimate_low ?? body?.estimateMin ?? body?.min);
  const high = toNum(est?.high ?? est?.max ?? body?.estimate_high ?? body?.estimateMax ?? body?.max);

  const safeLow = low > 0 ? low : Math.round(total * 0.9);
  const safeHigh = high > 0 ? high : Math.round(total * 1.15);
  return { total, low: Math.min(safeLow, safeHigh), high: Math.max(safeLow, safeHigh) };
}

// RESTORED: Safely check both column name variants
async function findLeadByEmail(email: string) {
  {
    const res = await supabaseAdmin.from("leads").select("id").eq("email", email).maybeSingle();
    if (!res.error && res.data?.id) return { id: String(res.data.id), col: "email" as const };
  }
  {
    const res = await supabaseAdmin.from("leads").select("id").eq("lead_email", email).maybeSingle();
    if (!res.error && res.data?.id) return { id: String(res.data.id), col: "lead_email" as const };
  }
  return null;
}

// RESTORED: Safely attempt insert on both column name variants
async function createLead(email: string, name: string | null) {
  {
    const res = await supabaseAdmin.from("leads").insert({ email }).select("id").single();
    if (!res.error && res.data?.id) {
      const id = String(res.data.id);
      if (name) await supabaseAdmin.from("leads").update({ name }).eq("id", id);
      return id;
    }
  }
  {
    const res = await supabaseAdmin.from("leads").insert({ lead_email: email }).select("id").single();
    if (!res.error && res.data?.id) {
      const id = String(res.data.id);
      if (name) await supabaseAdmin.from("leads").update({ name }).eq("id", id);
      return id;
    }
  }
  throw new Error("Failed to create lead row (check leads table columns/RLS).");
}

async function ensureLeadId(email: string, name: string | null) {
  const existing = await findLeadByEmail(email);
  if (existing?.id) return existing.id;
  return await createLead(email, name);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as LooseObj;

    const leadEmail = extractLeadEmail(body);
    if (!leadEmail) return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });

    const leadName = extractLeadName(body) || null;
    const { total, low, high } = extractEstimate(body);

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const leadId = await ensureLeadId(leadEmail, leadName);
    const quoteId = String(body.quoteId ?? "").trim() || null;

    const dbPayload = {
      lead_id: leadId,
      lead_email: leadEmail,
      owner_email_norm: normalizeEmail(leadEmail),
      auth_user_id: user?.id ?? null,
      quote_json: { ...body, leadEmail, estimateComputed: { total, low, high } },
      estimate_total: total,
      estimate_low: low,
      estimate_high: high,
      status: "submitted",
    };

    let savedQuoteId: string;

    if (quoteId) {
      const { data, error } = await supabaseAdmin.from("quotes").update(dbPayload).eq("id", quoteId).select("id").single();
      if (error) throw new Error(error.message);
      savedQuoteId = String(data.id);
    } else {
      const { data, error } = await supabaseAdmin.from("quotes").insert(dbPayload).select("id").single();
      if (error) throw new Error(error.message);
      savedQuoteId = String(data.id);
    }

    return NextResponse.json({ ok: true, quoteId: savedQuoteId, nextUrl: `/book?quoteId=${savedQuoteId}` });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unknown error" }, { status: 500 });
  }
}
