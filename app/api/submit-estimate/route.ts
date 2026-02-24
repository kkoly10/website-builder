// app/api/submit-estimate/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";

type LooseObj = Record<string, any>;

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function pick(obj: LooseObj | null | undefined, keys: string[]) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] != null) return obj[k];
  }
  return undefined;
}

function extractEstimate(payload: LooseObj) {
  const estimate = (payload.estimate && typeof payload.estimate === "object" ? payload.estimate : null) || {};
  const pricing = (payload.pricing && typeof payload.pricing === "object" ? payload.pricing : null) || {};

  const target = n(
    pick(estimate, ["target", "recommended", "price", "total"]) ??
      pick(pricing, ["target", "recommended", "price", "total"]) ??
      payload.estimateTarget ??
      payload.target
  );

  const min = n(
    pick(estimate, ["min", "minimum", "low"]) ??
      pick(pricing, ["min", "minimum", "low"]) ??
      payload.estimateMin ??
      payload.min
  );

  const max = n(
    pick(estimate, ["max", "maximum", "high"]) ??
      pick(pricing, ["max", "maximum", "high"]) ??
      payload.estimateMax ??
      payload.max
  );

  return { target, min, max };
}

function hasValidEstimate(payload: LooseObj) {
  const est = extractEstimate(payload);

  // allow some flows that only send target
  const anyPositive = est.target > 0 || est.min > 0 || est.max > 0;
  const rangeValid = est.max === 0 || est.min === 0 || est.max >= est.min;

  return anyPositive && rangeValid;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as LooseObj;

    const leadEmail = String(
      body.leadEmail ?? body.email ?? body.contactEmail ?? body?.lead?.email ?? ""
    )
      .trim()
      .toLowerCase();

    if (!leadEmail || !leadEmail.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Missing valid lead email" },
        { status: 400 }
      );
    }

    if (!hasValidEstimate(body)) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid estimate payload" },
        { status: 400 }
      );
    }

    const quoteId = String(body.quoteId ?? "").trim() || null;
    const ownerEmailNorm = normalizeEmail(leadEmail);

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const authUserId = user?.id ?? null;

    const payloadToStore = {
      ...body,
      leadEmail,
    };

    let savedQuoteId: string | null = quoteId;

    if (quoteId) {
      const { data, error } = await supabaseAdmin
        .from("quotes")
        .update({
          lead_email: leadEmail,
          owner_email_norm: ownerEmailNorm,
          auth_user_id: authUserId,
          quote_json: payloadToStore,
          status: "submitted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", quoteId)
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      savedQuoteId = data?.id ?? quoteId;
    } else {
      const { data, error } = await supabaseAdmin
        .from("quotes")
        .insert({
          lead_email: leadEmail,
          owner_email_norm: ownerEmailNorm,
          auth_user_id: authUserId,
          quote_json: payloadToStore,
          status: "submitted",
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      savedQuoteId = data?.id ?? null;
    }

    return NextResponse.json({
      ok: true,
      quoteId: savedQuoteId,
      nextUrl: `/book?quoteId=${encodeURIComponent(savedQuoteId || "")}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
