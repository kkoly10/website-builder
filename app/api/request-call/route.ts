// app/api/request-call/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeBaseUrl(v: string | undefined) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://${s}`;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const quoteId = String(body?.quoteId ?? url.searchParams.get("quoteId") ?? "").trim();
    const notes = String(body?.notes ?? "").trim();
    const bestTimeToCall = String(body?.bestTimeToCall ?? "").trim();
    const preferredTimes = String(body?.preferredTimes ?? "").trim();
    const timezone = String(body?.timezone ?? "").trim();

    if (!quoteId) {
      return NextResponse.json({ error: "Missing quote reference." }, { status: 400 });
    }

    const { data: quote, error: qErr } = await supabaseAdmin
      .from("quotes")
      .select("id, lead_id, lead_email, estimate_total, tier_recommended, status")
      .eq("id", quoteId)
      .single();

    if (qErr || !quote) {
      return NextResponse.json({ error: qErr?.message || "Quote not found." }, { status: 404 });
    }

    // Load lead safely (no nested join dependency)
    let leadEmail = quote.lead_email ?? "(missing)";
    let leadPhone = "";
    let leadName = "";

    if (quote.lead_id) {
      const { data: lead } = await supabaseAdmin
        .from("leads")
        .select("email, lead_email, phone, name")
        .eq("id", quote.lead_id)
        .maybeSingle();

      leadEmail = (lead?.email || lead?.lead_email || leadEmail) ?? leadEmail;
      leadPhone = lead?.phone ?? "";
      leadName = lead?.name ?? "";
    }

    // Attach quote to signed-in user if present (prevents “where is my quote?”)
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      await supabaseAdmin
        .from("quotes")
        .update({
          auth_user_id: user.id,
          owner_email_norm: normalizeEmail(user.email || leadEmail),
        })
        .eq("id", quoteId);
    }

    const { data: callRow, error: crErr } = await supabaseAdmin
      .from("call_requests")
      .insert({
        quote_id: quoteId,
        notes: notes || null,
        best_time_to_call: bestTimeToCall || null,
        preferred_times: preferredTimes || null,
        timezone: timezone || null,
        status: "requested",
      })
      .select("id")
      .single();

    if (crErr) {
      return NextResponse.json({ error: crErr.message }, { status: 400 });
    }

    await supabaseAdmin.from("quotes").update({ status: "call_requested" }).eq("id", quoteId);

    // Email notification (optional)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM = process.env.RESEND_FROM_EMAIL;
    const TO = process.env.ALERT_TO_EMAIL;
    const BASE = normalizeBaseUrl(process.env.APP_BASE_URL);

    if (RESEND_API_KEY && FROM && TO) {
      const internalLink = BASE ? `${BASE}/internal/preview?quoteId=${quoteId}` : "";
      const subject = `Scope call requested — ${leadEmail} — ${quoteId.slice(0, 8)}`;

      const html = `
        <div style="font-family:ui-sans-serif,system-ui;line-height:1.5">
          <h2 style="margin:0 0 10px">New scope call request</h2>
          <p style="margin:0 0 6px"><strong>Quote ID:</strong> ${quoteId}</p>
          <p style="margin:0 0 6px"><strong>Lead:</strong> ${escapeHtml(leadEmail)}${leadPhone ? ` • ${escapeHtml(leadPhone)}` : ""}${leadName ? ` • ${escapeHtml(leadName)}` : ""}</p>
          <p style="margin:0 0 6px"><strong>Estimate:</strong> $${Number(quote.estimate_total || 0)} • ${escapeHtml(String(quote.tier_recommended ?? "—"))}</p>
          ${bestTimeToCall ? `<p style="margin:0 0 6px"><strong>Best time to call:</strong> ${escapeHtml(bestTimeToCall)}</p>` : ""}
          ${preferredTimes ? `<p style="margin:0 0 6px"><strong>Preferred times:</strong> ${escapeHtml(preferredTimes)}</p>` : ""}
          ${timezone ? `<p style="margin:0 0 6px"><strong>Timezone:</strong> ${escapeHtml(timezone)}</p>` : ""}
          ${notes ? `<p style="margin:10px 0 0"><strong>Notes:</strong><br/>${escapeHtml(notes).replace(/\n/g, "<br/>")}</p>` : ""}
          ${internalLink ? `<p style="margin:12px 0 0"><a href="${internalLink}">Open internal preview</a></p>` : ""}
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: FROM, to: [TO], subject, html }),
      });
    }

    return NextResponse.json({
      ok: true,
      callRequestId: callRow?.id,
      nextUrl: `/portal?quoteId=${encodeURIComponent(quoteId)}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}