// app/api/internal/update-quote/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkInternalAccess } from "@/lib/internalAuth";

export const runtime = "nodejs";

type Body = {
  token?: string;
  quoteId?: string;
  status?: string;
  adminNotes?: string;
  callScheduledAt?: string;
};

function safeObj(v: any) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const access = checkInternalAccess(body?.token ?? null);
    if (!access.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quoteId = String(body?.quoteId ?? "").trim();
    if (!quoteId) {
      return NextResponse.json({ error: "quoteId is required" }, { status: 400 });
    }

    // Read existing debug so we can merge (Supabase JSON update overwrites)
    const existing = await supabaseAdmin
      .from("quotes")
      .select("id,status,debug")
      .eq("id", quoteId)
      .single();

    if (existing.error || !existing.data) {
      return NextResponse.json(
        { error: existing.error?.message || "Quote not found" },
        { status: 404 }
      );
    }

    const prevDebug = safeObj(existing.data.debug);
    const prevInternal = safeObj((prevDebug as any).internal);

    const nextInternal = {
      ...prevInternal,
      admin_notes: String(body?.adminNotes ?? ""),
      call_scheduled_at: String(body?.callScheduledAt ?? ""),
      updated_at: new Date().toISOString(),
    };

    const history = Array.isArray(nextInternal.history) ? nextInternal.history : [];
    history.push({
      at: new Date().toISOString(),
      action: "update",
      status: String(body?.status ?? existing.data.status ?? ""),
    });

    nextInternal.history = history;

    const nextDebug = {
      ...prevDebug,
      internal: nextInternal,
    };

    const nextStatus = String(body?.status ?? "").trim() || String(existing.data.status ?? "new");

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

    return NextResponse.json({ ok: true, quote: updated.data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}