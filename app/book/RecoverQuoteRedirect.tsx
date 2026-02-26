// app/book/RecoverQuoteRedirect.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LAST_QUOTE_KEY = "crecystudio:lastQuoteId";

export default function RecoverQuoteRedirect() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const last = String(window.localStorage.getItem(LAST_QUOTE_KEY) || "").trim();
      if (last) {
        router.replace(`/book?quoteId=${encodeURIComponent(last)}`);
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
    <div className="hint" style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>
        Recovering your last quote…
      </div>
      <div className="pDark" style={{ marginTop: 6 }}>
        If you recently submitted an estimate, we’ll try to reopen the booking page automatically.
      </div>
    </div>
  );
}