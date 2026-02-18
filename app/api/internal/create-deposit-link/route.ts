// app/api/internal/create-deposit-link/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkInternalAccess } from "@/lib/internalAuth";
import { getBaseUrl, stripeCreateCheckoutSession } from "@/lib/stripeServer";

export const runtime = "nodejs";

type Body = {
  token?: string;
  quoteId?: string;
  depositAmount?: number; // dollars
};

function safeObj(v: any) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function firstLead(leads: any) {
  if (!leads) return null;
  return Array.isArray(leads) ? leads[0] ?? null : leads;
}

function roundMoney(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.round(x));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const access = checkInternalAccess(body?.token ?? null);
    if (!access.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const quoteId = String(body?.quoteId ?? "").trim();
    if (!quoteId) return NextResponse.json({ error: "quoteId is required" }, { status: 400 });

    const { data: q, error } = await supabaseAdmin
      .from("quotes")
      .select(
        `
        id,
        status,
        estimate_total,
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

    if (error || !q) {
      return NextResponse.json({ error: error?.message || "Quote not found" }, { status: 404 });
    }

    const lead = firstLead((q as any).leads);
    const email = String(lead?.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Lead email missing; cannot create deposit link." }, { status: 400 });
    }

    const prevDebug = safeObj((q as any).debug);
    const prevInternal = safeObj((prevDebug as any).internal);

    const finalPrice = roundMoney(prevInternal?.final_price ?? (q as any).estimate_total ?? 0);

    // deposit dollars
    const depositDollars = roundMoney(
      body?.depositAmount ?? prevInternal?.deposit_amount ?? Math.max(100, Math.round(finalPrice * 0.3))
    );

    const depositCents = depositDollars * 100;

    const baseUrl = getBaseUrl(req);
    const successUrl = `${baseUrl}/deposit/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/deposit/cancel?quoteId=${encodeURIComponent(quoteId)}`;

    const session = await stripeCreateCheckoutSession({
      amountUsdCents: depositCents,
      customerEmail: email,
      quoteId,
      successUrl,
      cancelUrl,
    });

    const now = new Date().toISOString();
    const history = Array.isArray(prevInternal.history) ? prevInternal.history : [];
    history.push({ at: now, action: "create_deposit_link", status: "deposit_sent", depositDollars });

    const nextInternal = {
      ...prevInternal,
      deposit_amount: depositDollars,
      deposit: {
        session_id: session.id,
        url: session.url,
        amount: depositDollars,
        created_at: now,
      },
      history,
    };

    const nextDebug = { ...prevDebug, internal: nextInternal };

    // Move forward
    const currentStatus = String((q as any).status ?? "new");
    const nextStatus = currentStatus === "paid" ? "paid" : "deposit_sent";

    const updated = await supabaseAdmin
      .from("quotes")
      .update({
        status: nextStatus,
        debug: nextDebug,
      })
      .eq("id", quoteId)
      .select("id,status,debug")
      .single();

    if (updated.error) {
      return NextResponse.json({ error: updated.error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      quoteId,
      status: updated.data.status,
      depositUrl: session.url,
      sessionId: session.id,
      depositAmount: depositDollars,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}