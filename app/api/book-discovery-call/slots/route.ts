import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TZ = "America/New_York";
const SLOT_DURATION_MS = 30 * 60 * 1000;
const BUSINESS_START_HOUR = 9;  // 9:00 AM ET
const BUSINESS_END_HOUR = 17;   // 5:00 PM ET (last slot 4:30 PM)
const WORKING_DAYS = 7;

type SlotDay = { date: string; label: string; times: string[] };

function getETDateParts(d: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return {
    year: parseInt(parts.year, 10),
    month: parseInt(parts.month, 10),
    day: parseInt(parts.day, 10),
    hour: parseInt(parts.hour, 10),
    minute: parseInt(parts.minute, 10),
  };
}

function getDayLabel(dateStr: string): string {
  // dateStr: "2026-05-06"
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)); // noon UTC to avoid DST edge
  return date.toLocaleDateString("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" });
}

// Returns UTC timestamp for midnight ET on the given ET date parts
function etMidnightUtc(year: number, month: number, day: number): Date {
  // Build a string Intl can parse: we want the UTC time that corresponds to 00:00 ET
  // Use Date constructor with a time string — find the UTC offset at that moment
  // Trick: create date at noon, compute offset, then build midnight
  const noon = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00Z`);
  const noonParts = getETDateParts(noon);
  // offset in minutes = (noonParts.hour - 12) * 60 + noonParts.minute (negative for behind UTC)
  // Actually: UTC + offset = ET → offset = ET - UTC
  const utcHour = 12;
  const etHour = noonParts.hour === 24 ? 0 : noonParts.hour;
  const offsetHours = etHour - utcHour;
  const midnightUtcMs = noon.getTime() - (utcHour * 60 + 0) * 60_000 + (-offsetHours * 60) * 60_000;
  return new Date(midnightUtcMs - noonParts.minute * 60_000);
}

function nextWorkingDays(count: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  // Start from tomorrow in ET
  let cursor = new Date(now);
  cursor.setUTCHours(cursor.getUTCHours() + 24);

  while (dates.length < count) {
    const parts = getETDateParts(cursor);
    const dateStr = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
    const dayOfWeek = new Date(`${dateStr}T12:00:00Z`).getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Avoid duplicate if DST jump lands same date
      if (!dates.includes(dateStr)) dates.push(dateStr);
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60_000);
  }
  return dates;
}

function generateCandidateSlots(dateStr: string): Date[] {
  const [y, m, d] = dateStr.split("-").map(Number);
  const midnight = etMidnightUtc(y, m, d);
  const slots: Date[] = [];

  for (let h = BUSINESS_START_HOUR; h < BUSINESS_END_HOUR; h++) {
    for (const min of [0, 30]) {
      const slotUtc = new Date(midnight.getTime() + (h * 60 + min) * 60_000);
      const parts = getETDateParts(slotUtc);
      // Confirm the slot actually falls within business hours after DST adjustment
      if (parts.hour >= BUSINESS_START_HOUR && parts.hour < BUSINESS_END_HOUR) {
        slots.push(slotUtc);
      }
    }
  }
  return slots;
}

function formatTime(d: Date): string {
  const { hour, minute } = getETDateParts(d);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function overlaps(slotStart: Date, slotEnd: Date, busyStart: Date, busyEnd: Date): boolean {
  return slotStart < busyEnd && slotEnd > busyStart;
}

export async function GET() {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const serviceKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!calendarId || !serviceEmail || !serviceKey) {
    return NextResponse.json({ ok: false, noCalendar: true });
  }

  try {
    const workingDays = nextWorkingDays(WORKING_DAYS);
    const timeMin = workingDays[0] + "T00:00:00Z";
    const lastDay = workingDays[workingDays.length - 1];
    const [ly, lm, ld] = lastDay.split("-").map(Number);
    const timeMax = new Date(Date.UTC(ly, lm - 1, ld + 1)).toISOString();

    const { google } = await import("googleapis");
    const auth = new google.auth.JWT({
      email: serviceEmail,
      key: serviceKey.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });
    const calendar = google.calendar({ version: "v3", auth });

    const freebusyRes = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: calendarId }],
      },
    });

    const busyPeriods = (freebusyRes.data.calendars?.[calendarId]?.busy ?? []).map((b) => ({
      start: new Date(b.start!),
      end: new Date(b.end!),
    }));

    const now = new Date();
    const slots: SlotDay[] = [];

    for (const dateStr of workingDays) {
      const candidates = generateCandidateSlots(dateStr);
      const available: string[] = [];

      for (const slot of candidates) {
        if (slot <= now) continue; // skip past slots
        const slotEnd = new Date(slot.getTime() + SLOT_DURATION_MS);
        const busy = busyPeriods.some((b) => overlaps(slot, slotEnd, b.start, b.end));
        if (!busy) available.push(formatTime(slot));
      }

      if (available.length > 0) {
        slots.push({ date: dateStr, label: getDayLabel(dateStr), times: available });
      }
    }

    return NextResponse.json({ ok: true, slots });
  } catch (err: any) {
    console.error("[slots] error message:", err?.message);
    console.error("[slots] error code:", err?.code);
    console.error("[slots] error status:", err?.status ?? err?.response?.status);
    return NextResponse.json({ ok: false, noCalendar: true });
  }
}
