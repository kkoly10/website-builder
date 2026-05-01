"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type Props = { quoteId: string; quoteToken?: string };
type SuccessState = { callRequestId?: string; nextUrl?: string } | null;

const LAST_QUOTE_KEY = "crecystudio:lastQuoteId";
const LAST_QUOTE_TOKEN_KEY = "crecystudio:lastQuoteToken";

const BEST_TIME_KEYS = ["Morning", "Midday", "Afternoon", "Evening", "Flexible"] as const;

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

function readQuoteIdFromUrl() {
  try {
    const sp = new URLSearchParams(window.location.search);
    return String(sp.get("quoteId") || sp.get("id") || "").trim();
  } catch {
    return "";
  }
}

function readQuoteTokenFromUrl() {
  try {
    const sp = new URLSearchParams(window.location.search);
    return String(sp.get("token") || sp.get("quoteToken") || "").trim();
  } catch {
    return "";
  }
}

export default function BookClient({ quoteId, quoteToken }: Props) {
  const t = useTranslations("book.form");
  const tSuccess = useTranslations("book.success");
  const tBestTimes = useTranslations("book.form.bestTimes");

  const [effectiveQuoteId, setEffectiveQuoteId] = useState<string>((quoteId || "").trim());
  const [effectiveQuoteToken, setEffectiveQuoteToken] = useState<string>((quoteToken || "").trim());
  const [bestTimeToCall, setBestTimeToCall] = useState("");
  const [preferredTimes, setPreferredTimes] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessState>(null);

  useEffect(() => {
    const fromProp = (quoteId || "").trim();
    const tokenFromProp = (quoteToken || "").trim();
    if (fromProp) {
      setEffectiveQuoteId(fromProp);
      try { window.localStorage.setItem(LAST_QUOTE_KEY, fromProp); } catch {}
    }
    if (tokenFromProp) {
      setEffectiveQuoteToken(tokenFromProp);
      try { window.localStorage.setItem(LAST_QUOTE_TOKEN_KEY, tokenFromProp); } catch {}
    }
    if (fromProp || tokenFromProp) return;

    const fromUrl = readQuoteIdFromUrl();
    const tokenFromUrl = readQuoteTokenFromUrl();
    if (fromUrl) {
      setEffectiveQuoteId(fromUrl);
      try { window.localStorage.setItem(LAST_QUOTE_KEY, fromUrl); } catch {}
    }
    if (tokenFromUrl) {
      setEffectiveQuoteToken(tokenFromUrl);
      try { window.localStorage.setItem(LAST_QUOTE_TOKEN_KEY, tokenFromUrl); } catch {}
    }
    if (fromUrl || tokenFromUrl) return;

    try {
      const fromStorage = String(window.localStorage.getItem(LAST_QUOTE_KEY) || "").trim();
      const tokenFromStorage = String(window.localStorage.getItem(LAST_QUOTE_TOKEN_KEY) || "").trim();
      if (fromStorage) setEffectiveQuoteId(fromStorage);
      if (tokenFromStorage) setEffectiveQuoteToken(tokenFromStorage);
    } catch {}
  }, [quoteId, quoteToken]);

  useEffect(() => {
    setTimezone(detectTimezone());
  }, []);

  const portalPath = useMemo(
    () => (effectiveQuoteToken ? `/portal/${encodeURIComponent(effectiveQuoteToken)}` : "/portal"),
    [effectiveQuoteToken]
  );
  const nextUrl = success?.nextUrl || portalPath;
  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(nextUrl)}`, [nextUrl]);
  const signupHref = useMemo(() => `/signup?next=${encodeURIComponent(nextUrl)}`, [nextUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!effectiveQuoteId) {
      setError(t("missingQuote"));
      return;
    }

    setLoading(true);

    try {
      // bestTimeToCall stays English literal — the API and admin pipeline
      // expect it that way. Display label is rendered via tBestTimes() below.
      const res = await fetch(`/api/request-call?quoteId=${encodeURIComponent(effectiveQuoteId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quoteId: effectiveQuoteId,
          quoteToken: effectiveQuoteToken || undefined,
          bestTimeToCall,
          preferredTimes,
          timezone,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || t("submitError"));
      setSuccess({ callRequestId: json?.callRequestId, nextUrl: json?.nextUrl });

      try {
        window.localStorage.setItem(LAST_QUOTE_KEY, effectiveQuoteId);
        if (effectiveQuoteToken) {
          window.localStorage.setItem(LAST_QUOTE_TOKEN_KEY, effectiveQuoteToken);
        }
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : t("submitError"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem", maxWidth: 760 }}>
        <section className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 24 }}>✓</div>
          <h2 className="h2" style={{ margin: 0, color: "var(--fg)" }}>{tSuccess("title")}</h2>
          <p className="p" style={{ marginTop: 16, color: "var(--muted)" }}>{tSuccess("body")}</p>

          <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a className="btn btnPrimary" href={nextUrl}>{tSuccess("openPortal")} <span className="btnArrow">→</span></a>
            <a className="btn btnGhost" href={signupHref}>{tSuccess("createAccount")}</a>
            <a className="btn btnGhost" href={loginHref}>{tSuccess("logIn")}</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem", maxWidth: 760 }}>
      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2">{t("title")}</h2>
          <p className="pDark">{t("subtitle")}</p>
        </div>

        <div className="panelBody">
          <form onSubmit={onSubmit}>
            <div>
              <div className="fieldLabel">{t("bestTimeLabel")}</div>
              <select className="select" value={bestTimeToCall} onChange={(e) => setBestTimeToCall(e.target.value)} required>
                <option value="">{t("bestTimePlaceholder")}</option>
                {BEST_TIME_KEYS.map((k) => (
                  <option key={k} value={k}>{tBestTimes(k)}</option>
                ))}
              </select>
            </div>
            <div className="grid2stretch">
              <div>
                <div className="fieldLabel">{t("preferredTimesLabel")}</div>
                <input className="input" value={preferredTimes} onChange={(e) => setPreferredTimes(e.target.value)} placeholder={t("preferredTimesPlaceholder")} />
              </div>
              <div>
                <div className="fieldLabel">{t("timezoneLabel")}</div>
                <input className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="fieldLabel">{t("notesLabel")}</div>
              <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t("notesPlaceholder")} />
            </div>

            {error && <div style={{ padding: 12, border: "1px solid var(--accent)", background: "var(--accent-bg)", color: "var(--accent-2)", fontWeight: 600 }}>{error}</div>}

            <div style={{ marginTop: 12, display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btnPrimary" type="submit" disabled={loading || !effectiveQuoteId}>
                {loading ? t("submitting") : t("submit")} <span className="btnArrow">→</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
