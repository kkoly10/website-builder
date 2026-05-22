"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { getEcomInterestEndpoint } from "@/lib/forms";

type SellerTypeKey = "amazon" | "shopify" | "ebay" | "planning" | "curious";
type InterestKey = "storage" | "fulfillment" | "marketplace" | "websiteSetup" | "notSure";
type VolumeKey = "notSelling" | "under100" | "between100_500" | "over500";

const SELLER_KEYS: SellerTypeKey[] = ["amazon", "shopify", "ebay", "planning", "curious"];
const INTEREST_KEYS: InterestKey[] = ["storage", "fulfillment", "marketplace", "websiteSetup", "notSure"];
const VOLUME_KEYS: VolumeKey[] = ["notSelling", "under100", "between100_500", "over500"];

// The form submits to a hardcoded external endpoint that expects
// English labels for these fields (Amazon seller, Order fulfillment,
// etc) — translating the values would break the upstream form
// integration. Map each i18n key back to its canonical English label
// before posting.
const SELLER_EN: Record<SellerTypeKey, string> = {
  amazon: "Amazon seller",
  shopify: "Shopify store owner",
  ebay: "eBay seller",
  planning: "Planning to sell online",
  curious: "Just curious",
};
const INTEREST_EN: Record<InterestKey, string> = {
  storage: "Inventory storage",
  fulfillment: "Order fulfillment",
  marketplace: "Marketplace management",
  websiteSetup: "Website + e-commerce setup",
  notSure: "Not sure yet",
};
const VOLUME_EN: Record<VolumeKey, string> = {
  notSelling: "Not selling yet",
  under100: "Under 100 orders / month",
  between100_500: "100-500 orders / month",
  over500: "500+ orders / month",
};

export default function ComingSoonPage() {
  const t = useTranslations("comingSoon");
  const endpoint = useMemo(() => getEcomInterestEndpoint(), []);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sellerType, setSellerType] = useState<SellerTypeKey>("planning");
  const [interests, setInterests] = useState<InterestKey[]>([]);
  const [volume, setVolume] = useState<VolumeKey>("notSelling");

  function toggleInterest(v: InterestKey) {
    setInterests((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!endpoint) { setError(t("missingEndpoint")); return; }
    if (!email.trim()) { setError(t("missingEmail")); return; }
    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          seller_type: SELLER_EN[sellerType],
          interests: interests.length ? interests.map((k) => INTEREST_EN[k]).join(", ") : "-",
          monthly_order_volume: VOLUME_EN[volume],
          source: "coming-soon-page",
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && (data.error || data.message)) || t("submissionFailed"));
      setSubmitted(true);
    } catch (err: any) { setError(err?.message || t("somethingWentWrong")); }
    finally { setSubmitting(false); }
  }

  return (
    <main className="container section" >
      <a href="/" className="pDark">{t("backHome")}</a>
      <h1 className="h1">{t("title")} <span className="pDark">{t("comingLaterTag")}</span></h1>
      <p className="p">{t("intro")}<br /><strong>{t("notLiveYet")}</strong> {t("currentFocus")}</p>
      <p className="p">{t("joinCallout")}</p>

      <section className="panel">
        {submitted ? (
          <div className="panelBody">
            <h2 className="h2">{t("onListHeading")}</h2>
            <p className="p">{t("onListBody")}</p>
            <a href="/" className="btn btnGhost">{t("backHome")}</a>
          </div>
        ) : (
          <>
            <div className="panelHeader">
              <h2 className="h2">{t("joinHeading")}</h2>
              <p className="pDark">{t("joinSubtitle")}</p>
            </div>
            <div className="panelBody">
              <form onSubmit={submit}>
                <div><div className="fieldLabel">{t("emailLabel")}</div><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={t("emailPlaceholder")} required /></div>
                <div><div className="fieldLabel">{t("describeLabel")}</div>
                  <div className="checkGrid">{SELLER_KEYS.map((opt) => (<button key={opt} type="button" onClick={() => setSellerType(opt)} className={`btn ${sellerType === opt ? "btnPrimary" : "btnGhost"}`}>{t(`sellerType.${opt}`)}</button>))}</div>
                </div>
                <div><div className="fieldLabel">{t("interestsLabel")}</div>
                  <div className="checkGrid">{INTEREST_KEYS.map((opt) => (<button key={opt} type="button" onClick={() => toggleInterest(opt)} className={`btn ${interests.includes(opt) ? "btnPrimary" : "btnGhost"}`}>{t(`interests.${opt}`)}</button>))}</div>
                  <p className="smallNote">{t("interestsHint")}</p>
                </div>
                <div><div className="fieldLabel">{t("volumeLabel")}</div>
                  <select className="select" value={volume} onChange={(e) => setVolume(e.target.value as VolumeKey)}>
                    {VOLUME_KEYS.map((k) => (<option key={k} value={k}>{t(`volume.${k}`)}</option>))}
                  </select>
                </div>
                {error && <div className="hint" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>{error}</div>}
                <button type="submit" disabled={submitting} className="btn btnPrimary wFull">{submitting ? t("submitting") : t("submit")}</button>
                <p className="smallNote">{t("consent")}</p>
              </form>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
