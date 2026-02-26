"use client";

import { useEffect, useMemo, useState } from "react";

type Props = { quoteId: string; };
type SuccessState = { callRequestId?: string; nextUrl?: string; } | null;

const LAST_QUOTE_KEY = "crecystudio:lastQuoteId";

function detectTimezone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"; } catch { return "America/New_York"; } }
function readQuoteIdFromUrl() { try { const sp = new URLSearchParams(window.location.search); return String(sp.get("quoteId") || sp.get("id") || "").trim(); } catch { return ""; } }

export default function BookClient({ quoteId }: Props) {
  const [effectiveQuoteId, setEffectiveQuoteId] = useState<string>((quoteId || "").trim());
  const [bestTimeToCall, setBestTimeToCall] = useState("");
  const [preferredTimes, setPreferredTimes] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessState>(null);

  useEffect(() => {
    const fromProp = (quoteId || "").trim();
    if (fromProp) { setEffectiveQuoteId(fromProp); try { window.localStorage.setItem(LAST_QUOTE_KEY, fromProp); } catch {}; return; }
    const fromUrl = readQuoteIdFromUrl();
    if (fromUrl) { setEffectiveQuoteId(fromUrl); try { window.localStorage.setItem(LAST_QUOTE_KEY, fromUrl); } catch {}; return; }
    try { const fromStorage = String(window.localStorage.getItem(LAST_QUOTE_KEY) || "").trim(); if (fromStorage) setEffectiveQuoteId(fromStorage); } catch {}
  }, [quoteId]);

  useEffect(() => { setTimezone(detectTimezone()); }, []);

  const portalPath = useMemo(() => (effectiveQuoteId ? `/portal?quoteId=${encodeURIComponent(effectiveQuoteId)}` : "/portal"), [effectiveQuoteId]);
  const nextUrl = success?.nextUrl || portalPath;
  
  // RESTORED: Auth Links
  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(nextUrl)}`, [nextUrl]);
  const signupHref = useMemo(() => `/signup?next=${encodeURIComponent(nextUrl)}`, [nextUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!effectiveQuoteId) { setError("Missing quote reference."); return; }
    setLoading(true);

    try {
      const res = await fetch(`/api/request-call?quoteId=${encodeURIComponent(effectiveQuoteId)}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ quoteId: effectiveQuoteId, bestTimeToCall, preferredTimes, timezone, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to submit");
      setSuccess({ callRequestId: json?.callRequestId, nextUrl: json?.nextUrl });
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to submit"); } 
    finally { setLoading(false); }
  }

  if (success) {
    return (
      <main className="container" style={{ padding: "60px 0 100px", maxWidth: 600 }}>
        <section className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accentSoft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 24 }}>✓</div>
          <h2 className="h2" style={{ margin: 0, color: "var(--fg)" }}>Quote Saved & Call Requested</h2>
          <p className="p" style={{ marginTop: 16, color: "var(--muted)" }}>Your quote is saved in your portal. Log in or create a free account using the same email address to track your project status.</p>
          
          <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a className="btn btnPrimary" href={nextUrl}>Open Portal <span className="btnArrow">→</span></a>
            <a className="btn btnGhost" href={signupHref}>Create Account</a>
            {/* RESTORED: Log in button */}
            <a className="btn btnGhost" href={loginHref}>Log in</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "60px 0 100px", maxWidth: 600 }}>
      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2" style={{ margin: 0 }}>Book your discovery call</h2>
          <p className="pDark" style={{ marginTop: 8 }}>Let's review the scope and ensure we're aligned before any payment.</p>
        </div>

        <div className="panelBody">
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
            <div>
              <div className="fieldLabel">Best time of day *</div>
              <select className="select" value={bestTimeToCall} onChange={(e) => setBestTimeToCall(e.target.value)} required>
                <option value="">Select one</option><option value="Morning">Morning</option><option value="Midday">Midday</option><option value="Afternoon">Afternoon</option><option value="Evening">Evening</option><option value="Flexible">Flexible</option>
              </select>
            </div>
            <div className="grid2">
              <div>
                <div className="fieldLabel">Preferred Days/Hours</div>
                <input className="input" value={preferredTimes} onChange={(e) => setPreferredTimes(e.target.value)} placeholder="e.g. Tue/Thu afternoons" />
              </div>
              <div>
                <div className="fieldLabel">Timezone</div>
                <input className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="fieldLabel">Notes for the call (optional)</div>
              <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Questions about the quote? Specific features to discuss?" />
            </div>

            {error && <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,80,80,0.1)", color: "#ffb4b4", border: "1px solid rgba(255,80,80,0.3)", fontWeight: 600 }}>{error}</div>}

            <div style={{ marginTop: 12, display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btnPrimary" type="submit" disabled={loading || !effectiveQuoteId}>
                {loading ? "Submitting..." : "Confirm Request"} <span className="btnArrow">→</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
