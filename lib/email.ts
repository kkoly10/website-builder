import { sendResendEmail } from "@/lib/resend";

/**
 * Notify admin when a new PIE report or estimate is ready for review.
 * Falls back to console.log if Resend env vars are not configured.
 */
export async function sendInternalEmail(link: string) {
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.ALERT_TO_EMAIL;

  if (!process.env.RESEND_API_KEY || !from || !to) {
    console.warn(
      "[email] RESEND_API_KEY, RESEND_FROM_EMAIL, or ALERT_TO_EMAIL not set — skipping email.",
    );
    console.log("Internal link:", link);
    return;
  }

  await sendResendEmail({
    from,
    to,
    subject: "New PIE report ready for review",
    html: `
      <div style="font-family:ui-sans-serif,system-ui;line-height:1.5">
        <h2 style="margin:0 0 10px">New estimate submitted</h2>
        <p>A new PIE report is ready for your review.</p>
        <p style="margin:12px 0"><a href="${link}">Open internal preview</a></p>
      </div>
    `,
  });
}
