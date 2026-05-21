import { emailWrap, callout, adminTable, adminBadge, ctaButton, escHtml, sig, SITE_URL } from "@/lib/emailHelpers";
import { type EmailLocale, t } from "@/lib/i18n/emailStrings";

// Discovery-call email builders, extracted from the
// book-discovery-call route so they can be exercised by preview
// tooling + Playwright structural tests. The route still owns the
// scheduling logic (parsing slots, building ICS attachments,
// hitting Google Calendar); these helpers only render HTML.

export function buildDiscoveryClientEmail(name: string, lang: EmailLocale): string {
  const trimmedName = name.trim();
  // Drop the comma+name when no name is available. Premium copy reads
  // cleaner as "Request received." than "Request received, ."
  const headlineHtml = trimmedName
    ? escHtml(t("discovery.headline_pending", lang, { name: trimmedName }))
    : escHtml(t("discovery.headline_pending_anon", lang));
  return emailWrap(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em;line-height:1.2">${headlineHtml}</h1>
    <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("discovery.eyebrow", lang))}</p>
    <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("discovery.body_pending_1", lang))}</p>
    <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("discovery.body_pending_2", lang))}</p>
    ${callout(t("discovery.nextsteps_label", lang), [
      escHtml(t("discovery.nextsteps_1", lang)),
      escHtml(t("discovery.nextsteps_2", lang)),
      escHtml(t("discovery.nextsteps_3", lang)),
    ])}
    ${sig(lang)}
  `, {
    footerNote: t("common.footer.reply_note", lang),
    preheader: t("discovery.preheader_pending", lang),
    lang,
  });
}

function buildAddToCalendarLinks(start: Date, slotLabel: string): {
  google: string;
  outlook: string;
  yahoo: string;
} {
  const fmtCompact = (d: Date) => d.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const fmtIso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
  const end = new Date(start.getTime() + 20 * 60 * 1000);
  const title = "Discovery call — CrecyStudio";
  const details = `Your 20-min discovery call with Komlan Kouhiko.\n\n${slotLabel}`;

  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmtCompact(start)}/${fmtCompact(end)}&details=${encodeURIComponent(details)}`;
  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=${encodeURIComponent(title)}&body=${encodeURIComponent(details)}&startdt=${encodeURIComponent(fmtIso(start))}&enddt=${encodeURIComponent(fmtIso(end))}`;
  const yahoo = `https://calendar.yahoo.com/?v=60&title=${encodeURIComponent(title)}&st=${fmtCompact(start)}&et=${fmtCompact(end)}&desc=${encodeURIComponent(details)}`;

  return { google, outlook, yahoo };
}

function buildCalendarButtonsHtml(start: Date, slotLabel: string, lang: EmailLocale): string {
  const links = buildAddToCalendarLinks(start, slotLabel);
  // class="cal-btn" gives the dark-mode rule a hook so these stay
  // visually consistent with the inverted card instead of rendering
  // as bright white pills against #1a1a1a.
  const btn = (href: string, label: string) =>
    `<a href="${href}" class="cal-btn" style="display:inline-block;background:#ffffff;border:1px solid #d6d6d6;color:#111111;text-decoration:none;padding:10px 16px;font-size:13px;font-weight:600;font-family:Arial,Helvetica,sans-serif;border-radius:4px;margin:0 6px 8px 0">${label}</a>`;
  return `<div style="margin:0 0 24px">
    <p style="margin:0 0 10px;font-size:12px;color:#888888;letter-spacing:0.06em;text-transform:uppercase;font-weight:600">${escHtml(t("discovery.add_to_calendar", lang))}</p>
    ${btn(links.google, "Google Calendar")}
    ${btn(links.outlook, "Outlook")}
    ${btn(links.yahoo, "Yahoo")}
  </div>`;
}

export function buildDiscoveryClientEmailScheduled(name: string, slotLabel: string, start: Date | null, lang: EmailLocale): string {
  const trimmedName = name.trim();
  const headlineHtml = trimmedName
    ? escHtml(t("discovery.headline_scheduled", lang, { name: trimmedName }))
    : escHtml(t("discovery.headline_scheduled_anon", lang));
  const slot = escHtml(slotLabel);
  const buttons = start ? buildCalendarButtonsHtml(start, slotLabel, lang) : "";
  return emailWrap(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em;line-height:1.2">${headlineHtml}</h1>
    <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("discovery.eyebrow", lang))}</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" class="booked-box" style="margin:0 0 28px">
      <tr>
        <td style="background:#f7f7f7;border-radius:6px;padding:22px 24px;text-align:center">
          <p style="margin:0 0 6px;font-size:11px;color:#888888;letter-spacing:0.08em;text-transform:uppercase;font-weight:600">${escHtml(t("discovery.booked_for_label", lang))}</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${slot}</p>
        </td>
      </tr>
    </table>
    ${buttons}
    <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("discovery.scheduled_attachment_note", lang))}</p>
    <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("discovery.scheduled_reply_note", lang))}</p>
    ${callout(t("discovery.expect_label", lang), [
      escHtml(t("discovery.expect_1", lang)),
      escHtml(t("discovery.expect_2", lang)),
      escHtml(t("discovery.expect_3", lang)),
    ])}
    ${sig(lang)}
  `, {
    footerNote: t("common.footer.reply_note", lang),
    preheader: t("discovery.preheader_scheduled", lang, { slot: slotLabel }),
    lang,
  });
}

export function buildDiscoveryAdminEmail(
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
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111111;letter-spacing:-0.02em">${slotLabel ? "Call scheduled" : "New discovery call request"}</h1>
    ${adminTable(rows)}
    ${ctaButton(adminUrl, "Open admin panel")}
  `, `Reply to ${escHtml(email)} to respond directly.`);
}
