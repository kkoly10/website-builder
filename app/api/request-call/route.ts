// app/api/request-call/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function normalizeBaseUrl() {
  const raw = process.env.APP_BASE_URL || "";
  if (!raw) return "http://localhost:3000";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
}

async function sendResendEmail(args: {
  to: string;
  subject: string;
  html: string;
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  // If email env isn't configured, silently skip (don’t break UX)
  if (!key || !from) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    // Don’t throw hard (so UI still works); just surface in logs
    console.error("Resend error:", res.status, text);
  }
}

type Body = {
  quoteId?: string;
  publicToken?: string;
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);

    // Allow either body or querystring
    let body: Body = {};
    try {
      body = (await req.json()) as Body;
    } catch {
      body = {};
    }

    const quoteId = String(body.quoteId || url.searchParams.get("quoteId") || "").trim();
    const publicToken = String(body.publicToken || url.searchParams.get("publicToken") || "").trim();
    const notes = String(body.notes || "").trim();

    if (!quoteId && !publicToken) {
      return NextResponse.json(
        {
          error: "Missing quote reference.",
          hint: "Send quoteId (recommended) or publicToken in JSON body or querystring.",
        },
        { status: 400 }
      );
    }

    // Load quote + lead
    const baseQuery = supabaseAdmin
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
      );

    const { data, error } = quoteId
      ? await baseQuery.eq("id", quoteId).single()
      : await baseQuery.eq("public_token", publicToken).single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Quote not found." },
        { status: 404 }
      );
    }

    const lead = Array.isArray((data as any).leads)
      ? (data as any).leads[0]
      : (data as any).leads;

    // Mark status
    await supabaseAdmin
      .from("quotes")
      .update({
        status: "call_requested",
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    // Email internal alert
    const alertTo = process.env.ALERT_TO_EMAIL;
    const app = normalizeBaseUrl();
    const internalLink = `${app}/internal/preview?quoteId=${encodeURIComponent(data.id)}`;

    if (alertTo) {
      await sendResendEmail({
        to: alertTo,
        subject: `New Call Request • ${lead?.email || "(no email)"} • Quote ${data.id}`,
        html: `
          <div style="font-family: ui-sans-serif, system-ui; line-height:1.5">
            <h2 style="margin:0 0 10px">New Call Request</h2>
            <p style="margin:0 0 10px">
              <strong>Lead:</strong> ${lead?.email || "(missing)"} ${lead?.phone ? ` • ${lead.phone}` : ""} ${lead?.name ? ` • ${lead.name}` : ""}
            </p>
            <p style="margin:0 0 10px">
              <strong>Quote:</strong> ${data.id}<br/>
              <strong>Total:</strong> $${data.estimate_total} (range $${data.estimate_low}–$${data.estimate_high})<br/>
              <strong>Tier:</strong> ${data.tier_recommended || "—"}
            </p>
            ${notes ? `<p><strong>Notes:</strong><br/>${notes.replaceAll("\n", "<br/>")}</p>` : ""}
            <p style="margin-top:14px">
              <a href="${internalLink}">Open internal preview</a>
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true, quoteId: data.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}