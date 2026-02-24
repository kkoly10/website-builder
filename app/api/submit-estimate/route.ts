// app/api/submit-estimate/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
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

function makePublicToken() {
  return crypto.randomBytes(8).toString("hex");
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

    // Detect logged-in user (if any)
    let authUserId: string | null = null;
    let authUserEmail: string | null = null;

    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      authUserId = user?.id ?? null;
      authUserEmail = normalizeEmail(user?.email);
    } catch {
      // okay if request is anonymous
    }

    const shouldAttachToUser = !!authUserId && !!authUserEmail && authUserEmail === email;

    // 1) upsert lead by email
    const leadUpsertPayload: Record<string, any> = {
      email,
      phone,
      name,
      source,
      owner_email_norm: email,
      last_seen_at: new Date().toISOString(),
    };

    if (shouldAttachToUser) {
      leadUpsertPayload.auth_user_id = authUserId;
    }

    const upsertLead = await supabaseAdmin
      .from("leads")
      .upsert(leadUpsertPayload, { onConflict: "email" })
      .select("id,email")
      .single();

    if (upsertLead.error) {
      return NextResponse.json({ error: upsertLead.error.message }, { status: 400 });
    }

    const leadId = upsertLead.data.id;

    // 2) insert quote
    const total = Math.max(0, Math.round(Number(body?.estimate?.total ?? 0)));
    const low = Math.max(0, Math.round(Number(body?.estimate?.low ?? 0)));
    const high = Math.max(0, Math.round(Number(body?.estimate?.high ?? 0)));

    const publicToken = makePublicToken();

    const quoteInsertPayload: Record<string, any> = {
      lead_id: leadId,
      status: "new",
      public_token: publicToken,
      owner_email_norm: email,

      tier_recommended: body?.estimate?.tierRecommended ?? null,
      estimate_total: total,
      estimate_low: low,
      estimate_high: high,

      intake_raw: body?.intakeRaw ?? {},
      intake_normalized: body?.intakeNormalized ?? {},
      scope_snapshot: body?.scopeSnapshot ?? {},
      debug: body?.debug ?? {},
    };

    if (shouldAttachToUser) {
      quoteInsertPayload.auth_user_id = authUserId;
    }

    const insertQuote = await supabaseAdmin
      .from("quotes")
      .insert(quoteInsertPayload)
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
      attachedToUser: shouldAttachToUser,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
