// app/book/page.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function BookPage() {
  const sp = useSearchParams();

  const quoteId = sp.get("quoteId") ?? "";
  const token = sp.get("t") ?? "";

  const prefillEmail = sp.get("email") ?? "";
  const prefillPhone = sp.get("phone") ?? "";

  const canUse = useMemo(() => Boolean(quoteId && token), [quoteId, token]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState(prefillPhone);
  const [timezone, setTimezone] = useState("America/New_York");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);

    if (!canUse) {
      setError("Missing reference. Please return to your estimate and click “Request a call” again.");
      return;
    }

    if (!opt1 && !opt2 && !opt3) {
      setError("Please provide at least one availability option.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          token,
          name,
          phone,
          availability: {
            option1: opt1,
            option2: opt2,
            option3: opt3,
            timezone,
          },
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to submit booking request.");

      setDone(true);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Book a call
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Request a quick scope call</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        We’ll confirm your scope and timeline first — then we’ll send a deposit link after the call if you want to move forward.
      </p>

      <div style={{ height: 18 }} />

      {!canUse ? (
        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Missing reference</div>
            <div className="smallNote">
              This page needs a quote reference from your estimate.
            </div>
          </div>
          <div className="panelBody">
            <Link className="btn btnPrimary" href="/estimate">
              Back to Estimate <span className="btnArrow">→</span>
            </Link>
          </div>
        </section>
      ) : done ? (
        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Request received ✅</div>
            <div className="smallNote">
              We’ll reach out to confirm a time. Keep this reference:
            </div>
          </div>
          <div className="panelBody">
            <div className="smallNote">
              <strong>Reference ID:</strong> <code>{quoteId}</code>
              <div style={{ marginTop: 10, opacity: 0.8 }}>
                {prefillEmail ? (
                  <>
                    <strong>Email:</strong> {prefillEmail}
                  </>
                ) : null}
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div className="row" style={{ justifyContent: "space-between" }}>
              <Link className="btn btnGhost" href="/">
                Back home
              </Link>
              <Link className="btn btnPrimary" href="/estimate">
                View estimate <span className="btnArrow">→</span>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Your availability</div>
            <div className="smallNote">
              Give 1–3 options. We’ll confirm the best slot.
            </div>
          </div>

          <div className="panelBody" style={{ display: "grid", gap: 12 }}>
            {error ? (
              <div style={{ color: "#b00", fontWeight: 800 }}>{error}</div>
            ) : null}

            <div>
              <div className="fieldLabel">Name (optional)</div>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>

            <div>
              <div className="fieldLabel">Phone (optional)</div>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
            </div>

            <div>
              <div className="fieldLabel">Timezone</div>
              <input className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              <div className="smallNote" style={{ marginTop: 8 }}>
                Default is America/New_York.
              </div>
            </div>

            <div>
              <div className="fieldLabel">Option 1</div>
              <input className="input" value={opt1} onChange={(e) => setOpt1(e.target.value)} placeholder="e.g., Thu 2–4pm" />
            </div>

            <div>
              <div className="fieldLabel">Option 2</div>
              <input className="input" value={opt2} onChange={(e) => setOpt2(e.target.value)} placeholder="e.g., Fri 10–11am" />
            </div>

            <div>
              <div className="fieldLabel">Option 3</div>
              <input className="input" value={opt3} onChange={(e) => setOpt3(e.target.value)} placeholder="e.g., Sat after 6pm" />
            </div>

            <div>
              <div className="fieldLabel">Notes (optional)</div>
              <textarea className="textarea" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know before the call?" />
            </div>

            <div className="row" style={{ justifyContent: "space-between" }}>
              <Link className="btn btnGhost" href="/estimate">
                Back to estimate
              </Link>

              <button className="btn btnPrimary" onClick={submit} disabled={loading}>
                {loading ? "Submitting…" : "Request call"} <span className="btnArrow">→</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}