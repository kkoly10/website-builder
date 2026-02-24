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
  const [bestTimeToCall, setBestTimeToCall] = useState(BEST_TIME_OPTIONS[0]);
  const [preferredTimes, setPreferredTimes] = useState("");
  const [timezone, setTimezone] = useState(detectTimezone());
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const intakeId = useMemo(() => String(intake?.id ?? "").trim(), [intake]);

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
        body: JSON.stringify({
          opsIntakeId: intakeId,
          bestTimeToCall,
          preferredTimes,
          timezone,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to request ops call.");
      }

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

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="cardInner" style={{ display: "grid", gap: 14 }}>
        <div className="p">
          <strong>Company:</strong> {intake.company_name}
          <br />
          <strong>Contact:</strong> {intake.contact_name} ({intake.email})
          <br />
          {intake.recommendation_tier ? (
            <>
              <strong>Suggested tier:</strong> {intake.recommendation_tier}
              {intake.recommendation_price_range ? ` • ${intake.recommendation_price_range}` : ""}
            </>
          ) : null}
        </div>

        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontWeight: 800 }}>Best time to call</span>
          <select
            value={bestTimeToCall}
            onChange={(e) => setBestTimeToCall(e.target.value)}
            style={inputStyle}
          >
            {BEST_TIME_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontWeight: 800 }}>Preferred times (optional)</span>
          <input
            value={preferredTimes}
            onChange={(e) => setPreferredTimes(e.target.value)}
            placeholder='e.g., "Mon/Wed after 5pm"'
            style={inputStyle}
          />
        </label>

        <div className="p">Timezone detected: {timezone}</div>

        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontWeight: 800 }}>Anything we should know before the call?</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Budget, priority workflow, deadlines, or special notes..."
            style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
          />
        </label>

        {status === "sent" ? (
          <div
            style={{
              border: "1px solid rgba(34,197,94,0.35)",
              background: "rgba(34,197,94,0.08)",
              borderRadius: 12,
              padding: 12,
              fontWeight: 700,
            }}
          >
            Call request submitted. You can also create an account to track progress.
          </div>
        ) : null}

        {status === "error" ? (
          <div
            style={{
              border: "1px solid rgba(255,0,0,0.35)",
              background: "rgba(255,0,0,0.08)",
              borderRadius: 12,
              padding: 12,
              fontWeight: 700,
            }}
          >
            {errorMsg || "Something went wrong."}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
          <Link className="btn btnGhost" href="/systems">
            Back to Ops Intake
          </Link>

          <button
            type="button"
            className="btn btnPrimary"
            onClick={requestCall}
            disabled={status === "sending"}
          >
            {status === "sending" ? "Requesting..." : "Request workflow call"}{" "}
            <span className="btnArrow">→</span>
          </button>
        </div>

        <div className="p" style={{ fontSize: 13, opacity: 0.8 }}>
          Want a portal login?{" "}
          <Link href={`/signup?next=${encodeURIComponent("/internal")}`}>Create account</Link>{" "}
          or{" "}
          <Link href={`/login?next=${encodeURIComponent("/internal")}`}>Sign in</Link>.
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.03)",
  color: "rgba(255,255,255,0.95)",
  padding: "12px 14px",
  outline: "none",
};
