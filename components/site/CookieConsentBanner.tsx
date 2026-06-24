"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { readConsentCookie, writeConsentCookie } from "@/lib/consent";

// GDPR-compliant cookie banner. Renders only when no choice has been
// stored. Defaults to "no tracking" until the user opts in — analytics
// fires nothing pre-consent (see lib/analytics/client.ts). Accept and
// Decline are equally weighted (no dark-pattern "Reject" hidden behind
// extra clicks) per the EDPB's 2020 cookie-banner guidance.
export default function CookieConsentBanner() {
  const t = useTranslations("consent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer the mount check until after hydration so SSR + initial paint
    // don't trigger a layout shift when the banner appears.
    if (readConsentCookie() === null) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const decide = (value: "accepted" | "declined") => {
    writeConsentCookie(value);
    setVisible(false);
    // Notify any analytics module that's listening so it can flush
    // queued events immediately rather than waiting for the next page.
    window.dispatchEvent(new CustomEvent("crecy:consent-changed", { detail: value }));
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cc-title"
      aria-describedby="cc-body"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 540,
        margin: "0 auto",
        background: "#0d0d0d",
        color: "#ffffff",
        padding: "20px 22px",
        borderRadius: 12,
        boxShadow: "0 12px 32px rgba(0,0,0,0.24)",
        zIndex: 9999,
        fontFamily: "var(--font-body, system-ui)",
      }}
    >
      <p id="cc-title" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
        {t("title")}
      </p>
      <p id="cc-body" style={{ margin: "8px 0 16px", fontSize: 13, lineHeight: 1.5, color: "#a1a1a6" }}>
        {t("body")}{" "}
        <a
          href="/privacy"
          style={{ color: "#ffffff", textDecoration: "underline" }}
        >
          {t("learnMore")}
        </a>
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => decide("accepted")}
          style={{
            background: "#a8362b",
            color: "#fff",
            border: 0,
            padding: "9px 16px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("accept")}
        </button>
        <button
          type="button"
          onClick={() => decide("declined")}
          style={{
            background: "transparent",
            color: "#ffffff",
            border: "1px solid #3a3a3c",
            padding: "9px 16px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("decline")}
        </button>
      </div>
    </div>
  );
}
