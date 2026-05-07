import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerEvent } from "@/lib/analytics/server";
import { pickPreferredLocale } from "@/lib/preferredLocale";
import { sendResendEmail } from "@/lib/resend";
import { emailWrap, callout, adminTable, adminBadge, ctaButton, escHtml, sig, SITE_URL } from "@/lib/emailHelpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = process.env.NOTIFICATION_FROM_EMAIL || "studio@crecystudio.com";
const ADMIN = process.env.ADMIN_NOTIFICATION_EMAIL;

function buildClientEmail(name: string): string {
  const safe = escHtml(name || "there");
  return emailWrap(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em;line-height:1.2">Request received, ${safe}.</h1>
    <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">Free 20-min discovery call</p>
    <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">I'll be in touch within 24 hours to confirm a time. No automation — you'll hear from Komlan directly.</p>
    <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">If your schedule changes or you have questions in the meantime, just reply to this email.</p>
    ${callout("What happens next", [
      "1&ensp;Komlan reviews your request personally",
      "2&ensp;You receive a confirmed time within 24 hours",
      "3&ensp;20 minutes — scope, honest feedback, no pitch",
    ])}
    ${sig()}
  `, "Reply to this email to reach Komlan directly.", "I'll confirm a time for your free discovery call within 24 hours.");
}

function buildClientEmailScheduled(name: string, slotLabel: string): string {
  const safe = escHtml(name || "there");
  const slot = escHtml(slotLabel);
  return emailWrap(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em;line-height:1.2">You're on the calendar, ${safe}.</h1>
    <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">Free 20-min discovery call</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px">
      <tr>
        <td style="background:#f7f7f7;border-radius:6px;padding:22px 24px;text-align:center">
          <p style="margin:0 0 6px;font-size:11px;color:#888888;letter-spacing:0.08em;text-transform:uppercase;font-weight:600">Your call is booked for</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${slot}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">A Google Calendar invite is on its way to your inbox. Add it to your calendar and you're all set.</p>
    <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">Need to reschedule or have questions beforehand? Just reply to this email.</p>
    ${callout("What to expect on the call", [
      "→&ensp;Komlan asks sharp questions about your project",
      "→&ensp;You get honest feedback on scope, timeline, and price",
      "→&ensp;No sales pitch — just a real conversation",
    ])}
    ${sig()}
  `, "Reply to this email to reach Komlan directly.", `Your call is booked for ${slotLabel}.`);
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
  const s = (v: string | null) => escHtml(v || "—");
  const adminUrl = `${SITE_URL}/internal/admin`;
  const rows: [string, string][] = [
    ["Name", s(name)],
    ["Email", `<a href="mailto:${escHtml(email)}" style="color:#111111">${escHtml(email)}</a>`],
    ["Company", s(company)],
    ["Building", s(projectType)],
    [slotLabel ? "Scheduled" : "Availability", slotLabel ? `<strong>${s(slotLabel)}</strong>` : s(availabilityNote)],
    ["Call ID", `<span style="font-family:monospace;font-size:12px;color:#888888">${escHtml(callId)}</span>`],
  ];
  return emailWrap(`
    ${adminBadge("Admin alert")}
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111111;letter-spacing:-0.02em">${slotLabel ? "&#x1F4C5; Call scheduled" : "&#x1F4E9; New discovery call request"}</h1>
    ${adminTable(rows)}
    ${ctaButton(adminUrl, "Open admin panel")}
  `, `Reply to ${escHtml(email)} to respond directly.`);
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

    console.log(`[book-discovery-call] sending client email to=${email} from=${FROM} scheduled=${!!scheduledAt}`);
    try {
      const clientRes = await sendResendEmail({
        to: email,
        from: FROM,
        subject: scheduledAt
          ? "Your discovery call is booked — CrecyStudio"
          : "Discovery call request received — CrecyStudio",
        html: scheduledAt && slotLabel
          ? buildClientEmailScheduled(name, slotLabel)
          : buildClientEmail(name),
      });
      console.log("[book-discovery-call] client email sent id=", (clientRes as any)?.id);
    } catch (emailErr) {
      console.error("[book-discovery-call] client confirmation email failed:", emailErr);
    }

    if (ADMIN) {
      try {
        const adminRes = await sendResendEmail({
          to: ADMIN,
          from: FROM,
          subject: `Discovery call — ${name} (${email})`,
          html: buildAdminEmail(callId, name, email, company, projectType, availabilityNote, slotLabel),
        });
        console.log("[book-discovery-call] admin email sent id=", (adminRes as any)?.id);
      } catch (emailErr) {
        console.error("[book-discovery-call] admin notification email failed:", emailErr);
      }
    } else {
      console.warn("[book-discovery-call] ADMIN_NOTIFICATION_EMAIL not set — admin alert skipped");
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
