import { emailWrap, adminTable, adminBadge, ctaButton, escHtml } from "@/lib/emailHelpers";

// Pure renderer for the scope-call-requested admin alert. Extracted
// from app/api/request-call/route.ts so preview tooling + the
// Playwright structural spec can exercise it. English-only — admin is
// internal.

export type ScopeCallAdminEmailArgs = {
  leadName: string | null;
  leadEmail: string;
  leadPhone: string | null;
  quoteId: string;
  estimateTotal: number;
  tierRecommended: string;
  bestTimeToCall: string | null;
  preferredTimes: string | null;
  timezone: string | null;
  notes: string | null;
  internalLink: string;
};

export function renderScopeCallAdminEmail(args: ScopeCallAdminEmailArgs): { subject: string; html: string } {
  const subject = `Scope call requested — ${args.leadName || "(no name)"} — ${args.quoteId.slice(0, 8)}`;

  const rows: [string, string][] = [
    ["Name", escHtml(args.leadName || "—")],
    [
      "Email",
      `<a href="mailto:${escHtml(args.leadEmail)}" style="color:#111">${escHtml(args.leadEmail)}</a>${args.leadPhone ? ` &middot; ${escHtml(args.leadPhone)}` : ""}`,
    ],
    [
      "Estimate",
      `$${Number(args.estimateTotal || 0)} &middot; ${escHtml(args.tierRecommended || "—")}`,
    ],
    ...(args.bestTimeToCall ? [["Best time", escHtml(args.bestTimeToCall)] as [string, string]] : []),
    ...(args.preferredTimes ? [["Preferred times", escHtml(args.preferredTimes)] as [string, string]] : []),
    ...(args.timezone ? [["Timezone", escHtml(args.timezone)] as [string, string]] : []),
    ...(args.notes ? [["Notes", escHtml(args.notes).replace(/\n/g, "<br/>")] as [string, string]] : []),
    [
      "Quote ID",
      `<span style="font-family:monospace;font-size:12px;color:#888">${escHtml(args.quoteId)}</span>`,
    ],
  ];

  const html = emailWrap(`
    ${adminBadge("Scope call request")}
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">New scope call request</h1>
    ${adminTable(rows)}
    ${args.internalLink ? ctaButton(args.internalLink, "Open internal preview") : ""}
  `);

  return { subject, html };
}
