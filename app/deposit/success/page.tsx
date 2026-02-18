// app/deposit/success/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { stripeGetCheckoutSession } from "@/lib/stripeServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function safeObj(v: any) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

export default async function DepositSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const sessionId = pick(searchParams, "session_id").trim();

  if (!sessionId) {
    return (
      <main className="container" style={{ padding: "48px 0 80px" }}>
        <h1 className="h1">Payment status</h1>
        <p className="p">Missing session id.</p>
      </main>
    );
  }

  let message = "Processing…";
  let quoteId = "";
  let paid = false;

  try {
    const session = await stripeGetCheckoutSession(sessionId);
    quoteId = String(session?.metadata?.quoteId ?? "").trim();

    if (session.payment_status === "paid" && quoteId) {
      paid = true;

      // merge debug.internal.payment
      const existing = await supabaseAdmin
        .from("quotes")
        .select("id,debug,status")
        .eq("id", quoteId)
        .single();

      const prevDebug = safeObj(existing.data?.debug);
      const prevInternal = safeObj((prevDebug as any).internal);

      const now = new Date().toISOString();
      const history = Array.isArray(prevInternal.history) ? prevInternal.history : [];
      history.push({ at: now, action: "deposit_paid", status: "paid", sessionId });

      const nextInternal = {
        ...prevInternal,
        payment: {
          session_id: session.id,
          amount_total: session.amount_total ?? null,
          currency: session.currency ?? null,
          customer_email: session.customer_email ?? null,
          paid_at: now,
        },
        history,
      };

      const nextDebug = { ...prevDebug, internal: nextInternal };

      await supabaseAdmin
        .from("quotes")
        .update({ status: "paid", debug: nextDebug })
        .eq("id", quoteId);

      message = "Deposit received ✅";
    } else {
      message = "Payment not completed yet.";
    }
  } catch (e: any) {
    message = e?.message || "Could not confirm payment.";
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Deposit
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">{paid ? "Thank you!" : "Payment status"}</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        {message}
      </p>

      <div style={{ height: 14 }} />

      {quoteId ? (
        <p className="smallNote">
          Quote ID: <code>{quoteId}</code>
        </p>
      ) : null}

      <div style={{ height: 18 }} />

      <a className="btn btnPrimary" href="/">
        Back to site <span className="btnArrow">→</span>
      </a>
    </main>
  );
}