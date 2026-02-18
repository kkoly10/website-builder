// app/api/book/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type Payload = {
  quoteId: string;
  token: string; // public_token
  name?: string;
  phone?: string;
  availability?: {
    option1?: string;
    option2?: string;
    option3?: string;
    timezone?: string;
  };
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    const quoteId = String(body?.quoteId ?? "").trim();
    const token = String(body?.token ?? "").trim();

    if (!quoteId || !token) {
      return NextResponse.json({ error: "Missing quoteId or token." }, { status: 400 });
    }

    // verify quote + token match
    const { data: q, error: qErr } = await supabaseAdmin
      .from("quotes")
      .select("id, public_token, lead_id")
      .eq("id", quoteId)
      .single();

    if (qErr || !q) {
      return NextResponse.json({ error: qErr?.message ?? "Quote not found." }, { status: 404 });
    }

    if ((q as any).public_token !== token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const name = String(body?.name ?? "").trim() || null;
    const phone = String(body?.phone ?? "").trim() || null;

    const call_request = {
      availability: body?.availability ?? {},
      notes: String(body?.notes ?? "").trim() || "",
      submitted_at: new Date().toISOString(),
    };

    // update quote pipeline
    const upd = await supabaseAdmin
      .from("quotes")
      .update({
        status: "awaiting_call",
        call_request,
        call_requested_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (upd.error) {
      return NextResponse.json({ error: upd.error.message }, { status: 400 });
    }

    // optionally update lead details
    if (name || phone) {
      await supabaseAdmin
        .from("leads")
        .update({
          name: name ?? undefined,
          phone: phone ?? undefined,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", (q as any).lead_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}