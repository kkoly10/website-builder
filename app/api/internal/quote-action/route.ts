// app/api/internal/quote-action/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function okToken(token: string) {
  const expected = process.env.INTERNAL_DASH_TOKEN || "";
  return expected && token && token === expected;
}

async function readBody(req: Request): Promise<Record<string, any>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as any;
  }
  const fd = await req.formData();
  return Object.fromEntries(fd.entries());
}

export async function POST(req: Request) {
  const referer = req.headers.get("referer") || "/internal/dashboard";

  try {
    const body = await readBody(req);

    const token = String(body.token || "").trim();
    if (!okToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const action = String(body.action || "").trim();
    const quoteId = String(body.quoteId || "").trim();

    if (!quoteId) {
      return NextResponse.json({ error: "Missing quoteId" }, { status: 400 });
    }

    if (action === "update_status") {
      const status = String(body.status || "new").trim();

      const { error } = await supabaseAdmin
        .from("quotes")
        .update({ status })
        .eq("id", quoteId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.redirect(referer, 303);
    }

    if (action === "lock_scope") {
      const { data, error: loadErr } = await supabaseAdmin
        .from("quotes")
        .select("scope_snapshot")
        .eq("id", quoteId)
        .single();

      if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 400 });

      const scope = (data as any)?.scope_snapshot ?? {};

      const { error: updErr } = await supabaseAdmin
        .from("quotes")
        .update({
          scope_locked_snapshot: scope,
          scope_locked_at: new Date().toISOString(),
          status: "scope_locked",
        })
        .eq("id", quoteId);

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

      return NextResponse.redirect(referer, 303);
    }

    if (action === "set_deposit") {
      const deposit_link = String(body.deposit_link || "").trim() || null;
      const deposit_amount = body.deposit_amount ? Math.round(Number(body.deposit_amount)) : null;

      const { error } = await supabaseAdmin
        .from("quotes")
        .update({
          deposit_link,
          deposit_amount: Number.isFinite(deposit_amount as any) ? deposit_amount : null,
          deposit_status: deposit_link ? "sent" : null,
          deposit_sent_at: deposit_link ? new Date().toISOString() : null,
          status: deposit_link ? "deposit_sent" : undefined,
        })
        .eq("id", quoteId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.redirect(referer, 303);
    }

    if (action === "mark_deposit_paid") {
      const { error } = await supabaseAdmin
        .from("quotes")
        .update({
          deposit_status: "paid",
          deposit_paid_at: new Date().toISOString(),
          status: "deposit_paid",
        })
        .eq("id", quoteId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.redirect(referer, 303);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}