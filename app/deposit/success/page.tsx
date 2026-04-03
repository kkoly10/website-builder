// app/deposit/success/page.tsx
import { confirmEcommerceDepositPayment, confirmOpsDepositPayment } from "@/lib/depositPayments";
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

async function confirmWebsiteQuotePayment(session: any, quoteId: string) {
  const existing = await supabaseAdmin.from("quotes").select("id,debug,status").eq("id", quoteId).single();
  const prevDebug = safeObj(existing.data?.debug);
  const prevInternal = safeObj((prevDebug as any).internal);

  const now = new Date().toISOString();
  const history = Array.isArray(prevInternal.history) ? prevInternal.history : [];
  history.push({ at: now, action: "deposit_paid", status: "paid", sessionId: session.id });

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
  await supabaseAdmin.from("quotes").update({ status: "paid", debug: nextDebug }).eq("id", quoteId);
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
  let paid = false;
  let label = "Project";
  let backHref = "/portal";

  try {
    const session = await stripeGetCheckoutSession(sessionId);
    const metadata = safeObj(session?.metadata);
    const lane = String(metadata.lane || "").trim().toLowerCase();
    const quoteId = String(metadata.quoteId || "").trim();
    const opsIntakeId = String(metadata.opsIntakeId || "").trim();
    const ecomIntakeId = String(metadata.ecomIntakeId || "").trim();
    const ecomQuoteId = String(metadata.ecomQuoteId || "").trim();

    if (session.payment_status === "paid") {
      paid = true;

      if (lane === "ops" && opsIntakeId) {
        await confirmOpsDepositPayment({
          opsIntakeId,
          session: {
            id: session.id,
            amount_total: session.amount_total ?? null,
            currency: session.currency ?? null,
            customer_email: session.customer_email ?? null,
          },
        });
        label = "Ops";
        backHref = `/portal/ops/${encodeURIComponent(opsIntakeId)}`;
      } else if (lane === "ecommerce" && ecomIntakeId) {
        await confirmEcommerceDepositPayment({
          ecomIntakeId,
          ecomQuoteId: ecomQuoteId || null,
          session: {
            id: session.id,
            amount_total: session.amount_total ?? null,
            currency: session.currency ?? null,
            customer_email: session.customer_email ?? null,
          },
        });
        label = "E-commerce";
        backHref = `/portal/ecommerce/${encodeURIComponent(ecomIntakeId)}`;
      } else if (quoteId) {
        await confirmWebsiteQuotePayment(session, quoteId);
        label = "Website";
      }

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
      <p className="smallNote" style={{ marginTop: 10 }}>{label} workspace</p>

      <div style={{ height: 18 }} />

      <a className="btn btnPrimary" href={backHref}>
        Return to workspace <span className="btnArrow">→</span>
      </a>
    </main>
  );
}
