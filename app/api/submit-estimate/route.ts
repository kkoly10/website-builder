// app/api/submit-estimate/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import crypto from "crypto";

export const runtime = "nodejs";

type Payload = {
  source?: string; // "estimate" | "build" | etc
  lead?: {
    email: string;
    phone?: string;
    name?: string;
  };
  intakeRaw?: any;
  intakeNormalized?: any;
  scopeSnapshot?: any;
  estimate?: {
    total: number;
    low: number;
    high: number;
    tierRecommended?: string;
  };
  debug?: any;
};

function cleanEmail(email: unknown) {
  return String(email ?? "").trim().toLowerCase();
}

function cleanStr(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function toMoneyInt(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

// stable stringify (sort keys) so hashing is consistent
function stableStringify(input: any): string {
  if (input === null || typeof input !== "object") return JSON.stringify(input);
  if (Array.isArray(input)) return `[${input.map(stableStringify).join(",")}]`;
  const keys = Object.keys(input).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableStringify(input[k])).join(",")}}`;
}

function sha256(str: string) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

// optional fallback if your table doesn't have a column yet
function isMissingColumnError(msg: string) {
  return /column .* does not exist|does not exist/i.test(msg);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    const email = cleanEmail(body?.lead?.email);
    const phone = cleanStr(body?.lead?.phone);
    const name = cleanStr(body?.lead?.name);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const source = String(body?.source ?? "estimate");

    // Prefer normalized for dedupe; fallback to raw
    const intakeForHash = body?.intakeNormalized ?? body?.intakeRaw ?? {};
    const intakeHash = sha256(stableStringify(intakeForHash));

    // 1) upsert lead by email (with safe fallback if columns don't exist)
    let upsertLead = await supabaseAdmin
      .from("leads")
      .upsert(
        {
          email,
          phone,
          name,
          // These are nice-to-have if you created the columns:
          source,
          last_seen_at: new Date().toISOString(),
        } as any,
        { onConflict: "email" }
      )
      .select("id,email")
      .single();

    if (upsertLead.error && isMissingColumnError(upsertLead.error.message)) {
      // fallback to minimal columns if needed
      upsertLead = await supabaseAdmin
        .from("leads")
        .upsert({ email, phone, name } as any, { onConflict: "email" })
        .select("id,email")
        .single();
    }

    if (upsertLead.error) {
      return NextResponse.json({ error: upsertLead.error.message }, { status: 400 });
    }

    const leadId = upsertLead.data.id as string;

    // 2) Dedup (same intakeHash within last 15 minutes for this lead)
    const cutoffISO = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const recent = await supabaseAdmin
      .from("quotes")
      .select("id, intake_normalized, created_at")
      .eq("lead_id", leadId)
      .gte("created_at", cutoffISO)
      .order("created_at", { ascending: false })
      .limit(12);

    if (recent.error) {
      // not fatal; we can still insert
      // but we keep going
    } else if (recent.data?.length) {
      for (const q of recent.data) {
        const existingHash = sha256(stableStringify(q.intake_normalized ?? {}));
        if (existingHash === intakeHash) {
          return NextResponse.json({
            ok: true,
            leadId,
            quoteId: q.id,
            deduped: true,
            intakeHash,
          });
        }
      }
    }

    // 3) insert quote
    const total = toMoneyInt(body?.estimate?.total);
    const low = toMoneyInt(body?.estimate?.low);
    const high = toMoneyInt(body?.estimate?.high);

    const debugMerged = {
      ...(body?.debug ?? {}),
      intakeHash,
      dedupeWindowMinutes: 15,
      source,
    };

    // Try insert with richer columns first; fallback if your schema differs
    let insertQuote = await supabaseAdmin
      .from("quotes")
      .insert({
        lead_id: leadId,
        status: "new",
        tier_recommended: body?.estimate?.tierRecommended ?? null,
        estimate_total: total,
        estimate_low: low,
        estimate_high: high,
        // store normalized (source of truth)
        intake_normalized: body?.intakeNormalized ?? body?.intakeRaw ?? {},
        scope_snapshot: body?.scopeSnapshot ?? {},
        debug: debugMerged,
      } as any)
      .select("id")
      .single();

    if (insertQuote.error && isMissingColumnError(insertQuote.error.message)) {
      // fallback minimal insert (if some json columns weren't created)
      insertQuote = await supabaseAdmin
        .from("quotes")
        .insert({
          lead_id: leadId,
          status: "new",
          estimate_total: total,
          estimate_low: low,
          estimate_high: high,
        } as any)
        .select("id")
        .single();
    }

    if (insertQuote.error) {
      return NextResponse.json({ error: insertQuote.error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      leadId,
      quoteId: insertQuote.data.id,
      deduped: false,
      intakeHash,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}