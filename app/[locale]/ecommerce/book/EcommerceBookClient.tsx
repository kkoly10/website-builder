"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Props = {
  ecomIntakeId: string;
};

// Best-time options stay English literals (sent verbatim to
// /api/ecommerce/request-call). Display labels render via tBestTimes().
const BEST_TIME_KEYS = ["Morning", "Afternoon", "Evening", "Flexible"] as const;

export default function EcommerceBookClient({ ecomIntakeId }: Props) {
  const router = useRouter();
  const t = useTranslations("ecomBook.form");
  const tBestTimes = useTranslations("ecomBook.form.bestTimes");

  const [bestTime, setBestTime] = useState<string>(BEST_TIME_KEYS[0]);
  const [preferredTimes, setPreferredTimes] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const intakeShort = useMemo(() => ecomIntakeId.slice(0, 8), [ecomIntakeId]);

  const submit = async () => {
    if (!ecomIntakeId) {
      setError(t("missingId"));
      return;
    }

    if (!bestTime.trim()) {
      setError(t("missingTime"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/ecommerce/request-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ecomIntakeId, bestTime, preferredTimes, timezone, notes }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || t("requestFailed"));

      router.push(data.nextUrl || `/ecommerce/success?ecomIntakeId=${encodeURIComponent(ecomIntakeId)}`);
    } catch (err: any) {
      setError(err.message || t("fallbackError"));
      setSubmitting(false);
    }
  };

  return (
    <main className="container" style={{ paddingBottom: 80 }}>
      <section className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="card">
          <div className="cardInner" style={{ padding: 30 }}>
            <div className="kicker">{t("kicker")}</div>
            <h1 className="h1" style={{ marginTop: 10 }}>{t("title")}</h1>
            <p className="pDark">
              {intakeShort
                ? t("subtitleWithId", { shortId: intakeShort })
                : t("subtitlePending")}
            </p>

            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
              <div>
                <label className="fieldLabel">{t("bestTimeLabel")}</label>
                <select className="select" value={bestTime} onChange={(e) => setBestTime(e.target.value)}>
                  {BEST_TIME_KEYS.map((opt) => (
                    <option key={opt} value={opt}>{tBestTimes(opt)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="fieldLabel">{t("preferredLabel")}</label>
                <input className="input" value={preferredTimes} onChange={(e) => setPreferredTimes(e.target.value)} placeholder={t("preferredPlaceholder")} />
              </div>
              <div>
                <label className="fieldLabel">{t("timezoneLabel")}</label>
                <input className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder={t("timezonePlaceholder")} />
              </div>
              <div>
                <label className="fieldLabel">{t("notesLabel")}</label>
                <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ minHeight: 90 }} placeholder={t("notesPlaceholder")} />
              </div>
            </div>

            {error ? <p style={{ color: "var(--accent)", marginTop: 12 }}>{error}</p> : null}

            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btnPrimary" onClick={submit} disabled={submitting}>
                {submitting ? t("submitting") : t("submit")}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
