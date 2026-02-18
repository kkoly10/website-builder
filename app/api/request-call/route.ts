// app/api/request-call/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";

export const runtime = "nodejs";

function baseUrl() {
  const raw = process.env.APP_BASE_URL || "";
  // IMPORTANT: your APP_BASE_URL is currently "crecystudio.com" (no https)
  // This normalizes it to "https://crecystudio.com"
  if (!raw) return "http://localhost:3000";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
}

type Body = {
  quoteId?: string;
  publicToken?: string;
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const qsQuoteId = (url.searchParams.get("quoteId") || "").trim();
    const qsToken = (url.searchParams.get("publicToken") || "").trim();

    let body: Body = {};
    try {
      body = (await req.json()) as Body;
    } catch {
      // allow empty body if using querystring
      body = {};
    }

    const quoteId = String(body.quoteId || qsQuoteId || "").trim();
    const publicToken = String(body.publicToken || qsToken || "").trim();
    const notes = String(body.notes || "").trim();

    if (!quoteId && !publicToken) {
      return NextResponse.json({ error: "Missing quote reference." }, { status: 400 });
    }

    // Load quote + lead (supports either quoteId or publicToken)
    const q = supabaseAdmin
      .from("quotes")
      .select(
        `
        id,
        created_at,
        status,
        tier_recommended,
        estimate_total,
        estimate_low,
        estimate_high,
        leads (
          email,
          phone,
          name
        )
      `
      )
      .limit(1);

    const { data, error } = quoteId
      ? await q.eq("id", quoteId).single()
      : await q.eq("public_token", publicToken).single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Quote not found." },
        { status: 404 }
      );
    }

    const lead = Array.isArray((data as any).leads) ? (data as any).leads[0] : (data as any).leads;

    // Update quote status
    await supabaseAdmin
      .from("quotes")
      .update({
        status: "call_requested",
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    // Email alerts (Resend)
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const alertTo = process.env.ALERT_TO_EMAIL;

    const app = baseUrl();
    const internalLink = `${app}/internal/preview?quoteId=${encodeURIComponent(data.id)}`;
    const bookLink = `${app}/book?quoteId=${encodeURIComponent(data.id)}`;

    // Always return ok even if email is not configured (so UX doesn’t break)
    if (resendKey && from && alertTo) {
      const resend = new Resend(resendKey);

      const subject = `New Call Request • ${lead?.email || "(no email)"} • Quote ${data.id}`;
      const html = `
        <div style="font-family: ui-sans-serif, system-ui; line-height: 1.45">
          <h2 style="margin:0 0 10px">New Call Request</h2>
          <p style="margin:0 0 10px">
            <strong>Lead:</strong> ${lead?.email || "(missing)"} ${lead?.phone ? ` • ${lead.phone}` : ""} ${lead?.name ? ` • ${lead.name}` : ""}
          </p>
          <p style="margin:0 0 10px">
            <strong>Quote:</strong> ${data.id}<br/>
            <strong>Total:</strong> $${data.estimate_total} (range $${data.estimate_low}–$${data.estimate_high})<br/>
            <strong>Tier:</strong> ${data.tier_recommended || "—"}<br/>
            <strong>Status:</strong> ${data.status || "—"}
          </p>
          ${notes ? `<p><strong>Notes:</strong><br/>${notes.replaceAll("\n", "<br/>")}</p>` : ""}
          <p style="margin:14px 0 0">
            <a href="${internalLink}">Open internal preview</a><br/>
            <a href="${bookLink}">Open booking page</a>
          </p>
        </div>
      `;

      await resend.emails.send({
        from,
        to: alertTo,
        subject,
        html,
      });

      // Optional: confirmation to lead (safe, short)
      if (lead?.email) {
        await resend.emails.send({
          from,
          to: lead.email,
          subject: "Request received — we’ll confirm scope on a quick call",
          html: `
            <div style="font-family: ui-sans-serif, system-ui; line-height: 1.45">
              <p>Thanks — we received your request.</p>
              <p>Next step: a quick scope call to confirm the plan. Payment happens after the call if you want to move forward.</p>
              <p>Your reference: <strong>${data.id}</strong></p>
            </div>
          `,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      quoteId: data.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}