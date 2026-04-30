"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const LAST_QUOTE_KEY = "crecystudio:lastQuoteId";
const LAST_QUOTE_TOKEN_KEY = "crecystudio:lastQuoteToken";

export default function RecoverQuoteRedirect() {
  const router = useRouter();
  const t = useTranslations("book.recover");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const lastId = String(window.localStorage.getItem(LAST_QUOTE_KEY) || "").trim();
      const lastToken = String(window.localStorage.getItem(LAST_QUOTE_TOKEN_KEY) || "").trim();
      if (lastId) {
        const nextUrl = lastToken
          ? `/book?quoteId=${encodeURIComponent(lastId)}&token=${encodeURIComponent(lastToken)}`
          : `/book?quoteId=${encodeURIComponent(lastId)}`;
        router.replace(nextUrl);
        return;
      }
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  }, [router]);

  if (!checking) return null;

  return (
    <div className="hint">
      <div style={{ fontWeight: 900, color: "var(--ink)" }}>
        {t("title")}
      </div>
      <div className="pDark" style={{ marginTop: 6 }}>
        {t("body")}
      </div>
    </div>
  );
}
