import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerEvent } from "@/lib/analytics/server";
import { pickPreferredLocale } from "@/lib/preferredLocale";
import { sendResendEmail } from "@/lib/resend";
import { sig } from "@/lib/emailHelpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = process.env.NOTIFICATION_FROM_EMAIL || "studio@10xwebsites.com";
const ADMIN = process.env.ADMIN_NOTIFICATION_EMAIL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const EMAIL_WRAPPER_OPEN = `<div style="font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:6px;overflow:hidden;border:1px solid #e5e5e5">
  <div style="background:#111111;padding:20px 32px">
    <p style="margin:0;color:#ffffff;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600">CrecyStudio</p>
  </div>
  <div style="padding:36px 32px">`;

const EMAIL_WRAPPER_CLOSE = (siteUrl: string) => `  </div>
  <div style="background:#f9f9f9;border-top:1px solid #e5e5e5;padding:16px 32px">
    <p style="margin:0;font-size:12px;color:#999">CrecyStudio &middot; <a href="${siteUrl}" style="color:#999;text-decoration:none">${siteUrl.replace(/^https?:\/\//, "")}</a> &middot; Reply to this email to reach Komlan directly.</p>
  </div>
</div>`;

function row(label: string, value: string): string {
  return `<tr><td style="padding:6px 12px 6px 0;font-size:13px;color:#888;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;font-size:13px;color:#111">${value}</td></tr>`;
}

function buildClientEmail(name: string): string {
  const safe = escapeHtml(name || "there");
  return EMAIL_WRAPPER_OPEN + `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em;line-height:1.2">Request received, ${safe}.</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">Free 20-min discovery call</p>
    <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">I'll be in touch within 24 hours to confirm a time. No automation — you'll hear from Komlan directly.</p>
    <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">If your schedule changes or you have questions in the meantime, just reply to this email.</p>
    <div style="background:#f5f5f5;border-left:3px solid #111;padding:16px 20px;margin:0 0 28px;border-radius:0 4px 4px 0">
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#888;font-weight:600">What happens next</p>
      <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.6">1&ensp;Komlan reviews your request personally</p>
      <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.6">2&ensp;You receive a confirmed time within 24 hours</p>
      <p style="margin:0;font-size:14px;color:#444;line-height:1.6">3&ensp;20 minutes — scope, honest feedback, no pitch</p>
    </div>
    ${sig()}
  ` + EMAIL_WRAPPER_CLOSE(SITE_URL);
}

function buildClientEmailScheduled(name: string, slotLabel: string): string {
  const safe = escapeHtml(name || "there");
  const slot = escapeHtml(slotLabel);
  return EMAIL_WRAPPER_OPEN + `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em;line-height:1.2">You're on the calendar, ${safe}.</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">Free 20-min discovery call</p>
    <div style="background:#f5f5f5;border-radius:4px;padding:20px 24px;margin:0 0 24px;text-align:center">
      <p style="margin:0 0 4px;font-size:12px;color:#888;letter-spacing:0.06em;text-transform:uppercase">Your call is booked for</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.01em">${slot}</p>
    </div>
    <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">A Google Calendar invite is on its way to your inbox. Add it to your calendar and you're all set.</p>
    <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">Need to reschedule or have questions beforehand? Just reply to this email.</p>
    <div style="background:#f5f5f5;border-left:3px solid #111;padding:16px 20px;margin:0 0 28px;border-radius:0 4px 4px 0">
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#888;font-weight:600">What to expect on the call</p>
      <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.6">→&ensp;Komlan asks sharp questions about your project</p>
      <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.6">→&ensp;You get honest feedback on scope, timeline, and price</p>
      <p style="margin:0;font-size:14px;color:#444;line-height:1.6">→&ensp;No sales pitch — just a real conversation</p>
    </div>
    ${sig()}
  ` + EMAIL_WRAPPER_CLOSE(SITE_URL);
}

function buildAdminEmail(
  callId: string,
  name: string,
  email: string,
  company: string | null,
  projectType: string | null,
  availabilityNote: string | null,
  slotLabel: string | null,
): string {
  const s = (v: string | null) => escapeHtml(v || "—");
  const adminUrl = `${SITE_URL}/internal/admin`;
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:6px;overflow:hidden">
  <div style="background:#111;padding:16px 28px;display:flex;align-items:center;justify-content:space-between">
    <p style="margin:0;color:#fff;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600">CrecyStudio</p>
    <p style="margin:0;color:#888;font-size:11px">Admin alert</p>
  </div>
  <div style="padding:28px">
    <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#111">${slotLabel ? "&#x1F4C5; Call scheduled" : "&#x1F4E9; New discovery call request"}</p>
    <p style="margin:0 0 20px;font-size:13px;color:#888">${slotLabel ? `Booked for ${s(slotLabel)}` : "Availability submitted — follow up to confirm a time"}</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
      ${row("Name", s(name))}
      ${row("Email", `<a href="mailto:${escapeHtml(email)}" style="color:#111">${escapeHtml(email)}</a>`)}
      ${row("Company", s(company))}
      ${row("Building", s(projectType))}
      ${row(slotLabel ? "Scheduled" : "Availability", slotLabel ? `<strong>${s(slotLabel)}</strong>` : s(availabilityNote))}
      ${row("Call ID", `<span style="font-family:monospace;font-size:12px;color:#888">${escapeHtml(callId)}</span>`)}
    </table>
    <a href="${adminUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 20px;border-radius:4px;font-size:13px;font-weight:600">View in admin panel →</a>
  </div>
  <div style="background:#f9f9f9;border-top:1px solid #e5e5e5;padding:14px 28px">
    <p style="margin:0;font-size:12px;color:#999">Reply directly to <a href="mailto:${escapeHtml(email)}" style="color:#999">${escapeHtml(email)}</a> to respond to ${s(name)}.</p>
  </div>
</div>`;
}

// Returns UTC offset string like "-04:00" or "-05:00" for America/New_York at the given moment
function getEtOffsetString(referenceDate: Date): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
  });
  const parts = fmt.formatToParts(referenceDate);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-4";
  // tzPart is like "GMT-4" or "GMT-5"
  const match = tzPart.match(/GMT([+-]\d+)/);
  if (!match) return "-04:00";
  const hours = parseInt(match[1], 10);
  return `${hours < 0 ? "-" : "+"}${String(Math.abs(hours)).padStart(2, "0")}:00`;
}

function parseSelectedSlot(selectedSlot: string): Date | null {
  try {
    // selectedSlot is "2026-05-06T09:00:00" (local ET, no offset)
    // We compute the correct UTC offset for that moment
    const naive = new Date(selectedSlot + "Z"); // treat as UTC first to get a Date
    const offset = getEtOffsetString(naive);
    const withOffset = selectedSlot + offset;
    const result = new Date(withOffset);
    if (isNaN(result.getTime())) return null;
    return result;
  } catch {
    return null;
  }
}

function maybeCreateCalendarEvent(
  name: string,
  email: string,
  availabilityNote: string | null,
  selectedSlot: string | null,
  slotLabel: string | null,
) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const serviceKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!calendarId || !serviceEmail || !serviceKey) return;

  void (async () => {
    try {
      const { google } = await import("googleapis");
      const auth = new google.auth.JWT({
        email: serviceEmail,
        key: serviceKey.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });
      const calendar = google.calendar({ version: "v3", auth });

      if (selectedSlot) {
        const start = parseSelectedSlot(selectedSlot);
        if (!start) throw new Error("Could not parse selectedSlot: " + selectedSlot);
        const end = new Date(start.getTime() + 20 * 60 * 1000);
        await calendar.events.insert({
          calendarId,
          sendUpdates: "all",
          requestBody: {
            summary: `Discovery call — ${name}`,
            description: `${slotLabel || selectedSlot}\n\nReview at: ${SITE_URL}/internal/admin`,
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() },
            status: "confirmed",
            attendees: [{ email, responseStatus: "needsAction" }],
            guestsCanSeeOtherGuests: false,
          },
        });
      } else {
        // Fallback: tentative placeholder (no specific time)
        const now = new Date();
        const end = new Date(now.getTime() + 20 * 60 * 1000);
        await calendar.events.insert({
          calendarId,
          requestBody: {
            summary: `Discovery call — ${name} (${email})`,
            description: `Availability: ${availabilityNote || "not specified"}\n\nReview at: ${SITE_URL}/internal/admin`,
            start: { dateTime: now.toISOString() },
            end: { dateTime: end.toISOString() },
            status: "tentative",
          },
        });
      }
    } catch (err) {
      console.warn("[book-discovery-call] calendar event creation failed:", err);
    }
  })();
}

async function findLeadByEmail(email: string) {
  const res = await supabaseAdmin.from("leads").select("id").eq("email", email).maybeSingle();
  if (!res.error && res.data?.id) return { id: String(res.data.id) };
  return null;
}

async function createLead(email: string, name: string | null, preferredLocale: string) {
  const res = await supabaseAdmin
    .from("leads")
    .insert({ email, preferred_locale: preferredLocale })
    .select("id")
    .single();
  if (res.error) throw new Error(res.error.message);
  const id = String(res.data.id);
  if (name) await supabaseAdmin.from("leads").update({ name }).eq("id", id);
  return id;
}

async function ensureLeadId(email: string, name: string | null, preferredLocale: string) {
  const existing = await findLeadByEmail(email);
  if (existing?.id) {
    await supabaseAdmin.from("leads").update({ preferred_locale: preferredLocale }).eq("id", existing.id);
    return existing.id;
  }
  return await createLead(email, name, preferredLocale);
}

export async function POST(req: Request) {
  try {
    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({ key: `book-discovery-call:${ip}`, limit: 5, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const company = String(body.company ?? "").trim() || null;
    const projectType = String(body.projectType ?? "").trim() || null;
    const availabilityNote = String(body.availabilityNote ?? "").trim() || null;
    const selectedSlot = String(body.selectedSlot ?? "").trim() || null;
    const slotLabel = String(body.slotLabel ?? "").trim() || null;

    if (!name) {
      return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "A valid email address is required." }, { status: 400 });
    }

    const preferredLocale = pickPreferredLocale(body?.locale);
    const leadId = await ensureLeadId(email, name, preferredLocale);

    const scheduledAt = selectedSlot ? parseSelectedSlot(selectedSlot)?.toISOString() ?? null : null;

    const { data, error } = await supabaseAdmin
      .from("discovery_calls")
      .insert({
        lead_id: leadId,
        lead_email: email,
        lead_name: name,
        company,
        project_type: projectType,
        availability_note: slotLabel || availabilityNote,
        scheduled_at: scheduledAt,
        preferred_locale: preferredLocale,
        status: scheduledAt ? "confirmed" : "pending",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    const callId = String(data.id);

    maybeCreateCalendarEvent(name, email, availabilityNote, selectedSlot, slotLabel);

    try {
      await sendResendEmail({
        to: email,
        from: FROM,
        subject: scheduledAt
          ? "Your discovery call is booked — CrecyStudio"
          : "Discovery call request received — CrecyStudio",
        html: scheduledAt && slotLabel
          ? buildClientEmailScheduled(name, slotLabel)
          : buildClientEmail(name),
      });
    } catch (emailErr) {
      console.error("[book-discovery-call] client confirmation email failed:", emailErr);
    }

    if (ADMIN) {
      try {
        await sendResendEmail({
          to: ADMIN,
          from: FROM,
          subject: `Discovery call — ${name} (${email})`,
          html: buildAdminEmail(callId, name, email, company, projectType, availabilityNote, slotLabel),
        });
      } catch (emailErr) {
        console.error("[book-discovery-call] admin notification email failed:", emailErr);
      }
    }

    await recordServerEvent({
      event: "discovery_call_requested",
      page: "/start",
      ip,
      metadata: { callId, preferredLocale, projectType, scheduled: !!scheduledAt },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unknown error" }, { status: 500 });
  }
}
