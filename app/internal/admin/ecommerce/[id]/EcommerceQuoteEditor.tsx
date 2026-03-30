"use client";

import { useState } from "react";

type QuoteData = {
  id?: string;
  status: string;
  estimate_setup_fee: number | null;
  estimate_monthly_fee: number | null;
  estimate_fulfillment_model: string;
};

export default function EcommerceQuoteEditor({
  ecomIntakeId,
  initialQuote,
}: {
  ecomIntakeId: string;
  initialQuote: QuoteData | null;
}) {
  const [quote, setQuote] = useState<QuoteData>(
    initialQuote ?? {
      status: "draft",
      estimate_setup_fee: null,
      estimate_monthly_fee: null,
      estimate_fulfillment_model: "",
    }
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const statusOptions = [
    "draft",
    "sent",
    "accepted",
    "declined",
    "in_progress",
    "completed",
    "closed_lost",
  ];

  async function handleSave() {
    setSaving(true);
    setMsg("");
    setIsError(false);
    try {
      const res = await fetch("/api/internal/ecommerce/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ecomIntakeId,
          quoteId: quote.id,
          status: quote.status,
          estimate_setup_fee: quote.estimate_setup_fee ?? undefined,
          estimate_monthly_fee: quote.estimate_monthly_fee ?? undefined,
          estimate_fulfillment_model: quote.estimate_fulfillment_model || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Save failed");
      if (json.quote?.id) setQuote((p) => ({ ...p, id: json.quote.id }));
      setMsg("Quote saved.");
    } catch (err) {
      setIsError(true);
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="cardInner">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ fontWeight: 900, color: "var(--fg)" }}>
            {quote.id ? "Edit Quote" : "Create Quote"}
          </div>
          {quote.id ? (
            <span className="badge" style={{ fontSize: 11 }}>
              ID {quote.id.slice(0, 8)}
            </span>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          <div>
            <div className="fieldLabel">Status</div>
            <select
              className="select"
              value={quote.status}
              onChange={(e) => setQuote((p) => ({ ...p, status: e.target.value }))}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="fieldLabel">Setup fee ($)</div>
            <input
              className="input"
              type="number"
              min={0}
              value={quote.estimate_setup_fee ?? ""}
              placeholder="e.g. 2500"
              onChange={(e) =>
                setQuote((p) => ({
                  ...p,
                  estimate_setup_fee: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </div>

          <div>
            <div className="fieldLabel">Monthly fee ($)</div>
            <input
              className="input"
              type="number"
              min={0}
              value={quote.estimate_monthly_fee ?? ""}
              placeholder="e.g. 500"
              onChange={(e) =>
                setQuote((p) => ({
                  ...p,
                  estimate_monthly_fee: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </div>

          <div>
            <div className="fieldLabel">Fulfillment model</div>
            <input
              className="input"
              type="text"
              value={quote.estimate_fulfillment_model}
              placeholder="e.g. 3PL, dropship, hybrid"
              onChange={(e) =>
                setQuote((p) => ({ ...p, estimate_fulfillment_model: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: 16, gap: 10 }}>
          <button className="btn btnPrimary" disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : quote.id ? "Update quote" : "Create quote"}
          </button>
          {msg ? (
            <span
              className="smallNote"
              style={{ color: isError ? "var(--error, #f87171)" : undefined }}
            >
              {msg}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
