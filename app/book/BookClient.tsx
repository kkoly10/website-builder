"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  quoteId: string;
};

type SuccessState = {
  callRequestId?: string;
  nextUrl?: string;
} | null;

const LAST_QUOTE_KEY = "crecystudio:lastQuoteId";

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

function readQuoteIdFromUrl() {
  try {
    const sp = new URLSearchParams(window.location.search);
    // accept variants
    return (
      String(sp.get("quoteId") || "").trim() ||
      String(sp.get("quoteid") || "").trim() ||
      String(sp.get("qid") || "").trim() ||
      String(sp.get("id") || "").trim()
    );
  } catch {
    return "";
  }
}

export default function BookClient({ quoteId }: Props) {
  const [effectiveQuoteId, setEffectiveQuoteId] = useState<string>((quoteId || "").trim());

  const [bestTimeToCall, setBestTimeToCall] = useState("");
  const [preferredTimes, setPreferredTimes] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessState>(null);

  // Long-term stability: prop -> URL -> localStorage
  useEffect(() => {
    const fromProp = (quoteId || "").trim();
    if (fromProp) {
      setEffectiveQuoteId(fromProp);
      try {
        window.localStorage.setItem(LAST_QUOTE_KEY, fromProp);
      } catch {}
      return;
    }

    const fromUrl = readQuoteIdFromUrl();
    if (fromUrl) {
      setEffectiveQuoteId(fromUrl);
      try {
        window.localStorage.setItem(LAST_QUOTE_KEY, fromUrl);
      } catch {}
      return;
    }

    try {
      const fromStorage = String(window.localStorage.getItem(LAST_QUOTE_KEY) || "").trim();
      if (fromStorage) setEffectiveQuoteId(fromStorage);
    } catch {}
  }, [quoteId]);

  useEffect(() => {
    setTimezone(detectTimezone());
  }, []);

  const portalPath = useMemo(
    () => (effectiveQuoteId ? `/portal?quoteId=${encodeURIComponent(effectiveQuoteId)}` : "/portal"),
    [effectiveQuoteId]
  );

  const nextUrl = success?.nextUrl || portalPath;
  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(nextUrl)}`, [nextUrl]);
  const signupHref = useMemo(() => `/signup?next=${encodeURIComponent(nextUrl)}`, [nextUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!effectiveQuoteId) {
      setError("Missing quote reference. Please go back and submit the estimate first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/request-call?quoteId=${encodeURIComponent(effectiveQuoteId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quoteId: effectiveQuoteId,
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
      <main className="container" style={{ padding: "28px 0 80px" }}>
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
              Your quote stays in your portal. If you create an account with the same email you used for the quote,
              it will attach automatically.
            </p>

            <div className="hint" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 950, color: "rgba(255,255,255,0.92)" }}>Quote reference</div>
              <div className="pDark" style={{ marginTop: 6 }}>
                Quote ID: <strong>{effectiveQuoteId}</strong>
                {success.callRequestId ? (
                  <>
                    {" "}
                    • Call Request ID: <strong>{success.callRequestId}</strong>
                  </>
                ) : null}
              </div>
            </div>

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
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "28px 0 80px" }}>
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

          <div className="hint" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 950, color: "rgba(255,255,255,0.92)" }}>Quote reference</div>
            <div className="pDark" style={{ marginTop: 6 }}>
              Quote ID: <strong>{effectiveQuoteId || "(missing)"}</strong>
            </div>
          </div>

          <form onSubmit={onSubmit} style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 700 }}>Best time to call *</span>
              <select
                className="select"
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
                className="textarea"
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
              <button className="btn btnPrimary" type="submit" disabled={loading || !effectiveQuoteId}>
                {loading ? "Submitting..." : "Submit call request"}
              </button>
              <a className="btn btnGhost" href={portalPath}>
                Open portal instead
              </a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}