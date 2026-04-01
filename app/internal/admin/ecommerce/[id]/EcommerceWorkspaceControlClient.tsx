"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

function toJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function parseArrayJson<T>(value: string, fieldLabel: string): T[] {
  if (!value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error(`${fieldLabel} must be a JSON array.`);
    return parsed as T[];
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : `${fieldLabel} is invalid JSON.`);
  }
}

function linesToList(value: string) {
  return value.split(/\n+/).map((item) => item.trim()).filter(Boolean);
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
  const [bundle, setBundle] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [intakeStatus, setIntakeStatus] = useState(String(initialData.intake.status || "new"));
  const [callStatus, setCallStatus] = useState(String(initialData.call?.status || "new"));
  const [quoteStatus, setQuoteStatus] = useState(String(initialData.quote?.status || "draft"));

  const [setupFee, setSetupFee] = useState<number | null>(initialData.quote?.estimate_setup_fee ?? null);
  const [monthlyFee, setMonthlyFee] = useState<number | null>(initialData.quote?.estimate_monthly_fee ?? null);
  const [fulfillmentModel, setFulfillmentModel] = useState(String(initialData.quote?.estimate_fulfillment_model || ""));

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

  const [deliverablesJson, setDeliverablesJson] = useState(toJson(initialData.workspace.deliverables));
  const [milestonesJson, setMilestonesJson] = useState(toJson(initialData.workspace.milestones));
  const [approvalsJson, setApprovalsJson] = useState(toJson(initialData.workspace.approvals));
  const [assetsJson, setAssetsJson] = useState(toJson(initialData.workspace.assetsNeeded));
  const [tasksJson, setTasksJson] = useState(toJson(initialData.workspace.tasks));
  const [metricsJson, setMetricsJson] = useState(toJson(initialData.workspace.metrics));
  const [issuesJson, setIssuesJson] = useState(toJson(initialData.workspace.issues));
  const [requestsJson, setRequestsJson] = useState(toJson(initialData.workspace.requests));
  const [nextActionsText, setNextActionsText] = useState(initialData.workspace.nextActions.join("\n"));
  const [monthlyPlanText, setMonthlyPlanText] = useState(initialData.workspace.monthlyPlan.join("\n"));

  const modeLabel = useMemo(() => pretty(initialData.workspace.mode), [initialData.workspace.mode]);

  async function saveAll() {
    setSaving(true);
    setMessage("");

    try {
      const deliverables = parseArrayJson<EcommerceWorkspaceItem>(deliverablesJson, "Deliverables");
      const milestones = parseArrayJson<EcommerceWorkspaceItem>(milestonesJson, "Milestones");
      const approvals = parseArrayJson<EcommerceWorkspaceItem>(approvalsJson, "Approvals");
      const assetsNeeded = parseArrayJson<EcommerceWorkspaceItem>(assetsJson, "Assets needed");
      const tasks = parseArrayJson<EcommerceWorkspaceItem>(tasksJson, "Tasks");
      const issues = parseArrayJson<EcommerceWorkspaceItem>(issuesJson, "Issues");
      const requests = parseArrayJson<EcommerceWorkspaceItem>(requestsJson, "Requests");
      const metrics = parseArrayJson<EcommerceWorkspaceMetric>(metricsJson, "Metrics");

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
            nextActions: linesToList(nextActionsText),
            monthlyPlan: linesToList(monthlyPlanText),
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

        <Panel title="Workspace details" note="What the client sees in their lane-specific workspace.">
          <TextField label="Preview URL" value={previewUrl} onChange={setPreviewUrl} />
          <TextField label="Production URL" value={productionUrl} onChange={setProductionUrl} />
          <TextareaField label="Onboarding summary" value={onboardingSummary} onChange={setOnboardingSummary} rows={4} />
          <TextareaField label="Agreement text" value={agreementText} onChange={setAgreementText} rows={10} />
        </Panel>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <Panel title="Deliverables + milestones" note="Build / run / fix commitments that should reflect client-side.">
          <TextareaField label="Deliverables JSON" value={deliverablesJson} onChange={setDeliverablesJson} rows={18} mono />
          <TextareaField label="Milestones JSON" value={milestonesJson} onChange={setMilestonesJson} rows={18} mono />
        </Panel>
        <Panel title="Approvals + assets needed" note="Client handoffs and missing items.">
          <TextareaField label="Approvals JSON" value={approvalsJson} onChange={setApprovalsJson} rows={18} mono />
          <TextareaField label="Assets needed JSON" value={assetsJson} onChange={setAssetsJson} rows={18} mono />
        </Panel>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <Panel title="Tasks + issues" note="Operational work and current blockers.">
          <TextareaField label="Tasks JSON" value={tasksJson} onChange={setTasksJson} rows={18} mono />
          <TextareaField label="Issues JSON" value={issuesJson} onChange={setIssuesJson} rows={12} mono />
          <TextareaField label="Requests JSON" value={requestsJson} onChange={setRequestsJson} rows={12} mono />
        </Panel>
        <Panel title="Metrics + monthly plan" note="Reporting and recurring execution.">
          <TextareaField label="Metrics JSON" value={metricsJson} onChange={setMetricsJson} rows={18} mono />
          <TextareaField label="Next actions" value={nextActionsText} onChange={setNextActionsText} rows={6} />
          <TextareaField label="Monthly plan" value={monthlyPlanText} onChange={setMonthlyPlanText} rows={6} />
        </Panel>
      </div>
    </main>
  );
}

function Panel({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="panelHeader">
        <div>{title}</div>
        <div className="smallNote">{note}</div>
      </div>
      <div className="panelBody" style={{ display: "grid", gap: 12 }}>{children}</div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel" style={{ background: "var(--panel2)" }}>
      <div className="panelBody">
        <div className="smallNote">{label}</div>
        <div style={{ marginTop: 8, fontWeight: 900, fontSize: 20, lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <div>
      <div className="fieldLabel">{label}</div>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option} value={option}>{pretty(option)}</option>)}
      </select>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <div className="fieldLabel">{label}</div>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return (
    <div>
      <div className="fieldLabel">{label}</div>
      <input className="input" type="number" min={0} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 4, mono = false }: { label: string; value: string; onChange: (value: string) => void; rows?: number; mono?: boolean }) {
  return (
    <div>
      <div className="fieldLabel">{label}</div>
      <textarea className="input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} style={{ resize: "vertical", width: "100%", fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined, fontSize: mono ? 12 : undefined, minHeight: rows * 22 }} />
    </div>
  );
}
