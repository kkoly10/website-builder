import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute, enforceAdminRateLimit } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpsWorkspaceBundle } from "@/lib/opsWorkspace/server";
import { enrichOpsBundle, getWorkspaceState, saveWorkspaceState } from "@/lib/opsWorkspace/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStagePreset(stage: string) {
  const normalized = String(stage || "").trim().toLowerCase();
  switch (normalized) {
    case "new":
      return { pipelineStatus: "new", phase: "Intake Received", waitingOn: "CrecyStudio intake review" };
    case "discovery":
      return { pipelineStatus: "discovery", phase: "Discovery", waitingOn: "Discovery call and workflow answers" };
    case "scoping":
      return { pipelineStatus: "scoping", phase: "Process Mapping", waitingOn: "Scope confirmation" };
    case "proposal_sent":
      return { pipelineStatus: "proposal_sent", phase: "Proposal", waitingOn: "Client proposal review" };
    case "agreement_sent":
      return { pipelineStatus: "agreement_sent", phase: "Agreement", waitingOn: "Client agreement review" };
    case "agreement_accepted":
      return { pipelineStatus: "agreement_accepted", phase: "Agreement Accepted", waitingOn: "Deposit / kickoff" };
    case "deposit_sent":
      return { pipelineStatus: "deposit_sent", phase: "Deposit Sent", waitingOn: "Studio payment verification" };
    case "deposit_paid":
      return { pipelineStatus: "deposit_paid", phase: "Kickoff Ready", waitingOn: "CrecyStudio build start" };
    case "in_progress":
      return { pipelineStatus: "in_progress", phase: "In Progress", waitingOn: "CrecyStudio delivery" };
    case "process_mapping":
      return { pipelineStatus: "process_mapping", phase: "Process Mapping", waitingOn: "Process approval" };
    case "building":
      return { pipelineStatus: "building", phase: "Building", waitingOn: "CrecyStudio implementation" };
    case "testing":
      return { pipelineStatus: "testing", phase: "Testing", waitingOn: "QA and edge-case validation" };
    case "live":
      return { pipelineStatus: "live", phase: "Live", waitingOn: "Client feedback / monitoring" };
    case "retainer_active":
      return { pipelineStatus: "retainer_active", phase: "Retainer Active", waitingOn: "Monthly execution" };
    case "completed":
      return { pipelineStatus: "completed", phase: "Completed", waitingOn: "Project archived" };
    case "closed_lost":
      return { pipelineStatus: "closed_lost", phase: "Closed Lost", waitingOn: "No active follow-up" };
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;
  const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-ops-stage", limit: 30 });
  if (rlErr) return rlErr;

  try {
    const body = await req.json();
    const opsIntakeId = String(body?.opsIntakeId || "").trim();
    const stage = String(body?.stage || "").trim();
    const note = String(body?.adminPublicNote || "").trim();

    if (!opsIntakeId || !stage) {
      return NextResponse.json({ ok: false, error: "opsIntakeId and stage are required" }, { status: 400 });
    }

    const preset = getStagePreset(stage);
    if (!preset) {
      return NextResponse.json({ ok: false, error: "Invalid stage" }, { status: 400 });
    }

    const state = await getWorkspaceState(opsIntakeId);
    const patch: any = {
      ...preset,
    };

    if (note) patch.adminPublicNote = note;
    if (stage === "agreement_accepted") {
      patch.agreementStatus = "accepted";
      patch.agreementAcceptedAt = new Date().toISOString();
    }
    if (stage === "deposit_sent") {
      patch.depositNotice = note || "Client reported deposit sent.";
      patch.depositNoticeSentAt = new Date().toISOString();
    }

    const result = await saveWorkspaceState(opsIntakeId, { ...state, ...patch }, "admin");
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    await supabaseAdmin.from("ops_intakes").update({ status: preset.pipelineStatus }).eq("id", opsIntakeId);

    const [bundle, freshState] = await Promise.all([
      getOpsWorkspaceBundle(opsIntakeId),
      getWorkspaceState(opsIntakeId),
    ]);

    if (!bundle) {
      return NextResponse.json({ ok: false, error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: enrichOpsBundle(bundle, freshState) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
