"use client";

import { useMemo, useState } from "react";

type Props = {
  quoteId: string;
};

type SuccessState = {
  callRequestId?: string;
  nextUrl?: string;
} | null;

export default function BookClient({ quoteId }: Props) {
  const [bestTimeToCall, setBestTimeToCall] = useState("");
  const [preferredTimes, setPreferredTimes] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessState>(null);

  const portalPath = useMemo(
    () => `/portal?quoteId=${encodeURIComponent(quoteId)}`,
    [quoteId]
  );

  const nextUrl = success?.nextUrl || portalPath;
  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(nextUrl)}`, [nextUrl]);
  const signupHref = useMemo(() => `/signup?next=${encodeURIComponent(nextUrl)}`, [nextUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/request-call", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quoteId,
          bestTimeToCall,
          preferredTimes,
          timezone,
          notes,
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "Failed to submit");

      setSuccess({
        callRequestId: json?.callRequestId,
        nextUrl: json?.nextUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <section className="card" style={{ marginTop: 18 }}>
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Call request submitted
          </div>

          <div style={{ height: 10 }} />
          <h2 className="h2" style={{ margin: 0 }}>
            We saved your website quote + call request
          </h2>

          <p className="p" style={{ marginTop: 10 }}>
            Your quote stays in your portal. If you create an account with the same email you used for the quote, it will attach automatically.
          </p>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn btnPrimary" href={nextUrl}>
              Open Portal <span className="btnArrow">→</span>
            </a>
            <a className="btn btnGhost" href={loginHref}>
              Log in
            </a>
            <a className="btn btnGhost" href={signupHref}>
              Create account
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card" style={{ marginTop: 18 }}>
      <div className="cardInner">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Request a call about this quote
        </div>

        <div style={{ height: 10 }} />
        <h2 className="h2" style={{ margin: 0 }}>
          Choose a good time
        </h2>

        <p className="p" style={{ marginTop: 10 }}>
          We’ll review your estimate, scope, and the fastest path to launch.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Best time to call *</span>
            <select
              className="input"
              value={bestTimeToCall}
              onChange={(e) => setBestTimeToCall(e.target.value)}
              required
            >
              <option value="">Select one</option>
              <option value="Morning">Morning</option>
              <option value="Midday">Midday</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
              <option value="Flexible">Flexible</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Preferred times</span>
            <input
              className="input"
              value={preferredTimes}
              onChange={(e) => setPreferredTimes(e.target.value)}
              placeholder="Example: Mon/Wed 1–4pm"
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Timezone</span>
            <input
              className="input"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="America/New_York"
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Notes</span>
            <textarea
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Anything we should know before the call?"
            />
          </label>

          {error ? (
            <div
              style={{
                padding: 10,
                borderRadius: 12,
                border: "1px solid rgba(255,120,120,0.25)",
                background: "rgba(255,80,80,0.07)",
                color: "rgba(255,210,210,0.95)",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit call request"}
            </button>
            <a className="btn btnGhost" href={portalPath}>
              Open portal instead
            </a>
          </div>
        </form>
      </div>
    </section>
  );
}
