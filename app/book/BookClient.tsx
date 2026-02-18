// app/book/BookClient.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function clean(s: string | null) {
  return String(s ?? "").trim();
}

export default function BookClient() {
  const sp = useSearchParams();

  const quoteId = useMemo(() => clean(sp.get("quoteId")), [sp]);
  const email = useMemo(() => clean(sp.get("leadEmail")), [sp]);

  const [availability, setAvailability] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function requestCall() {
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/request-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          leadEmail: email,
          callRequest: {
            availability,
            notes,
            requestedFrom: "book_page",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");

      setStatus("saved");
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message || "Unknown error");
    }
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Book your call
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Free scope lock call</h1>
      <p className="p" style={{ maxWidth: 920, marginTop: 10 }}>
        You’re not paying yet. We’ll review your estimate, lock the scope together, then send a deposit
        link after the call.
      </p>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 950 }}>Your quote</div>
          <div className="smallNote">
            This helps us pull up the exact estimate you just generated.
          </div>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 12 }}>
          <div>
            <div className="fieldLabel">Quote ID</div>
            <input className="input" value={quoteId || "(missing)"} readOnly />
            {!quoteId && (
              <div className="smallNote" style={{ marginTop: 8 }}>
                Missing <code>quoteId</code> in the URL. Your estimate page should send you here like:
                <code> /book?quoteId=...</code>
              </div>
            )}
          </div>

          <div>
            <div className="fieldLabel">Email</div>
            <input className="input" value={email || "(not provided)"} readOnly />
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 950 }}>Request the call</div>
          <div className="smallNote">
            Calendly can come later — for now we’ll collect availability and follow up.
          </div>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 12 }}>
          <div>
            <div className="fieldLabel">Availability</div>
            <textarea
              className="textarea"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="Example: Tue–Thu after 6pm, Sat 10am–2pm (ET)"
            />
          </div>

          <div>
            <div className="fieldLabel">Notes (optional)</div>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything you want us to prioritize (pages, features, examples)…"
            />
          </div>

          {status === "error" && (
            <div className="smallNote" style={{ color: "rgba(255,120,120,0.95)" }}>
              Error: {errorMsg}
            </div>
          )}

          {status === "saved" ? (
            <div className="smallNote" style={{ fontWeight: 900 }}>
              ✅ Call request saved. We’ll reach out to schedule.
            </div>
          ) : (
            <button
              className="btn btnPrimary"
              onClick={requestCall}
              disabled={!quoteId || status === "saving"}
            >
              {status === "saving" ? "Saving…" : "Request call"}{" "}
              <span className="btnArrow">→</span>
            </button>
          )}

          <div className="row" style={{ justifyContent: "space-between" }}>
            <Link className="btn btnGhost" href="/estimate">
              Back to estimate
            </Link>
            <Link className="btn btnGhost" href="/">
              Back home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}