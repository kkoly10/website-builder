"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function BookClient({ quoteId }: { quoteId: string }) {
  const [notes, setNotes] = useState("");
  const [bestTime, setBestTime] = useState("");
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "sending" }
    | { status: "sent" }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const cleaned = useMemo(() => String(quoteId || "").trim(), [quoteId]);

  async function requestCall() {
    if (!cleaned) {
      setState({ status: "error", message: "Missing quoteId. Please go back and click “Send estimate” first." });
      return;
    }

    setState({ status: "sending" });

    try {
      const res = await fetch("/api/request-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: cleaned,
          notes,
          bestTimeToCall: bestTime,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Could not request call.");

      setState({ status: "sent" });
    } catch (e: any) {
      setState({ status: "error", message: e?.message || "Failed to request call." });
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
            Quote ID: <strong>{cleaned || "(missing)"}</strong>
          </div>

          <div>
            <div className="fieldLabel">Best time to call (optional)</div>
            <input
              className="input"
              value={bestTime}
              onChange={(e) => setBestTime(e.target.value)}
              placeholder='Example: "Mon–Wed after 6pm ET"'
            />
          </div>

          <div>
            <div className="fieldLabel">Anything we should know before the call? (optional)</div>
            <textarea
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Goals, examples you like, important details…"
              style={{ minHeight: 110 }}
            />
          </div>

          {state.status === "sent" && (
            <div style={{ padding: 12, borderRadius: 12, background: "rgba(0,255,170,0.10)" }}>
              <strong>Request sent!</strong> We’ll reach out to schedule the scope call.
            </div>
          )}

          {state.status === "error" && (
            <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,0,0,0.12)" }}>
              {state.message}
            </div>
          )}

          <div className="row" style={{ justifyContent: "space-between" }}>
            <Link className="btn btnGhost" href="/estimate">
              Back to estimate
            </Link>

            <button
              className="btn btnPrimary"
              onClick={requestCall}
              disabled={state.status === "sending" || state.status === "sent"}
              style={{ opacity: state.status === "sending" ? 0.8 : 1 }}
            >
              {state.status === "sending" ? "Requesting…" : "Request call"}{" "}
              <span className="btnArrow">→</span>
            </button>
          </div>
        </div>
      </section>

      <div className="footer">
        © {new Date().getFullYear()} CrecyStudio. Built to convert. Clear scope. Clean builds.
        <div className="footerLinks">
          <Link href="/">Home</Link>
          <Link href="/estimate">Estimate</Link>
          <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
        </div>
      </div>
    </main>
  );
}
