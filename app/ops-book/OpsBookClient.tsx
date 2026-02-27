"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Intake = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  recommendation_tier?: string | null;
  recommendation_price_range?: string | null;
};

const BEST_TIME_OPTIONS = [
  "Weekday morning (9am–12pm)",
  "Weekday afternoon (12pm–4pm)",
  "Weekday evening (4pm–7pm)",
  "Weekend",
  "Anytime",
];

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

export default function OpsBookClient({ intake }: { intake: Intake }) {
  const intakeId = useMemo(() => String(intake?.id ?? "").trim(), [intake]);

  const [bestTimeToCall, setBestTimeToCall] = useState(BEST_TIME_OPTIONS[0]);
  const [preferredTimes, setPreferredTimes] = useState("");
  const [timezone, setTimezone] = useState(detectTimezone());
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function requestCall() {
    setErrorMsg("");

    if (!intakeId) {
      setStatus("error");
      setErrorMsg("Missing ops intake ID. Please start from the workflow intake page.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/ops/request-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opsIntakeId: intakeId, bestTimeToCall, preferredTimes, timezone, notes }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to request workflow call.");

      try {
        localStorage.setItem("crecystudio:lastOpsIntakeId", intakeId);
      } catch {}

      setStatus("sent");

      if (json?.nextUrl) {
        window.location.assign(json.nextUrl);
        return;
      }
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message || "Failed to request call.");
    }
  }

  const nextUrl = "/portal";
  const loginHref = `/login?next=${encodeURIComponent(nextUrl)}`;
  const signupHref = `/signup?next=${encodeURIComponent(nextUrl)}`;

  return (
    <main className="container" style={{ padding: "32px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Workflow Call Booking
      </div>

      <div style={{ height: 12 }} />
      <h1 className="h1">Book your workflow review call</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        We found your workflow intake. Choose your preferred timing and we’ll follow up to confirm.
      </p>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 800 }}>Intake summary</div>
          <div className="smallNote">We’ll attach the booking to this workflow request.</div>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 10 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 800, color: "var(--fg)" }}>{intake.company_name}</div>
              <div className="pDark">
                {intake.contact_name} • {intake.email}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              {intake.recommendation_tier ? (
                <div className="badge badgeHot">{intake.recommendation_tier}</div>
              ) : (
                <div className="badge">Workflow intake</div>
              )}
              {intake.recommendation_price_range ? (
                <div className="pDark" style={{ marginTop: 6 }}>
                  {intake.recommendation_price_range}
                </div>
              ) : null}
            </div>
          </div>

          <div className="smallNote">
            Intake ID: <code>{intakeId}</code>
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 800 }}>Call details</div>
          <div className="smallNote">Pick the best timing, add notes, and submit.</div>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span className="fieldLabel">Best time to call</span>
            <select className="select" value={bestTimeToCall} onChange={(e) => setBestTimeToCall(e.target.value)}>
              {BEST_TIME_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="fieldLabel">Preferred times (optional)</span>
            <input
              className="input"
              value={preferredTimes}
              onChange={(e) => setPreferredTimes(e.target.value)}
              placeholder='e.g., "Mon/Wed after 5pm"'
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="fieldLabel">Timezone</span>
            <input className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="fieldLabel">Notes</span>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Budget, priority workflow, deadlines, or special notes…"
              rows={5}
            />
          </label>

          {status === "sent" ? (
            <div
              style={{
                border: "1px solid rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.08)",
                borderRadius: 10,
                padding: 12,
                fontWeight: 700,
              }}
            >
              Call request submitted. You can create an account to keep everything attached to your email.
            </div>
          ) : null}

          {status === "error" ? (
            <div
              style={{
                border: "1px solid rgba(255,0,0,0.35)",
                background: "rgba(255,0,0,0.08)",
                borderRadius: 10,
                padding: 12,
                fontWeight: 700,
              }}
            >
              {errorMsg || "Something went wrong."}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
            <Link className="btn btnGhost" href="/systems">
              Back to Systems
            </Link>

            <button className="btn btnPrimary" type="button" onClick={requestCall} disabled={status === "sending"}>
              {status === "sending" ? "Requesting..." : "Request workflow call"} <span className="btnArrow">→</span>
            </button>
          </div>

          <div className="smallNote">
            Want a portal login?{" "}
            <Link href={signupHref} style={{ color: "var(--accent2)", fontWeight: 800 }}>
              Create account
            </Link>{" "}
            or{" "}
            <Link href={loginHref} style={{ color: "var(--accent2)", fontWeight: 800 }}>
              Sign in
            </Link>
            .
          </div>
        </div>
      </section>
    </main>
  );
}