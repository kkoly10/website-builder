// app/internal/dashboard/QuoteEditorClient.tsx
"use client";

import { useMemo, useState } from "react";

type Props = {
  quoteId: string;
  initial: {
    status: string;
    deposit_link_url: string;
    deposit_amount: string | number;
    scope_snapshot: any;
    scope_locked_at: string | null;
  };
};

const STATUS_OPTIONS = [
  "new",
  "call_scheduled",
  "called",
  "scoped",
  "deposit_sent",
  "deposit_paid",
  "in_progress",
  "delivered",
  "closed",
];

export default function QuoteEditorClient({ quoteId, initial }: Props) {
  const [status, setStatus] = useState(initial.status);
  const [depositLink, setDepositLink] = useState(initial.deposit_link_url || "");
  const [depositAmount, setDepositAmount] = useState(String(initial.deposit_amount ?? ""));
  const [scopeSnapshotText, setScopeSnapshotText] = useState(
    JSON.stringify(initial.scope_snapshot ?? {}, null, 2)
  );
  const [scopeLockedAt, setScopeLockedAt] = useState<string | null>(initial.scope_locked_at);

  const locked = useMemo(() => !!scopeLockedAt, [scopeLockedAt]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function updateQuote(patch: any) {
    setSaving(true);
    setMsg("");

    try {
      const res = await fetch("/api/internal/update-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // internal protection key
          "x-internal-key": String(process.env.NEXT_PUBLIC_INTERNAL_DASH_KEY || ""),
        },
        body: JSON.stringify({ quoteId, patch }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Update failed");

      if (json?.data?.scope_locked_at !== undefined) setScopeLockedAt(json.data.scope_locked_at);
      setMsg("Saved ✅");
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  function safeParseScope() {
    try {
      return JSON.parse(scopeSnapshotText || "{}");
    } catch {
      throw new Error("Scope snapshot JSON is invalid.");
    }
  }

  async function saveBasics() {
    const scope_snapshot = safeParseScope();
    await updateQuote({
      status,
      deposit_link_url: depositLink || null,
      deposit_amount: depositAmount ? Number(depositAmount) : null,
      scope_snapshot,
    });
  }

  async function lockScope() {
    const scope_snapshot = safeParseScope();
    await updateQuote({
      status: status === "new" ? "scoped" : status,
      scope_snapshot,
      scope_locked_at: new Date().toISOString(),
    });
  }

  async function unlockScope() {
    await updateQuote({
      scope_locked_at: null,
    });
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div style={{ fontWeight: 950 }}>Lock scope + deposit</div>
        <div className="smallNote">
          Run the call first. Then lock scope, then paste Stripe deposit link and send it.
        </div>
      </div>

      <div className="panelBody" style={{ display: "grid", gap: 14 }}>
        <div className="grid2">
          <div>
            <div className="fieldLabel">Status</div>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={saving}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="fieldLabel">Deposit amount (optional)</div>
            <input
              className="input"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="e.g., 150"
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <div className="fieldLabel">Deposit link URL (Stripe Payment Link)</div>
          <input
            className="input"
            value={depositLink}
            onChange={(e) => setDepositLink(e.target.value)}
            placeholder="https://buy.stripe.com/..."
            disabled={saving}
          />
          <div className="smallNote" style={{ marginTop: 6 }}>
            You’ll paste this after the call. Do not show it on the public estimate page.
          </div>
        </div>

        <div>
          <div className="fieldLabel">Scope snapshot (JSON)</div>
          <textarea
            className="textarea"
            value={scopeSnapshotText}
            onChange={(e) => setScopeSnapshotText(e.target.value)}
            disabled={saving || locked}
            rows={12}
          />
          <div className="smallNote" style={{ marginTop: 6 }}>
            Tip: Once locked, this becomes the “source of truth” for the project.
          </div>
        </div>

        <div className="row" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btnGhost" onClick={saveBasics} disabled={saving || locked}>
              Save changes
            </button>

            {!locked ? (
              <button className="btn btnPrimary" onClick={lockScope} disabled={saving}>
                Lock scope
              </button>
            ) : (
              <button className="btn btnGhost" onClick={unlockScope} disabled={saving}>
                Unlock (admin)
              </button>
            )}
          </div>

          <div className={`badge ${locked ? "badgeHot" : ""}`}>
            {locked ? "Locked" : "Editable"}
          </div>
        </div>

        {msg ? <div className="smallNote">{msg}</div> : null}
      </div>
    </section>
  );
}