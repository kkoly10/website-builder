import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerEvent } from "@/lib/analytics/server";
import { pickPreferredLocale } from "@/lib/preferredLocale";
import { sendResendEmail } from "@/lib/resend";
import { SITE_URL, FROM_EMAIL, ADMIN_EMAIL } from "@/lib/emailHelpers";
import { captureBackgroundError } from "@/lib/sentry";
import { type EmailLocale, normalizeEmailLocale, t } from "@/lib/i18n/emailStrings";
import {
  buildDiscoveryClientEmail,
  buildDiscoveryClientEmailScheduled,
  buildDiscoveryAdminEmail,
} from "@/lib/discoveryCallEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Build an RFC 5545-compliant .ics calendar invite string
function buildCalendarInvite(
  uid: string,
  name: string,
  email: string,
  adminEmail: string | null,
  start: Date,
  slotLabel: string,
): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const end = new Date(start.getTime() + 20 * 60 * 1000);
  const now = new Date();
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CrecyStudio//Discovery Call//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `DTSTAMP:${fmt(now)}`,
    `UID:${uid}@crecystudio.com`,
    `ORGANIZER;CN=CrecyStudio:mailto:${FROM_EMAIL}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${esc(name)}:mailto:${email}`,
    ...(adminEmail
      ? [`ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=Komlan Kouhiko:mailto:${adminEmail}`]
      : []),
    `SUMMARY:Discovery call — CrecyStudio`,
    // Drop the duplicated "free" from the description — premium brands
    // don't emphasise "free" three times. The marketing page sets that
    // expectation; the calendar entry just states the meeting.
    `DESCRIPTION:Your 20-min discovery call with Komlan Kouhiko.\\n\\n${esc(slotLabel)}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
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

async function maybeCreateCalendarEvent(
  name: string,
  email: string,
  availabilityNote: string | null,
  selectedSlot: string | null,
  slotLabel: string | null,
): Promise<void> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const serviceKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!calendarId || !serviceEmail || !serviceKey) return;

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
        requestBody: {
          summary: `Discovery call — ${name}`,
          description: `${slotLabel || selectedSlot}\n\nReview at: ${SITE_URL}/internal/admin`,
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
          status: "confirmed",
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
  } catch (err: any) {
    console.warn("[book-discovery-call] calendar event creation failed");
    console.warn("[book-discovery-call] err.message:", err?.message);
    console.warn("[book-discovery-call] err.code:", err?.code);
    console.warn("[book-discovery-call] err.status:", err?.status ?? err?.response?.status);
    try {
      const body = err?.response?.data ?? err?.errors ?? null;
      if (body) console.warn("[book-discovery-call] err.body:", JSON.stringify(body));
    } catch {}
  }
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
    const emailLang: EmailLocale = normalizeEmailLocale(preferredLocale);
    const leadId = await ensureLeadId(email, name, preferredLocale);

    const scheduledAt = selectedSlot ? parseSelectedSlot(selectedSlot)?.toISOString() ?? null : null;

    const insert = await supabaseAdmin
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

    // 23505 = unique constraint violation. The partial unique index
    // discovery_calls_slot_unique (added in 20260519) makes the slot
    // race-safe: the second concurrent writer for the same scheduled_at
    // gets 23505 and we return a clean 409 so the client can pick a
    // different time. Only triggers for scheduled bookings; pending
    // (no slot) rows are excluded by the index's WHERE clause.
    if (insert.error?.code === "23505") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "That slot was just booked by someone else. Please refresh and choose another time.",
        },
        { status: 409 },
      );
    }
    if (insert.error) throw new Error(insert.error.message);
    const callId = String(insert.data.id);

    await maybeCreateCalendarEvent(name, email, availabilityNote, selectedSlot, slotLabel);

    // Build .ics invite when a specific slot was booked
    const slotStart = scheduledAt && selectedSlot ? parseSelectedSlot(selectedSlot) : null;
    const icsAttachment = slotStart && slotLabel
      ? {
          filename: "discovery-call.ics",
          content: buildCalendarInvite(callId, name, email, ADMIN_EMAIL || null, slotStart, slotLabel),
          content_type: "text/calendar; method=REQUEST; charset=UTF-8",
        }
      : null;

    try {
      await sendResendEmail({
        to: email,
        from: FROM_EMAIL,
        subject: scheduledAt
          ? t("discovery.subject_scheduled", emailLang)
          : t("discovery.subject_pending", emailLang),
        html: scheduledAt && slotLabel
          ? buildDiscoveryClientEmailScheduled(name, slotLabel, slotStart, emailLang)
          : buildDiscoveryClientEmail(name, emailLang),
        ...(icsAttachment ? { attachments: [icsAttachment] } : {}),
      });
    } catch (emailErr) {
      captureBackgroundError(emailErr, {
        where: "book-discovery-call.client_confirmation",
        extra: { callId, email, scheduled: !!scheduledAt },
      });
    }

    if (ADMIN_EMAIL) {
      try {
        // Admin subject leaves out the email address on purpose. Leaving
        // it in the subject leaked PII into lock-screen notifications and
        // any shared screen; the full email is one click away in the body.
        await sendResendEmail({
          to: ADMIN_EMAIL,
          from: FROM_EMAIL,
          subject: `Discovery call — ${name}${slotLabel ? " · scheduled" : " · request"}`,
          html: buildDiscoveryAdminEmail(callId, name, email, company, projectType, availabilityNote, slotLabel),
          ...(icsAttachment ? { attachments: [icsAttachment] } : {}),
        });
      } catch (emailErr) {
        captureBackgroundError(emailErr, {
          where: "book-discovery-call.admin_notification",
          extra: { callId, email, scheduled: !!scheduledAt },
        });
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
