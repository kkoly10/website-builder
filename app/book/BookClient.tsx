// app/book/BookClient.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export default function BookClient({ quoteId }: { quoteId: string }) {
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function requestCall() {
    setErr(null);
    setOk(false);

    if (!quoteId) {
      setErr("Missing quoteId. Please go back and click “Send estimate” first.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/request-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, notes }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to request call.");

      setOk(true);
    } catch (e: any) {
      setErr(e?.message || "Failed to request call.");
    } finally {
      setSending(false);
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
        <div className="panelBody">
          <div className="pDark">
            Quote ID: <code>{quoteId || "(missing)"}</code>
          </div>

          <div style={{ height: 12 }} />

          <div className="fieldLabel">Anything we should know before the call? (optional)</div>
          <textarea
            className="textarea"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Example: I already have a logo, I want a pricing page, I need it in 10 days..."
          />

          {err && (
            <div className="smallNote" style={{ marginTop: 12, color: "#ffb4b4", fontWeight: 900 }}>
              {err}
            </div>
          )}

          {ok && (
            <div className="smallNote" style={{ marginTop: 12, fontWeight: 900 }}>
              Request sent ✅ We’ll reach out to schedule the call.
            </div>
          )}

          <div className="row" style={{ justifyContent: "space-between", marginTop: 14 }}>
            <Link className="btn btnGhost" href="/estimate">
              Back to estimate
            </Link>

            <button className="btn btnPrimary" onClick={requestCall} disabled={sending}>
              {sending ? "Sending..." : "Request call"} <span className="btnArrow">→</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}