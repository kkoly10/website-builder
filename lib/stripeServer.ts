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
  amountUsdCents: number;
  customerEmail: string;
  quoteId?: string;
  successUrl: string;
  cancelUrl: string;
  productName?: string;
  productDescription?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");

  const params = new URLSearchParams();

  params.append("mode", "payment");
  params.append("success_url", opts.successUrl);
  params.append("cancel_url", opts.cancelUrl);
  params.append("customer_email", opts.customerEmail);

  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][unit_amount]", String(opts.amountUsdCents));
  params.append("line_items[0][price_data][product_data][name]", opts.productName || "CrecyStudio Deposit");
  params.append(
    "line_items[0][price_data][product_data][description]",
    opts.productDescription || `Deposit for quote ${opts.quoteId || "project"}`
  );

  const metadata = {
    ...(opts.metadata || {}),
    ...(opts.quoteId ? { quoteId: opts.quoteId } : {}),
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
