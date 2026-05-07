import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerEvent } from "@/lib/analytics/server";
import { maybeAttachQuoteToUser, resolveQuoteAccess, sameNormalizedEmail } from "@/lib/accessControl";
import { pickPreferredLocale } from "@/lib/preferredLocale";
import { emailWrap, adminTable, ctaButton, adminBadge, escHtml, appBaseUrl } from "@/lib/emailHelpers";
import { sendResendEmail } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({ key: `request-call:${ip}`, limit: 10, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const url = new URL(req.url);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const quoteId = String(body?.quoteId ?? url.searchParams.get("quoteId") ?? "").trim();
    const quoteToken = String(body?.quoteToken ?? body?.token ?? url.searchParams.get("token") ?? "").trim();
    const notes = String(body?.notes ?? "").trim();
    const bestTimeToCall = String(body?.bestTimeToCall ?? "").trim();
    const preferredTimes = String(body?.preferredTimes ?? "").trim();
    const timezone = String(body?.timezone ?? "").trim();

    if (!quoteId) {
      return NextResponse.json({ error: "Missing quote reference." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const access = await resolveQuoteAccess({
      quoteId,
      quoteToken: quoteToken || null,
      userId: user?.id ?? null,
      userEmail: normalizeEmail(user?.email),
    });

    if (!access.ok || !access.quote) {
      return NextResponse.json({ error: "Quote not found or access denied." }, { status: 404 });
    }

    const { data: quote, error: qErr } = await supabaseAdmin
      .from("quotes")
      .select("id, lead_id, lead_email, estimate_total, tier_recommended, status, public_token, auth_user_id, owner_email_norm")
      .eq("id", quoteId)
      .single();

    if (qErr || !quote) {
      return NextResponse.json({ error: qErr?.message || "Quote not found." }, { status: 404 });
    }

    let leadEmail = quote.lead_email ?? "(missing)";
    let leadPhone = "";
    let leadName = "";

    if (quote.lead_id) {
      const { data: lead } = await supabaseAdmin
        .from("leads")
        .select("email, phone, name")
        .eq("id", quote.lead_id)
        .maybeSingle();

      leadEmail = (lead?.email || leadEmail) ?? leadEmail;
      leadPhone = lead?.phone ?? "";
      leadName = lead?.name ?? "";
    }

    if (user?.id && sameNormalizedEmail(user.email, leadEmail)) {
      await maybeAttachQuoteToUser({
        quoteId,
        userId: user.id,
        userEmail: user.email,
      });
    }

    const preferredLocale = pickPreferredLocale(body?.preferredLocale ?? body?.locale);

    const { data: callRow, error: crErr } = await supabaseAdmin
      .from("call_requests")
      .insert({
        quote_id: quoteId,
        notes: notes || null,
        best_time_to_call: bestTimeToCall || null,
        preferred_times: preferredTimes || null,
        timezone: timezone || null,
        status: "requested",
        preferred_locale: preferredLocale,
      })
      .select("id")
      .single();

    if (crErr) {
      return NextResponse.json({ error: crErr.message }, { status: 400 });
    }

    await supabaseAdmin.from("quotes").update({ status: "call_requested" }).eq("id", quoteId);

    const FROM = process.env.RESEND_FROM_EMAIL;
    const TO = process.env.ALERT_TO_EMAIL;

    if (FROM && TO) {
      const internalLink = `${appBaseUrl()}/internal/preview?quoteId=${quoteId}`;
      const subject = `Scope call requested — ${leadEmail} — ${quoteId.slice(0, 8)}`;

      const rows: [string, string][] = [
        ["Name", escHtml(leadName || "—")],
        ["Email", `<a href="mailto:${escHtml(leadEmail)}" style="color:#111">${escHtml(leadEmail)}</a>${leadPhone ? ` &middot; ${escHtml(leadPhone)}` : ""}`],
        ["Estimate", `$${Number(quote.estimate_total || 0)} &middot; ${escHtml(String(quote.tier_recommended ?? "—"))}`],
        ...(bestTimeToCall ? [["Best time", escHtml(bestTimeToCall)] as [string, string]] : []),
        ...(preferredTimes ? [["Preferred times", escHtml(preferredTimes)] as [string, string]] : []),
        ...(timezone ? [["Timezone", escHtml(timezone)] as [string, string]] : []),
        ...(notes ? [["Notes", escHtml(notes).replace(/\n/g, "<br/>")] as [string, string]] : []),
        ["Quote ID", `<span style="font-family:monospace;font-size:12px;color:#888">${escHtml(quoteId)}</span>`],
      ];

      const html = emailWrap(`
        ${adminBadge("Scope call request")}
        <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">&#x1F4DE; New scope call request</h1>
        ${adminTable(rows)}
        ${internalLink ? ctaButton(internalLink, "Open internal preview") : ""}
      `);

      // Use the shared sendResendEmail helper for retry logic + base64
      // attachment encoding consistency. The previous raw fetch lost
      // those benefits and would silently drop the alert if Resend was
      // momentarily unhealthy.
      await sendResendEmail({ to: TO, from: FROM, subject, html }).catch((err) => {
        console.error("[request-call] admin alert failed:", err);
      });
    }

    await recordServerEvent({
      event: "website_call_requested",
      page: "/book",
      ip,
      metadata: {
        quoteId,
        callRequestId: callRow?.id ?? null,
      },
    });

    const nextUrl = quote.public_token
      ? `/portal/${encodeURIComponent(String(quote.public_token))}`
      : `/portal`;

    return NextResponse.json({
      ok: true,
      callRequestId: callRow?.id,
      nextUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
