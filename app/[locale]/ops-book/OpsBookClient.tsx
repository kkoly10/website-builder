"use client";

import { Link } from "@/i18n/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type Intake = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  recommendation_tier?: string | null;
  recommendation_price_range?: string | null;
};

const BEST_TIME_KEYS = [
  "Weekday morning (9am–12pm)",
  "Weekday afternoon (12pm–4pm)",
  "Weekday evening (4pm–7pm)",
  "Weekend",
  "Anytime",
] as const;

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

export default function OpsBookClient({ intake }: { intake: Intake }) {
  const t = useTranslations("opsBook.client");
  const tBestTimes = useTranslations("opsBook.client.bestTimes");
  const tBook = useTranslations("opsBook");

  const intakeId = useMemo(() => String(intake?.id ?? "").trim(), [intake]);

  // bestTimeToCall stays English literal (sent to /api/ops/request-call).
  // Display label rendered via tBestTimes() below.
  const [bestTimeToCall, setBestTimeToCall] = useState<string>(BEST_TIME_KEYS[0]);
  const [preferredTimes, setPreferredTimes] = useState("");
  const [timezone, setTimezone] = useState(detectTimezone());
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function requestCall() {
    setErrorMsg("");

    if (!intakeId) {
      setStatus("error");
      setErrorMsg(t("missingIdError"));
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/ops/request-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opsIntakeId: intakeId, bestTimeToCall, preferredTimes, timezone, notes }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || t("callError"));

      try {
        localStorage.setItem("crecystudio:lastOpsIntakeId", intakeId);
      } catch {}

      setStatus("sent");

      if (json?.nextUrl) {
        window.location.assign(json.nextUrl);
        return;
      }
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message || t("submitError"));
    }
  }

  const nextUrl = "/portal";
  const loginHref = `/login?next=${encodeURIComponent(nextUrl)}`;
  const signupHref = `/signup?next=${encodeURIComponent(nextUrl)}`;

  return (
    <main className="container" style={{ padding: "32px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        {tBook("callBookingKicker")}
      </div>

      <div style={{ height: 12 }} />
      <h1 className="h1">{t("title")}</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        {t("subtitle")}
      </p>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div>{t("summaryHeading")}</div>
          <div className="smallNote">{t("summaryNote")}</div>
        </div>

        <div className="panelBody" >
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div >{intake.company_name}</div>
              <div className="pDark">
                {intake.contact_name} • {intake.email}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              {intake.recommendation_tier ? (
                <div className="badge badgeHot">{intake.recommendation_tier}</div>
              ) : (
                <div className="badge">{t("fallbackBadge")}</div>
              )}
              {intake.recommendation_price_range ? (
                <div className="pDark" style={{ marginTop: 6 }}>
                  {intake.recommendation_price_range}
                </div>
              ) : null}
            </div>
          </div>

          <div className="smallNote">
            {t("intakeIdInline")} <code>{intakeId}</code>
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div>{t("callDetailsHeading")}</div>
          <div className="smallNote">{t("callDetailsNote")}</div>
        </div>

        <div className="panelBody" >
          <label >
            <span className="fieldLabel">{t("bestTimeLabel")}</span>
            <select className="select" value={bestTimeToCall} onChange={(e) => setBestTimeToCall(e.target.value)}>
              {BEST_TIME_KEYS.map((opt) => (
                <option key={opt} value={opt}>
                  {tBestTimes(opt)}
                </option>
              ))}
            </select>
          </label>

          <label >
            <span className="fieldLabel">{t("preferredLabel")}</span>
            <input
              className="input"
              value={preferredTimes}
              onChange={(e) => setPreferredTimes(e.target.value)}
              placeholder={t("preferredPlaceholder")}
            />
          </label>

          <label >
            <span className="fieldLabel">{t("timezoneLabel")}</span>
            <input className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </label>

          <label >
            <span className="fieldLabel">{t("notesLabel")}</span>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={5}
            />
          </label>

          {status === "sent" ? (
            <div
              style={{
                border: "1px solid var(--success)",
                background: "var(--success-bg)",
                borderRadius: 10,
                padding: 12,
                fontWeight: 700,
              }}
            >
              {t("successMessage")}
            </div>
          ) : null}

          {status === "error" ? (
            <div
              style={{
                border: "1px solid var(--accent)",
                background: "var(--accent-bg)",
                borderRadius: 10,
                padding: 12,
                fontWeight: 700,
              }}
            >
              {errorMsg || t("errorFallback")}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
            <Link className="btn btnGhost" href="/systems">
              {t("backToSystems")}
            </Link>

            <button className="btn btnPrimary" type="button" onClick={requestCall} disabled={status === "sending"}>
              {status === "sending" ? t("submitting") : t("submit")} <span className="btnArrow">→</span>
            </button>
          </div>

          <div className="smallNote">
            {t("portalLoginPromptStart")}{" "}
            {/* /signup and /login are under [locale], so i18n Link prefixes them correctly. */}
            <Link href={signupHref} style={{ color: "var(--accent-2)", fontWeight: 800 }}>
              {t("createAccount")}
            </Link>{" "}
            {t("or")}{" "}
            <Link href={loginHref} style={{ color: "var(--accent-2)", fontWeight: 800 }}>
              {t("signIn")}
            </Link>
            .
          </div>
        </div>
      </section>
    </main>
  );
}
