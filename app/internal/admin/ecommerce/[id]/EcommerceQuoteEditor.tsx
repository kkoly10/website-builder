"use client";

import { useMemo, useState } from "react";

type Props = {
  ecomIntakeId: string;
  intakeData: any;
  quote: any | null;
  recommendation: {
    setupFee: number;
    monthlyFee: number;
    fulfillmentModel: string;
    status: string;
    quoteJson: Record<string, unknown>;
  };
};

export default function EcommerceQuoteEditor({ ecomIntakeId, intakeData, quote, recommendation }: Props) {
  const [quoteId, setQuoteId] = useState<string>(String(quote?.id || "").trim());
  const [estimateSetupFee, setEstimateSetupFee] = useState<string>(String(quote?.estimate_setup_fee ?? ""));
  const [estimateMonthlyFee, setEstimateMonthlyFee] = useState<string>(String(quote?.estimate_monthly_fee ?? ""));
  const [estimateFulfillmentModel, setEstimateFulfillmentModel] = useState<string>(quote?.estimate_fulfillment_model || "");
  const [status, setStatus] = useState<string>(quote?.status || "draft");
  const [quoteJson, setQuoteJson] = useState<string>(JSON.stringify(quote?.quote_json || {}, null, 2));
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const actionLabel = useMemo(() => (quoteId ? "Update Quote" : "Create Quote"), [quoteId]);

  const applyRecommendation = () => {
    setEstimateSetupFee(String(recommendation.setupFee));
    setEstimateMonthlyFee(String(recommendation.monthlyFee));
    setEstimateFulfillmentModel(recommendation.fulfillmentModel);
    setStatus(recommendation.status);
    setQuoteJson(JSON.stringify(recommendation.quoteJson, null, 2));
    setSaveState("idle");
    setMessage("Baseline applied. Review and save when ready.");
  };

  const save = async () => {
    setSaving(true);
    setSaveState("idle");
    setMessage("");

    let parsedQuoteJson: Record<string, unknown> = {};
    try {
      parsedQuoteJson = quoteJson.trim() ? JSON.parse(quoteJson) : {};
    } catch {
      setSaveState("error");
      setMessage("Quote JSON must be valid JSON.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/internal/ecommerce/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          ecomIntakeId,
          estimateSetupFee,
          estimateMonthlyFee,
          estimateFulfillmentModel,
          status,
          quoteJson: parsedQuoteJson,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to save quote.");

      if (data.quoteId) setQuoteId(String(data.quoteId));
      setSaveState("success");
      setMessage("Quote saved successfully.");
    } catch (err: any) {
      setSaveState("error");
      setMessage(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="cardInner" style={{ display: "grid", gap: 10 }}>
        <h2 className="h3">Quote editor</h2>
        <p className="pDark" style={{ margin: 0, fontSize: 13 }}>
          Create or update the e-commerce quote in-place. Supported statuses: draft, review, sent, accepted, declined.
        </p>

        <div className="pills">
          <span className="pill">Business: {intakeData?.business_name || "—"}</span>
          <span className="pill">Orders/mo: {intakeData?.monthly_orders || "—"}</span>
          <span className="pill">Services: {Array.isArray(intakeData?.service_types) && intakeData.service_types.length ? intakeData.service_types.length : 0}</span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btnGhost" onClick={applyRecommendation}>
            Apply Suggested Baseline
          </button>
          {quoteId ? <span className="pill">Quote ID: {quoteId.slice(0, 8)}</span> : null}
        </div>

        <div className="grid2">
          <div>
            <label className="fieldLabel">Setup fee estimate</label>
            <input className="input" value={estimateSetupFee} onChange={(e) => setEstimateSetupFee(e.target.value)} />
          </div>
          <div>
            <label className="fieldLabel">Monthly fee estimate</label>
            <input className="input" value={estimateMonthlyFee} onChange={(e) => setEstimateMonthlyFee(e.target.value)} />
          </div>
        </div>

        <div className="grid2">
          <div>
            <label className="fieldLabel">Fulfillment model</label>
            <input className="input" value={estimateFulfillmentModel} onChange={(e) => setEstimateFulfillmentModel(e.target.value)} />
          </div>
          <div>
            <label className="fieldLabel">Quote status</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>draft</option>
              <option>review</option>
              <option>sent</option>
              <option>accepted</option>
              <option>declined</option>
            </select>
          </div>
        </div>

        <div>
          <label className="fieldLabel">Quote JSON</label>
          <textarea
            className="input"
            style={{ minHeight: 160, fontFamily: "monospace" }}
            value={quoteJson}
            onChange={(e) => setQuoteJson(e.target.value)}
          />
        </div>

        {message ? (
          <p
            className="pDark"
            style={{ margin: 0, color: saveState === "success" ? "#22c55e" : saveState === "error" ? "#ef4444" : "var(--muted)" }}
          >
            {message}
          </p>
        ) : null}

        <div>
          <button type="button" className="btn btnPrimary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
