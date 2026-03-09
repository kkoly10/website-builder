"use client";

import { useState } from "react";
import { ECOM_CALL_STATUSES, ECOM_INTAKE_STATUSES, ECOM_QUOTE_STATUSES } from "@/lib/ecommerce/status";

type Props = {
  ecomIntakeId: string;
  initialIntakeStatus: string;
  initialCallStatus: string;
  initialQuoteStatus: string;
};

export default function EcommerceStatusControls({
  ecomIntakeId,
  initialIntakeStatus,
  initialCallStatus,
  initialQuoteStatus,
}: Props) {
  const [intakeStatus, setIntakeStatus] = useState(initialIntakeStatus);
  const [callStatus, setCallStatus] = useState(initialCallStatus);
  const [quoteStatus, setQuoteStatus] = useState(initialQuoteStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/internal/ecommerce/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ecomIntakeId, intakeStatus, callStatus, quoteStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Save failed");
      setMessage("Statuses updated.");
    } catch (err: any) {
      setMessage(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="cardInner" style={{ display: "grid", gap: 10 }}>
        <h2 className="h3">Quick status controls</h2>
        <div className="grid3">
          <div>
            <label className="fieldLabel">Intake status</label>
            <select className="select" value={intakeStatus} onChange={(e) => setIntakeStatus(e.target.value)}>
              {ECOM_INTAKE_STATUSES.map((statusOption) => <option key={statusOption}>{statusOption}</option>)}
            </select>
          </div>
          <div>
            <label className="fieldLabel">Call status</label>
            <select className="select" value={callStatus} onChange={(e) => setCallStatus(e.target.value)}>
              {ECOM_CALL_STATUSES.map((statusOption) => <option key={statusOption}>{statusOption}</option>)}
            </select>
          </div>
          <div>
            <label className="fieldLabel">Quote status</label>
            <select className="select" value={quoteStatus} onChange={(e) => setQuoteStatus(e.target.value)}>
              {ECOM_QUOTE_STATUSES.map((statusOption) => <option key={statusOption}>{statusOption}</option>)}
            </select>
          </div>
        </div>
        {message ? <p className="pDark" style={{ margin: 0 }}>{message}</p> : null}
        <div><button className="btn btnPrimary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Statuses"}</button></div>
      </div>
    </div>
  );
}
