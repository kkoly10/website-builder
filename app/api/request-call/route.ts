// app/api/request-call/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function cleanEmail(email: unknown) {
  return String(email ?? "").trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const quoteId = String(form.get("quoteId") ?? "").trim();
    const token = String(form.get("token") ?? "").trim();

    const email = cleanEmail(form.get("email"));
    const phone = String(form.get("phone") ?? "").trim() || null;
    const preferredTimes = String(form.get("preferred_times") ?? "").trim();
    const timezone = String(form.get("timezone") ?? "").trim() || "America/New_York";
    const notes = String(form.get("notes") ?? "").trim() || null;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (!preferredTimes) {
      return NextResponse.json({ error: "Preferred times are required." }, { status: 400 });
    }

    // Load quote either by id or token
    let quote: any = null;

    if (quoteId) {
      const q = await supabaseAdmin
        .from("quotes")
        .select("id, lead_id, public_token")
        .eq("id", quoteId)
        .single();
      if (q.error) return NextResponse.json({ error: q.error.message }, { status: 400 });
      quote = q.data;
    } else if (token) {
      const q = await supabaseAdmin
        .from("quotes")
        .select("id, lead_id, public_token")
        .eq("public_token", token)
        .single();
      if (q.error) return NextResponse.json({ error: q.error.message }, { status: 400 });
      quote = q.data;
    } else {
      return NextResponse.json({ error: "Missing quote reference." }, { status: 400 });
    }

    // Save call request
    const ins = await supabaseAdmin
      .from("call_requests")
      .insert({
        quote_id: quote.id,
        lead_id: quote.lead_id ?? null,
        preferred_times: preferredTimes,
        timezone,
        notes,
        status: "new",
      })
      .select("id")
      .single();

    if (ins.error) {
      return NextResponse.json({ error: ins.error.message }, { status: 400 });
    }

    // Update quote status
    await supabaseAdmin
      .from("quotes")
      .update({ status: "call_requested" })
      .eq("id", quote.id);

    // Redirect back
    const url = new URL(req.url);
    const redirectTo = `/book?quoteId=${encodeURIComponent(quote.id)}&sent=1`;
    url.pathname = redirectTo;
    url.search = "";
    return NextResponse.redirect(url, 303);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}