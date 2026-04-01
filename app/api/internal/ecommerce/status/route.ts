import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  isEcommerceCallStatus,
  isEcommerceIntakeStatus,
  isEcommerceQuoteStatus,
  normalizeStatus,
} from "@/lib/ecommerce/status";
import { getEcommerceWorkspaceBundle, saveEcommerceWorkspaceState } from "@/lib/ecommerce/workspace";

export const dynamic = "force-dynamic";

function derivePhase(input: {
  intakeStatus: string;
  callStatus: string;
  quoteStatus: string;
  currentPhase: string;
  mode: string;
}) {
  if (input.intakeStatus === "completed") return "completed";
  if (input.intakeStatus === "in_progress") {
    return input.mode === "run" ? "operations" : "building";
  }
  if (input.quoteStatus === "accepted") {
    return input.mode === "run" ? "onboarding" : "build_ready";
  }
  if (input.quoteStatus === "sent" || input.quoteStatus === "review") return "proposal_review";
  if (["scheduled", "reviewing", "completed"].includes(input.callStatus)) return "discovery";
  return input.currentPhase || "intake";
}

function deriveWaitingOn(input: {
  intakeStatus: string;
  callStatus: string;
  quoteStatus: string;
  currentWaitingOn: string;
  mode: string;
}) {
  if (input.intakeStatus === "completed") return "Project closed";
  if (input.intakeStatus === "in_progress") {
    return input.mode === "run" ? "Monthly execution" : "CrecyStudio delivery";
  }
  if (input.quoteStatus === "accepted") {
    return input.mode === "run" ? "Onboarding inputs" : "Kickoff approval";
  }
  if (input.quoteStatus === "sent" || input.quoteStatus === "review") return "Client proposal review";
  if (["scheduled", "reviewing"].includes(input.callStatus)) return "Planning call completion";
  return input.currentWaitingOn || "CrecyStudio intake review";
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const ecomIntakeId = String(body.ecomIntakeId || "").trim();
    const intakeStatus = normalizeStatus(body.intakeStatus, "");
    const callStatus = normalizeStatus(body.callStatus, "");
    const quoteStatus = normalizeStatus(body.quoteStatus, "");

    if (!ecomIntakeId) {
      return NextResponse.json({ ok: false, error: "ecomIntakeId is required" }, { status: 400 });
    }

    if (!intakeStatus && !callStatus && !quoteStatus) {
      return NextResponse.json({ ok: false, error: "No status updates provided" }, { status: 400 });
    }

    if (intakeStatus && !isEcommerceIntakeStatus(intakeStatus)) {
      return NextResponse.json({ ok: false, error: "Invalid intake status" }, { status: 400 });
    }

    if (callStatus && !isEcommerceCallStatus(callStatus)) {
      return NextResponse.json({ ok: false, error: "Invalid call status" }, { status: 400 });
    }

    if (quoteStatus && !isEcommerceQuoteStatus(quoteStatus)) {
      return NextResponse.json({ ok: false, error: "Invalid quote status" }, { status: 400 });
    }

    if (intakeStatus) {
      const { error } = await supabaseAdmin
        .from("ecom_intakes")
        .update({ status: intakeStatus, updated_at: new Date().toISOString() })
        .eq("id", ecomIntakeId);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (callStatus) {
      const { data: latestCall, error: callErr } = await supabaseAdmin
        .from("ecom_call_requests")
        .select("id")
        .eq("ecom_intake_id", ecomIntakeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string }>();

      if (callErr) return NextResponse.json({ ok: false, error: callErr.message }, { status: 500 });
      if (latestCall?.id) {
        const { error } = await supabaseAdmin
          .from("ecom_call_requests")
          .update({ status: callStatus, updated_at: new Date().toISOString() })
          .eq("id", latestCall.id);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
    }

    if (quoteStatus) {
      const { data: latestQuote, error: qErr } = await supabaseAdmin
        .from("ecom_quotes")
        .select("id")
        .eq("ecom_intake_id", ecomIntakeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string }>();

      if (qErr) return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });
      if (latestQuote?.id) {
        const { error } = await supabaseAdmin
          .from("ecom_quotes")
          .update({ status: quoteStatus, updated_at: new Date().toISOString() })
          .eq("id", latestQuote.id);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
    }

    const bundle = await getEcommerceWorkspaceBundle(ecomIntakeId, { isAdmin: true });
    if (bundle) {
      await saveEcommerceWorkspaceState({
        ecomIntakeId,
        savedBy: "admin",
        patch: {
          phase: derivePhase({
            intakeStatus: intakeStatus || String(bundle.intake.status || ""),
            callStatus: callStatus || String(bundle.call?.status || ""),
            quoteStatus: quoteStatus || String(bundle.quote?.status || ""),
            currentPhase: bundle.workspace.phase,
            mode: bundle.workspace.mode,
          }),
          waitingOn: deriveWaitingOn({
            intakeStatus: intakeStatus || String(bundle.intake.status || ""),
            callStatus: callStatus || String(bundle.call?.status || ""),
            quoteStatus: quoteStatus || String(bundle.quote?.status || ""),
            currentWaitingOn: bundle.workspace.waitingOn,
            mode: bundle.workspace.mode,
          }),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
