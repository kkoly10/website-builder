import { getTranslations } from "next-intl/server";
import { ensureCustomerPortalForQuoteId, markDepositPaidForQuoteId } from "@/lib/customerPortal";
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
  const existing = await supabaseAdmin
    .from("quotes")
    .select("id,debug,status")
    .eq("id", quoteId)
    .maybeSingle();
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
  // Explicit isFinite — `|| null` swallows legitimate $0 amounts.
  const rawAmount = Number(session.amount_total ?? NaN);
  await markDepositPaidForQuoteId(quoteId, {
    amountCents: Number.isFinite(rawAmount) ? rawAmount : null,
    paidAt: now,
    reference: String(session.id || ""),
  });
}

type LaneLabelKey = "ops" | "ecommerce" | "website" | "project";

export default async function DepositSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("depositSuccess");
  const sessionId = pick(searchParams, "session_id").trim();

  if (!sessionId) {
    return (
      <main className="container" style={{ padding: "48px 0 80px" }}>
        <h1 className="h1">{t("statusLabel")}</h1>
        <p className="p">{t("missingSession")}</p>
      </main>
    );
  }

  let message = "";
  let paid = false;
  let labelKey: LaneLabelKey = "project";
  let backHref = "/portal";

  try {
    const session = await stripeGetCheckoutSession(sessionId);
    const metadata = safeObj(session?.metadata);
    const rawLane = String(metadata.lane || "").trim().toLowerCase();
    const lane = rawLane === "ops" ? "automation" : rawLane;
    const quoteId = String(metadata.quoteId || "").trim();
    const opsIntakeId = String(metadata.opsIntakeId || "").trim();
    const ecomIntakeId = String(metadata.ecomIntakeId || "").trim();
    const ecomQuoteId = String(metadata.ecomQuoteId || "").trim();

    if (session.payment_status === "paid") {
      paid = true;

      // Single-confirmation guard shared with the Stripe webhook (see
      // stripe_processed_sessions migration for the protocol).
      const { error: claimError } = await supabaseAdmin
        .from("stripe_processed_sessions")
        .insert({ session_id: session.id, source: "success_page" });
      const claimedHere = !claimError;
      const collided =
        !!claimError && String((claimError as any)?.code || "") === "23505";

      try {
        if (lane === "automation" && opsIntakeId) {
          if (claimedHere) {
            await confirmOpsDepositPayment({
              opsIntakeId,
              session: {
                id: session.id,
                amount_total: session.amount_total ?? null,
                currency: session.currency ?? null,
                customer_email: session.customer_email ?? null,
              },
            });
          }
          labelKey = "ops";
          backHref = `/portal/ops/${encodeURIComponent(opsIntakeId)}`;
        } else if (lane === "ecommerce" && ecomIntakeId) {
          if (claimedHere) {
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
          }
          labelKey = "ecommerce";
          backHref = `/portal/ecommerce/${encodeURIComponent(ecomIntakeId)}`;
        } else if (quoteId) {
          if (claimedHere) {
            await confirmWebsiteQuotePayment(session, quoteId);
          }
          labelKey = "website";
          const portal = await ensureCustomerPortalForQuoteId(quoteId);
          if (portal?.access_token) {
            backHref = `/portal/${encodeURIComponent(String(portal.access_token))}`;
          }
        }
      } catch (sideEffectError) {
        if (claimedHere) {
          await supabaseAdmin
            .from("stripe_processed_sessions")
            .delete()
            .eq("session_id", session.id);
        }
        throw sideEffectError;
      }

      if (claimedHere) {
        await supabaseAdmin
          .from("stripe_processed_sessions")
          .update({ completed_at: new Date().toISOString() })
          .eq("session_id", session.id);
      }

      message = collided
        ? `${t("depositReceived")} ✅`
        : `${t("depositReceived")} ✅`;
    } else {
      message = t("notCompleted");
    }
  } catch (e: any) {
    // Translated fallback; the raw Stripe error message is intentionally
    // not surfaced to the user (it would leak Stripe internals and isn't
    // localized). Operators can find the underlying error in Sentry.
    message = t("couldNotConfirm");
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Deposit
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">{paid ? t("h1") : t("statusLabel")}</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        {message}
      </p>
      <p className="smallNote" style={{ marginTop: 10 }}>
        {t(`laneLabel.${labelKey}`)}
      </p>

      <div style={{ height: 18 }} />

      <a className="btn btnPrimary" href={backHref}>
        {t("returnToWorkspace")}
      </a>
    </main>
  );
}
