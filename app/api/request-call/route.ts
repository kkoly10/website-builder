import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerEvent } from "@/lib/analytics/server";
import { maybeAttachQuoteToUser, resolveQuoteAccess, sameNormalizedEmail } from "@/lib/accessControl";
import { pickPreferredLocale } from "@/lib/preferredLocale";
import { appBaseUrl, FROM_EMAIL, ADMIN_EMAIL } from "@/lib/emailHelpers";
import { sendResendEmail } from "@/lib/resend";
import { renderScopeCallAdminEmail } from "@/lib/scopeCallEmails";
import { captureBackgroundError } from "@/lib/sentry";

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
      .maybeSingle();

    if (qErr) {
      return NextResponse.json({ error: qErr.message }, { status: 500 });
    }
    if (!quote) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
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

    if (FROM_EMAIL && ADMIN_EMAIL) {
      // Render via shared helper so the preview generator + Playwright
      // spec exercise the same code path. Subject drops the customer
      // email to keep PII out of lock-screen notifications; the full
      // address is in the body row + Reply-To is one click away.
      const { subject, html } = renderScopeCallAdminEmail({
        leadName,
        leadEmail,
        leadPhone,
        quoteId,
        estimateTotal: Number(quote.estimate_total || 0),
        tierRecommended: String(quote.tier_recommended ?? "—"),
        bestTimeToCall: bestTimeToCall || null,
        preferredTimes: preferredTimes || null,
        timezone: timezone || null,
        notes: notes || null,
        internalLink: `${appBaseUrl()}/internal/preview?quoteId=${quoteId}`,
      });

      // Use the shared sendResendEmail helper for retry logic + base64
      // attachment encoding consistency. The previous raw fetch lost
      // those benefits and would silently drop the alert if Resend was
      // momentarily unhealthy.
      await sendResendEmail({ to: ADMIN_EMAIL, from: FROM_EMAIL, subject, html }).catch((err) => {
        captureBackgroundError(err, {
          where: "request-call.admin_alert",
          extra: { quoteId },
        });
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
