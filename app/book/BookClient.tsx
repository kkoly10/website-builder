// app/book/BookClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const LAST_QUOTE_KEY = "crecystudio:lastQuoteId";

export default function BookClient({ quoteId }: { quoteId: string }) {
  const [effectiveQuoteId, setEffectiveQuoteId] = useState<string>(quoteId || "");
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Fallback: if someone lands on /book without query, try last saved ID
  useEffect(() => {
    if (quoteId) {
      setEffectiveQuoteId(quoteId);
      try {
        window.localStorage.setItem(LAST_QUOTE_KEY, quoteId);
      } catch {}
      return;
    }

    try {
      const last = window.localStorage.getItem(LAST_QUOTE_KEY);
      if (last) setEffectiveQuoteId(last);
    } catch {}
  }, [quoteId]);

  const missing = useMemo(() => !effectiveQuoteId, [effectiveQuoteId]);

  async function requestCall() {
    setErrorMsg("");
    if (!effectiveQuoteId) {
      setStatus("error");
      setErrorMsg('Missing quoteId. Please go back and click “Send estimate” first.');
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/request-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: effectiveQuoteId, notes }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to request call.");

      setStatus("sent");
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message || "Failed to request call.");
    }
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Book a Scope Call
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Confirm scope first</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        We’ll confirm scope on a quick call first. Payment happens after the call if you want to move forward.
      </p>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 950 }}>Your reference</div>
          <div className="smallNote">Save this ID for support.</div>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 12 }}>
          <div className="pDark">
            Quote ID:{" "}
            <strong>
              {effectiveQuoteId ? <code>{effectiveQuoteId}</code> : "(missing)"}
            </strong>
          </div>

          <div>
            <div className="fieldLabel">Anything we should know before the call? (optional)</div>
            <textarea
              className="textarea"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., examples you like, must-have pages, deadline, special features..."
            />
          </div>

          {status === "sent" && (
            <div
              style={{
                border: "1px solid rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.08)",
                borderRadius: 12,
                padding: 12,
                color: "rgba(255,255,255,0.92)",
                fontWeight: 800,
              }}
            >
              Request sent! We’ll reach out to schedule the scope call.
            </div>
          )}

          {status === "error" && (
            <div
              style={{
                border: "1px solid rgba(255,0,0,0.35)",
                background: "rgba(255,0,0,0.08)",
                borderRadius: 12,
                padding: 12,
                color: "rgba(255,255,255,0.92)",
                fontWeight: 700,
              }}
            >
              {errorMsg || "Something went wrong."}
            </div>
          )}

          <div className="row" style={{ justifyContent: "space-between" }}>
            <Link className="btn btnGhost" href="/estimate">
              Back to estimate
            </Link>

            <button
              type="button"
              className="btn btnPrimary"
              onClick={requestCall}
              disabled={status === "sending" || missing}
              title={missing ? 'Missing quoteId. Go back and click “Send estimate”.' : ""}
            >
              {status === "sending" ? "Requesting..." : "Request call"}{" "}
              <span className="btnArrow">→</span>
            </button>
          </div>

          {missing && (
            <div className="smallNote">
              Missing quoteId. Please go back and click “Send estimate” first.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}