// app/api/internal/lock-scope/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkInternalAccess } from "@/lib/internalAuth";

export const runtime = "nodejs";

type Body = {
  token?: string;
  quoteId?: string;
  finalPrice?: number;
  depositAmount?: number;
  discountPercent?: number;
  discountAmount?: number;
};

function safeObj(v: any) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
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
      .select("id,status,estimate_total,scope_snapshot,debug")
      .eq("id", quoteId)
      .single();

    if (error || !q) {
      return NextResponse.json({ error: error?.message || "Quote not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    const prevSnap = safeObj((q as any).scope_snapshot);
    const prevDebug = safeObj((q as any).debug);
    const prevInternal = safeObj((prevDebug as any).internal);

    const estimateTotal = roundMoney((q as any).estimate_total ?? 0);

    const finalPrice = roundMoney(body?.finalPrice ?? prevInternal?.final_price ?? estimateTotal);

    const depositAmount =
      roundMoney(
        body?.depositAmount ??
          prevInternal?.deposit_amount ??
          Math.max(100, Math.round(finalPrice * 0.3))
      );

    const discountPercent = roundMoney(body?.discountPercent ?? prevInternal?.discount_percent ?? 0);
    const discountAmount = roundMoney(body?.discountAmount ?? prevInternal?.discount_amount ?? 0);

    const nextSnap = {
      ...prevSnap,
      locked: true,
      locked_at: now,
      locked_final_price: finalPrice,
      locked_deposit_amount: depositAmount,
    };

    const history = Array.isArray(prevInternal.history) ? prevInternal.history : [];
    history.push({ at: now, action: "lock_scope", status: "scope_locked", finalPrice, depositAmount });

    const nextInternal = {
      ...prevInternal,
      locked: true,
      locked_at: now,
      final_price: finalPrice,
      deposit_amount: depositAmount,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      history,
    };

    const nextDebug = { ...prevDebug, internal: nextInternal };

    // Only move forward to scope_locked if not already later-stage
    const currentStatus = String((q as any).status ?? "new");
    const keepIfLater = new Set(["deposit_sent", "paid"]);
    const nextStatus = keepIfLater.has(currentStatus) ? currentStatus : "scope_locked";

    const updated = await supabaseAdmin
      .from("quotes")
      .update({
        status: nextStatus,
        scope_snapshot: nextSnap,
        debug: nextDebug,
      })
      .eq("id", quoteId)
      .select("id,status,scope_snapshot,debug")
      .single();

    if (updated.error) {
      return NextResponse.json({ error: updated.error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, quote: updated.data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}