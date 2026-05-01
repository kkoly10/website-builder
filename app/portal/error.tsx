"use client";

import { useTranslations } from "next-intl";

export default function PortalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("portal.error");

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <section className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" /> {t("kicker")}
          </div>
          <h2 className="h2" style={{ marginTop: 10 }}>{t("title")}</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            {t("body")}
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={reset} className="btn btnPrimary">{t("retry")}</button>
            <a href="/portal" className="btn btnGhost">{t("back")}</a>
          </div>
        </div>
      </section>
    </main>
  );
}
