// app/api/request-call/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type Payload = {
  quoteId?: string;
  leadEmail?: string;
  callRequest?: any;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    const quoteId = String(body?.quoteId ?? "").trim();
    if (!quoteId) {
      return NextResponse.json({ error: "quoteId is required." }, { status: 400 });
    }

    const callRequest = body?.callRequest ?? {};
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("quotes")
      .update({
        status: "call_requested",
        call_request: callRequest,
        call_requested_at: now,
      })
      .eq("id", quoteId)
      .select("id,status,call_requested_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, quote: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}