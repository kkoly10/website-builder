import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerEvent } from "@/lib/analytics/server";
import { pickPreferredLocale } from "@/lib/preferredLocale";
import { sendResendEmail } from "@/lib/resend";

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

function buildClientEmail(name: string): string {
  const safe = escapeHtml(name || "there");
  return `<div style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;max-width:540px;margin:0 auto;color:#111;line-height:1.6">
  <p style="margin:0 0 8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#888">CrecyStudio</p>
  <h1 style="margin:0 0 20px;font-size:1.5rem;letter-spacing:-0.03em;line-height:1.15">Got your request, ${safe}.</h1>
  <p style="margin:0 0 16px;color:#444">I'll be in touch within 24 hours to confirm a time for your discovery call. No automation — you'll hear from Komlan directly.</p>
  <p style="margin:0 0 16px;color:#444">If your schedule changes or you have questions in the meantime, just reply to this email.</p>
  <p style="margin:0 0 32px;color:#444">— Komlan<br><span style="color:#888;font-size:.85rem">Founder, CrecyStudio</span></p>
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 16px">
  <p style="margin:0;font-size:.8rem;color:#999">CrecyStudio · <a href="${SITE_URL}" style="color:#999">${SITE_URL.replace(/^https?:\/\//, "")}</a></p>
</div>`;
}

function buildAdminEmail(
  callId: string,
  name: string,
  email: string,
  company: string | null,
  projectType: string | null,
  availabilityNote: string | null
): string {
  const s = (v: string | null) => escapeHtml(v || "—");
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:540px;margin:0 auto;color:#111;line-height:1.6">
  <h2 style="margin:0 0 16px;font-size:1.2rem">New discovery call request</h2>
  <p style="margin:0 0 6px"><strong>ID:</strong> ${escapeHtml(callId)}</p>
  <p style="margin:0 0 6px"><strong>Name:</strong> ${s(name)}</p>
  <p style="margin:0 0 6px"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
  <p style="margin:0 0 6px"><strong>Company:</strong> ${s(company)}</p>
  <p style="margin:0 0 6px"><strong>Building:</strong> ${s(projectType)}</p>
  <p style="margin:0 0 16px"><strong>Availability:</strong> ${s(availabilityNote)}</p>
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 16px">
  <p style="margin:0;font-size:.8rem;color:#999">Reply directly to <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a> to confirm a time.</p>
</div>`;
}

function maybeCreateCalendarEvent(
  name: string,
  email: string,
  availabilityNote: string | null
) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const serviceKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!calendarId || !serviceEmail || !serviceKey) return;

  void (async () => {
    try {
      // @ts-ignore — googleapis is an optional dep; install with `npm install googleapis` when env vars are configured
      const { google } = await import("googleapis");
      const auth = new google.auth.JWT({
        email: serviceEmail,
        key: serviceKey.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });
      const calendar = google.calendar({ version: "v3", auth });
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

    if (!name) {
      return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "A valid email address is required." }, { status: 400 });
    }

    const preferredLocale = pickPreferredLocale(body?.locale);
    const leadId = await ensureLeadId(email, name, preferredLocale);

    const { data, error } = await supabaseAdmin
      .from("discovery_calls")
      .insert({
        lead_id: leadId,
        lead_email: email,
        lead_name: name,
        company,
        project_type: projectType,
        availability_note: availabilityNote,
        preferred_locale: preferredLocale,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    const callId = String(data.id);

    maybeCreateCalendarEvent(name, email, availabilityNote);

    await sendResendEmail({
      to: email,
      from: FROM,
      subject: "Discovery call request received — CrecyStudio",
      html: buildClientEmail(name),
    });

    if (ADMIN) {
      await sendResendEmail({
        to: ADMIN,
        from: FROM,
        subject: `Discovery call — ${name} (${email})`,
        html: buildAdminEmail(callId, name, email, company, projectType, availabilityNote),
      });
    }

    await recordServerEvent({
      event: "discovery_call_requested",
      page: "/start",
      ip,
      metadata: { callId, preferredLocale, projectType },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unknown error" }, { status: 500 });
  }
}
