"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import StructuredObjectListEditor from "@/components/internal/editors/StructuredObjectListEditor";
import StructuredStringListEditor from "@/components/internal/editors/StructuredStringListEditor";
import { getEcommerceRecommendationForIntake, getRecommendedEcommerceQuoteDefaults } from "@/lib/ecommerce/recommendation";
import type {
  EcommerceWorkspaceBundle,
  EcommerceWorkspaceItem,
  EcommerceWorkspaceMetric,
} from "@/lib/ecommerce/workspace";
import { ECOM_CALL_STATUSES, ECOM_INTAKE_STATUSES, ECOM_QUOTE_STATUSES } from "@/lib/ecommerce/status";

function pretty(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

const PHASE_OPTIONS = [
  "intake",
  "discovery",
  "proposal_review",
  "onboarding",
  "build_ready",
  "building",
  "testing",
  "launch",
  "operations",
  "reporting",
  "completed",
];

export default function EcommerceWorkspaceControlClient({ initialData }: { initialData: EcommerceWorkspaceBundle }) {
  const recommendation = useMemo(() => getEcommerceRecommendationForIntake(initialData.intake), [initialData.intake]);
  const recommended = getRecommendedEcommerceQuoteDefaults(recommendation);

  const [bundle, setBundle] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [intakeStatus, setIntakeStatus] = useState(String(initialData.intake.status || "new"));
  const [callStatus, setCallStatus] = useState(String(initialData.call?.status || "new"));
  const [quoteStatus, setQuoteStatus] = useState(String(initialData.quote?.status || "draft"));

  const [setupFee, setSetupFee] = useState<number | null>(initialData.quote?.estimate_setup_fee ?? recommended.setupFee);
  const [monthlyFee, setMonthlyFee] = useState<number | null>(initialData.quote?.estimate_monthly_fee ?? recommended.monthlyFee);
  const [fulfillmentModel, setFulfillmentModel] = useState(String(initialData.quote?.estimate_fulfillment_model || recommended.label || ""));

  const [phase, setPhase] = useState(initialData.workspace.phase);
  const [waitingOn, setWaitingOn] = useState(initialData.workspace.waitingOn);
  const [adminPublicNote, setAdminPublicNote] = useState(initialData.workspace.adminPublicNote);
  const [internalNotes, setInternalNotes] = useState(initialData.workspace.internalNotes);
  const [serviceSummary, setServiceSummary] = useState(initialData.workspace.serviceSummary);
  const [onboardingSummary, setOnboardingSummary] = useState(initialData.workspace.onboardingSummary);
  const [previewUrl, setPreviewUrl] = useState(initialData.workspace.previewUrl);
  const [productionUrl, setProductionUrl] = useState(initialData.workspace.productionUrl);
  const [agreementStatus, setAgreementStatus] = useState(initialData.workspace.agreementStatus);
  const [agreementText, setAgreementText] = useState(initialData.workspace.agreementText);

  const [deliverables, setDeliverables] = useState<EcommerceWorkspaceItem[]>(initialData.workspace.deliverables);
  const [milestones, setMilestones] = useState<EcommerceWorkspaceItem[]>(initialData.workspace.milestones);
  const [approvals, setApprovals] = useState<EcommerceWorkspaceItem[]>(initialData.workspace.approvals);
  const [assetsNeeded, setAssetsNeeded] = useState<EcommerceWorkspaceItem[]>(initialData.workspace.assetsNeeded);
  const [tasks, setTasks] = useState<EcommerceWorkspaceItem[]>(initialData.workspace.tasks);
  const [issues, setIssues] = useState<EcommerceWorkspaceItem[]>(initialData.workspace.issues);
  const [requests, setRequests] = useState<EcommerceWorkspaceItem[]>(initialData.workspace.requests);
  const [metrics, setMetrics] = useState<EcommerceWorkspaceMetric[]>(initialData.workspace.metrics);
  const [nextActions, setNextActions] = useState<string[]>(initialData.workspace.nextActions);
  const [monthlyPlan, setMonthlyPlan] = useState<string[]>(initialData.workspace.monthlyPlan);

  const modeLabel = useMemo(() => pretty(initialData.workspace.mode), [initialData.workspace.mode]);

  function makeItem(prefix: string, title: string): EcommerceWorkspaceItem {
    return {
      id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      status: "pending",
      notes: "",
    };
  }

  function makeMetric(): EcommerceWorkspaceMetric {
    return {
      id: `metric-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: "New metric",
      value: "",
      target: "",
      notes: "",
    };
  }

  function applyRecommendedPricing() {
    setSetupFee(recommended.setupFee);
    setMonthlyFee(recommended.monthlyFee);
    setFulfillmentModel(recommendation.tierLabel);
    if (!serviceSummary) setServiceSummary(recommendation.summary);
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");

    try {
      const statusRes = await fetch("/api/internal/ecommerce/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ecomIntakeId: bundle.intake.id, intakeStatus, callStatus, quoteStatus }),
      });
      const statusJson = await statusRes.json().catch(() => ({}));
      if (!statusRes.ok || !statusJson?.ok) throw new Error(statusJson?.error || "Failed to update statuses.");

      const quoteRes = await fetch("/api/internal/ecommerce/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: bundle.quote?.id,
          ecomIntakeId: bundle.intake.id,
          status: quoteStatus,
          estimateSetupFee: setupFee ?? undefined,
          estimateMonthlyFee: monthlyFee ?? undefined,
          estimateFulfillmentModel: fulfillmentModel || undefined,
          quoteJson: { pricingRecommendation: recommendation },
        }),
      });
      const quoteJson = await quoteRes.json().catch(() => ({}));
      if (!quoteRes.ok || !quoteJson?.ok) throw new Error(quoteJson?.error || "Failed to save quote.");

      const workspaceRes = await fetch("/api/internal/ecommerce/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ecomIntakeId: bundle.intake.id,
          workspace: {
            phase,
            waitingOn,
            adminPublicNote,
            internalNotes,
            serviceSummary,
            onboardingSummary,
            previewUrl,
            productionUrl,
            agreementStatus,
            agreementText,
            deliverables,
            milestones,
            approvals,
            assetsNeeded,
            tasks,
            metrics,
            issues,
            requests,
            nextActions,
            monthlyPlan,
          },
        }),
      });
      const workspaceJson = await workspaceRes.json().catch(() => ({}));
      if (!workspaceRes.ok || !workspaceJson?.ok) throw new Error(workspaceJson?.error || "Failed to save workspace.");

      const refreshRes = await fetch(`/api/portal/ecommerce/${bundle.intake.id}`);
      const refreshJson = await refreshRes.json().catch(() => ({}));
      if (refreshRes.ok && refreshJson?.ok && refreshJson?.data) {
        setBundle(refreshJson.data as EcommerceWorkspaceBundle);
      }

      setMessage("Workspace saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="kicker"><span className="kickerDot" /> E-commerce Project Control</div>
              <h1 className="h2" style={{ marginTop: 10 }}>{bundle.intake.business_name || "E-commerce lead"}</h1>
              <p className="pDark" style={{ marginTop: 6 }}>{bundle.intake.contact_name || "—"} • {bundle.intake.email || "—"}</p>
              <p className="pDark" style={{ marginTop: 6 }}>Intake {bundle.intake.id} • Created {fmtDate(bundle.intake.created_at)}</p>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Link href="/internal/admin/ecommerce" className="btn btnGhost">Back to E-commerce HQ</Link>
              <Link href={`/portal/ecommerce/${bundle.intake.id}`} className="btn btnPrimary">Client Workspace →</Link>
            </div>
          </div>

          <div className="grid4" style={{ marginTop: 18 }}>
            <InfoCard label="Service Path" value={modeLabel} />
            <InfoCard label="Phase" value={pretty(phase)} />
            <InfoCard label="Waiting On" value={waitingOn} />
            <InfoCard label="Quote" value={pretty(quoteStatus)} />
          </div>

          <div className="row" style={{ marginTop: 16, gap: 10 }}>
            <button className="btn btnPrimary" onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save workspace"}</button>
            {message ? <span className="smallNote">{message}</span> : null}
          </div>
        </div>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <Panel title="Pipeline + proposal" note="Advance this lead from intake to completion.">
          <div className="grid3">
            <FieldSelect label="Intake status" value={intakeStatus} onChange={setIntakeStatus} options={[...ECOM_INTAKE_STATUSES]} />
            <FieldSelect label="Call status" value={callStatus} onChange={setCallStatus} options={[...ECOM_CALL_STATUSES]} />
            <FieldSelect label="Quote status" value={quoteStatus} onChange={setQuoteStatus} options={[...ECOM_QUOTE_STATUSES]} />
          </div>
          <div className="grid3">
            <FieldSelect label="Workspace phase" value={phase} onChange={setPhase} options={PHASE_OPTIONS} />
            <TextField label="Waiting on" value={waitingOn} onChange={setWaitingOn} />
            <TextField label="Fulfillment / service model" value={fulfillmentModel} onChange={setFulfillmentModel} />
          </div>
          <div className="grid3">
            <NumberField label="Setup / project fee" value={setupFee} onChange={setSetupFee} />
            <NumberField label="Monthly fee" value={monthlyFee} onChange={setMonthlyFee} />
            <FieldSelect label="Agreement status" value={agreementStatus} onChange={setAgreementStatus} options={["pending", "sent", "accepted"]} />
          </div>
          <TextareaField label="Service summary" value={serviceSummary} onChange={setServiceSummary} rows={3} />
          <TextareaField label="Client-facing note" value={adminPublicNote} onChange={setAdminPublicNote} rows={4} />
          <TextareaField label="Internal notes" value={internalNotes} onChange={setInternalNotes} rows={5} />
        </Panel>

        <Panel title="Pricing recommendation" note="Use intake-driven pricing as the baseline, then adjust if needed.">
          <div style={{ border: "1px solid var(--accentStroke)", background: "var(--accentSoft)", borderRadius: 14, padding: 14 }}>
            <div className="smallNote">Recommended tier</div>
            <div style={{ marginTop: 8, fontWeight: 900, fontSize: 22 }}>{recommendation.tierLabel}</div>
            <div className="pDark" style={{ marginTop: 6 }}>{recommendation.displayRange}</div>
            <div className="smallNote" style={{ marginTop: 10 }}>{recommendation.summary}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn btnGhost" onClick={applyRecommendedPricing}>Use recommended pricing</button>
            {recommendation.complexityFlags.map((flag) => <span key={flag} className="pill">{flag}</span>)}
          </div>
          <TextareaField label="Onboarding summary" value={onboardingSummary} onChange={setOnboardingSummary} rows={4} />
          <TextField label="Preview URL" value={previewUrl} onChange={setPreviewUrl} />
          <TextField label="Production URL" value={productionUrl} onChange={setProductionUrl} />
          <TextareaField label="Agreement text" value={agreementText} onChange={setAgreementText} rows={10} />
        </Panel>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <Panel title="Deliverables + milestones" note="Structured editor — no JSON required.">
          <StructuredObjectListEditor label="Deliverables" items={deliverables} onChange={setDeliverables} createItem={() => makeItem("deliverable", "New deliverable")} getItemTitle={(item) => item.title || "Deliverable"} fields={[{ key: "title", label: "Title" }, { key: "status", label: "Status", type: "select", options: ["pending", "planned", "in_progress", "review", "done"] }, { key: "notes", label: "Notes", type: "textarea", rows: 3 }]} />
          <StructuredObjectListEditor label="Milestones" items={milestones} onChange={setMilestones} createItem={() => makeItem("milestone", "New milestone")} getItemTitle={(item) => item.title || "Milestone"} fields={[{ key: "title", label: "Title" }, { key: "status", label: "Status", type: "select", options: ["pending", "planned", "in_progress", "review", "done"] }, { key: "notes", label: "Notes", type: "textarea", rows: 3 }]} />
        </Panel>
        <Panel title="Approvals + assets needed" note="Client handoffs and missing materials.">
          <StructuredObjectListEditor label="Approvals" items={approvals} onChange={setApprovals} createItem={() => makeItem("approval", "New approval")} getItemTitle={(item) => item.title || "Approval"} fields={[{ key: "title", label: "Title" }, { key: "status", label: "Status", type: "select", options: ["pending", "requested", "approved", "done"] }, { key: "notes", label: "Notes", type: "textarea", rows: 3 }]} />
          <StructuredObjectListEditor label="Assets needed" items={assetsNeeded} onChange={setAssetsNeeded} createItem={() => makeItem("asset", "New asset request")} getItemTitle={(item) => item.title || "Asset"} fields={[{ key: "title", label: "Title" }, { key: "status", label: "Status", type: "select", options: ["pending", "requested", "received", "done"] }, { key: "notes", label: "Notes", type: "textarea", rows: 3 }]} />
        </Panel>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <Panel title="Tasks + issues + requests" note="Operational execution without JSON editing.">
          <StructuredObjectListEditor label="Tasks" items={tasks} onChange={setTasks} createItem={() => makeItem("task", "New task")} getItemTitle={(item) => item.title || "Task"} fields={[{ key: "title", label: "Title" }, { key: "status", label: "Status", type: "select", options: ["planned", "in_progress", "review", "done"] }, { key: "notes", label: "Notes", type: "textarea", rows: 3 }]} />
          <StructuredObjectListEditor label="Issues" items={issues} onChange={setIssues} createItem={() => makeItem("issue", "New issue")} getItemTitle={(item) => item.title || "Issue"} fields={[{ key: "title", label: "Title" }, { key: "status", label: "Status", type: "select", options: ["open", "investigating", "blocked", "resolved"] }, { key: "notes", label: "Notes", type: "textarea", rows: 3 }]} />
          <StructuredObjectListEditor label="Requests" items={requests} onChange={setRequests} createItem={() => makeItem("request", "New request")} getItemTitle={(item) => item.title || "Request"} fields={[{ key: "title", label: "Title" }, { key: "status", label: "Status", type: "select", options: ["pending", "review", "approved", "done"] }, { key: "notes", label: "Notes", type: "textarea", rows: 3 }]} />
        </Panel>
        <Panel title="Metrics + plans" note="Structured reporting and recurring work.">
          <StructuredObjectListEditor label="Metrics" items={metrics} onChange={setMetrics} createItem={makeMetric} getItemTitle={(item) => item.label || "Metric"} fields={[{ key: "label", label: "Metric" }, { key: "value", label: "Current value" }, { key: "target", label: "Target" }, { key: "notes", label: "Notes", type: "textarea", rows: 3 }]} />
          <StructuredStringListEditor label="Next actions" items={nextActions} onChange={setNextActions} addLabel="Add next action" />
          <StructuredStringListEditor label="Monthly plan" items={monthlyPlan} onChange={setMonthlyPlan} addLabel="Add monthly plan item" />
        </Panel>
      </div>
    </main>
  );
}

function Panel({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return <div className="panel"><div className="panelHeader"><div>{title}</div><div className="smallNote">{note}</div></div><div className="panelBody" style={{ display: "grid", gap: 12 }}>{children}</div></div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="panel" style={{ background: "var(--panel2)" }}><div className="panelBody"><div className="smallNote">{label}</div><div style={{ marginTop: 8, fontWeight: 900, fontSize: 20, lineHeight: 1.2 }}>{value}</div></div></div>;
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <div><div className="fieldLabel">{label}</div><select className="select" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{pretty(option)}</option>)}</select></div>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><div className="fieldLabel">{label}</div><input className="input" value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}

function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return <div><div className="fieldLabel">{label}</div><input className="input" type="number" min={0} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} /></div>;
}

function TextareaField({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <div><div className="fieldLabel">{label}</div><textarea className="input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} style={{ resize: "vertical", width: "100%", minHeight: rows * 22 }} /></div>;
}
