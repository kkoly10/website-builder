// lib/stripeServer.ts
export function getBaseUrl(req: Request) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (!host) return "https://crecystudio.com";
  return `${proto}://${host}`;
}

export async function stripeCreateCheckoutSession(opts: {
  // Naming kept for backward-compat (all current callers pass USD).
  // Pass `currency: "eur"` etc. when serving non-USD clients; defaults
  // to "usd" so existing callers don't need to change.
  amountUsdCents: number;
  customerEmail: string;
  quoteId?: string;
  successUrl: string;
  cancelUrl: string;
  productName?: string;
  productDescription?: string;
  currency?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");

  const params = new URLSearchParams();

  params.append("mode", "payment");
  params.append("success_url", opts.successUrl);
  params.append("cancel_url", opts.cancelUrl);
  params.append("customer_email", opts.customerEmail);

  // Validate currency is a 3-letter ISO code so a typo doesn't reach
  // Stripe and 400 with a confusing error. Defaults to USD when omitted
  // or invalid — the option is opt-in for non-USD lanes.
  const currency =
    typeof opts.currency === "string" && /^[a-z]{3}$/i.test(opts.currency.trim())
      ? opts.currency.trim().toLowerCase()
      : "usd";

  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", currency);
  params.append("line_items[0][price_data][unit_amount]", String(opts.amountUsdCents));
  params.append("line_items[0][price_data][product_data][name]", opts.productName || "CrecyStudio Deposit");
  params.append(
    "line_items[0][price_data][product_data][description]",
    opts.productDescription || `Deposit for quote ${opts.quoteId || "project"}`
  );

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com";
  params.append("consent_collection[terms_of_service]", "required");
  params.append(
    "custom_text[terms_of_service_acceptance][message]",
    `I agree to the CrecyStudio [Terms of Service](${SITE_URL}/terms) and [Refund Policy](${SITE_URL}/refunds).`
  );

  const metadata = {
    ...(opts.metadata || {}),
    ...(opts.quoteId ? { quoteId: opts.quoteId } : {}),
    termsUrl: `${SITE_URL}/terms`,
  };

  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined || value === "") continue;
    params.append(`metadata[${key}]`, String(value));
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const json = await res.json().catch(() => ({} as any));

  if (!res.ok) {
    throw new Error(json?.error?.message || "Stripe error creating checkout session");
  }

  return json as {
    id: string;
    url: string;
    payment_status?: string;
    metadata?: Record<string, string>;
    amount_total?: number;
    currency?: string;
    customer_email?: string;
  };
}

export async function stripeGetCheckoutSession(sessionId: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");

  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${key}` },
    }
  );

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    throw new Error(json?.error?.message || "Stripe error fetching checkout session");
  }
  return json as {
    id: string;
    url?: string;
    payment_status?: string;
    amount_total?: number;
    currency?: string;
    customer_email?: string;
    metadata?: Record<string, string>;
  };
}
