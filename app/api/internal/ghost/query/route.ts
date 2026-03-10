import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { getGhostProjectSnapshot } from "@/lib/ghost/snapshot";
import { answerProjectQuestion } from "@/lib/ghost/command";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { GhostLane } from "@/lib/ghost/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const lane = String(body.lane || "") as GhostLane;
  const projectId = String(body.projectId || "").trim();
  const question = String(body.question || "").trim();

  if (!lane || !projectId || !question) {
    return NextResponse.json({ ok: false, error: "lane, projectId, and question are required" }, { status: 400 });
  }

  const snapshot = await getGhostProjectSnapshot(lane, projectId);

  const answer = answerProjectQuestion(snapshot, question);

  if (snapshot) {
    await supabaseAdmin.from("ghost_project_snapshots").insert({
      lane,
      project_id: projectId,
      phase: snapshot.phase,
      status: snapshot.status,
      health_state: snapshot.healthState,
      waiting_on: snapshot.waitingOn,
      next_action_title: snapshot.nextActionTitle,
      risk_flags: snapshot.riskFlags,
      latest_activity_summary: snapshot.latestActivitySummary,
      source_facts: snapshot.sourceFacts,
    });
  }

  if (answer.cautionRisk && answer.cautionRisk !== "No major risk flags detected." && answer.cautionRisk !== "No active risk flags right now.") {
    await supabaseAdmin.from("ghost_guardrail_events").insert({
      lane,
      project_id: projectId,
      event_type: "query_caution",
      severity: "medium",
      event_text: answer.cautionRisk,
      event_json: { question },
    });
  }

  return NextResponse.json({ ok: true, answer, snapshot });
}
