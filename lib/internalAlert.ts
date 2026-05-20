// Lightweight outbound alert helper. Posts a single-field text message
// to INTERNAL_ALERT_WEBHOOK (Slack incoming-webhook shape — works with
// Discord and most webhook receivers via the same {text:"..."} body).
// Calls are best-effort and never throw: critical paths (webhook
// handlers, proxy.ts) shouldn't fail because an alert sink is down.
//
// Pulled out of proxy.ts so webhook route handlers (Stripe, Resend) can
// fire alerts on 5xx without re-implementing the fetch + try/catch.
export async function sendInternalAlert(message: string): Promise<void> {
  const webhook = process.env.INTERNAL_ALERT_WEBHOOK?.trim();
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  } catch (err) {
    console.error("[internalAlert] webhook post failed:", err);
  }
}
