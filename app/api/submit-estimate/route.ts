// app/api/submit-estimate/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

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

function num(n: any) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.round(v));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    const email = cleanEmail(body?.lead?.email);
    const phone = String(body?.lead?.phone ?? "").trim() || null;
    const name = String(body?.lead?.name ?? "").trim() || null;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const source = String(body?.source ?? "estimate");

    // 1) upsert lead by email
    const upsertLead = await supabaseAdmin
      .from("leads")
      .upsert(
        {
          email,
          phone,
          name,
          source,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select("id,email")
      .single();

    if (upsertLead.error) {
      return NextResponse.json({ error: upsertLead.error.message }, { status: 400 });
    }

    const leadId = upsertLead.data.id;

    // 2) insert quote (with public token for safe sharing)
    const total = num(body?.estimate?.total);
    const low = num(body?.estimate?.low);
    const high = num(body?.estimate?.high);

    const insertQuote = await supabaseAdmin
      .from("quotes")
      .insert({
        lead_id: leadId,
        status: "new",
        tier_recommended: body?.estimate?.tierRecommended ?? null,
        estimate_total: total,
        estimate_low: low,
        estimate_high: high,
        public_token: randomUUID(), // requires quotes.public_token (uuid)
        intake_raw: body?.intakeRaw ?? {},
        intake_normalized: body?.intakeNormalized ?? {},
        scope_snapshot: body?.scopeSnapshot ?? {},
        debug: body?.debug ?? {},
      })
      .select("id, public_token")
      .single();

    if (insertQuote.error) {
      return NextResponse.json({ error: insertQuote.error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      leadId,
      quoteId: insertQuote.data.id,
      publicToken: insertQuote.data.public_token,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}