// app/api/request-call/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function normalizeBaseUrl(v: string | undefined) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://${s}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const quoteId = String(body?.quoteId ?? "").trim();
    const notes = String(body?.notes ?? "").trim();
    const bestTimeToCall = String(body?.bestTimeToCall ?? "").trim();

    if (!quoteId) {
      return NextResponse.json({ error: "Missing quote reference." }, { status: 400 });
    }

    // Load quote + lead (for email content)
    const { data: quote, error: qErr } = await supabaseAdmin
      .from("quotes")
      .select(
        `
        id,
        status,
        estimate_total,
        tier_recommended,
        leads (
          email,
          phone,
          name
        )
      `
      )
      .eq("id", quoteId)
      .single();

    if (qErr || !quote) {
      return NextResponse.json({ error: qErr?.message || "Quote not found." }, { status: 404 });
    }

    // Insert call request row (recommended)
    const { error: crErr } = await supabaseAdmin.from("call_requests").insert({
      quote_id: quoteId,
      notes,
      best_time_to_call: bestTimeToCall || null,
      status: "new",
    });

    if (crErr) {
      return NextResponse.json({ error: crErr.message }, { status: 400 });
    }

    // Update quote status (optional, but useful)
    await supabaseAdmin
      .from("quotes")
      .update({ status: "call_requested" })
      .eq("id", quoteId);

    // Email notification (optional)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM = process.env.RESEND_FROM_EMAIL;
    const TO = process.env.ALERT_TO_EMAIL;
    const BASE = normalizeBaseUrl(process.env.APP_BASE_URL);

    if (RESEND_API_KEY && FROM && TO) {
      const lead = Array.isArray((quote as any).leads) ? (quote as any).leads[0] : (quote as any).leads;
      const leadEmail = lead?.email ?? "(missing)";
      const leadPhone = lead?.phone ?? "";
      const leadName = lead?.name ?? "";

      const internalLink = BASE ? `${BASE}/internal/preview?quoteId=${quoteId}` : "";

      const subject = `Scope call requested — ${leadEmail} — ${quoteId.slice(0, 8)}`;
      const html = `
        <div style="font-family:ui-sans-serif,system-ui;line-height:1.5">
          <h2 style="margin:0 0 10px">New scope call request</h2>
          <p style="margin:0 0 6px"><strong>Quote ID:</strong> ${quoteId}</p>
          <p style="margin:0 0 6px"><strong>Lead:</strong> ${leadEmail}${leadPhone ? ` • ${leadPhone}` : ""}${leadName ? ` • ${leadName}` : ""}</p>
          <p style="margin:0 0 6px"><strong>Estimate:</strong> $${(quote as any).estimate_total} • ${(quote as any).tier_recommended ?? "—"}</p>
          ${bestTimeToCall ? `<p style="margin:0 0 6px"><strong>Best time to call:</strong> ${bestTimeToCall}</p>` : ""}
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
        body: JSON.stringify({
          from: FROM,
          to: [TO],
          subject,
          html,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

// tiny safe escape for notes
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
