import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { analyzeClientMessage, buildReplySuggestion } from "@/lib/ghost/message";
import { getGhostProjectSnapshot } from "@/lib/ghost/snapshot";
import { ensureGhostSession, type GhostSessionLane } from "@/lib/ghost/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { enforceAdminRateLimit } from "@/lib/routeAuth";
import type { GhostLane } from "@/lib/ghost/types";

export const dynamic = "force-dynamic";

type HistoryRole = "client" | "admin" | "system";

type HistoryItem = {
  role: HistoryRole;
  text: string;
  createdAt?: string | null;
};

function normalizeLane(value: string): GhostSessionLane {
  // Accept legacy "ops" and canonical "automation"; anything else falls
  // through to the global lane.
  if (
    value === "website" ||
    value === "ops" ||
    value === "automation" ||
    value === "ecommerce" ||
    value === "global"
  ) {
    return value;
  }
  return "global";
}

function isProjectLane(value: GhostSessionLane): value is GhostLane {
  return (
    value === "website" ||
    value === "ops" ||
    value === "automation" ||
    value === "ecommerce"
  );
}

function normalizeHistory(input: unknown): HistoryItem[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      const role =
        item?.role === "admin" || item?.role === "system" || item?.role === "client"
          ? item.role
          : "client";

      return {
        role,
        text: String(item?.text || "").trim(),
        createdAt: item?.createdAt ? String(item.createdAt) : null,
      };
    })
    .filter((item) => item.text)
    .slice(-12);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // Rate-limit AI calls. Ghost endpoints invoke OpenAI on every request,
  // so a compromised admin token (or a stuck client polling loop) could
  // burn through token budget fast. 20/min/IP is well above legitimate
  // admin chat cadence (~1-2 messages/min during active use).
  const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "ghost-message", limit: 20 });
  if (rlErr) return rlErr;

  const body = await req.json();
  const message = String(body.message || "").trim();
  const lane = normalizeLane(String(body.lane || "").trim());
  const projectId = String(body.projectId || "").trim() || null;
  const threadId = String(body.threadId || "").trim() || null;
  const sessionId = String(body.sessionId || "").trim() || null;
  const history = normalizeHistory(body.history);

  if (!message) {
    return NextResponse.json({ ok: false, error: "message is required" }, { status: 400 });
  }

  const snapshot =
    isProjectLane(lane) && projectId ? await getGhostProjectSnapshot(lane, projectId) : null;

  const session = await ensureGhostSession({
    lane,
    projectId,
    sessionId,
    adminUserId: user.id,
    sessionLabel: threadId
      ? `Message thread: ${lane}:${projectId || "none"}:${threadId}`
      : `Message analysis: ${lane}:${projectId || "none"}`,
  });

  const analysis = analyzeClientMessage(message, {
    lane,
    projectId,
    threadId,
    history,
    snapshot,
  });

  const suggestion = buildReplySuggestion(message, analysis, {
    lane,
    projectId,
    threadId,
    history,
    snapshot,
  });

  const { data: analysisRow } = await supabaseAdmin
    .from("ghost_message_analysis")
    .insert({
      session_id: session?.id || null,
      lane,
      project_id: projectId,
      source_message_text: message,
      category_label: analysis.categoryLabel,
      sentiment_label: analysis.sentimentLabel,
      urgency_label: analysis.urgencyLabel,
      risk_label: analysis.riskLabel,
      what_client_is_really_asking: analysis.whatClientIsReallyAsking,
      coaching_json: {
        ...analysis.coachingJson,
        threadId,
        historyCount: history.length,
        linkedSnapshot: snapshot
          ? {
              lane: snapshot.lane,
              status: snapshot.status,
              healthState: snapshot.healthState,
              waitingOn: snapshot.waitingOn,
              nextActionTitle: snapshot.nextActionTitle,
            }
          : null,
      },
    })
    .select("id")
    .maybeSingle();

  await supabaseAdmin.from("ghost_reply_suggestions").insert({
    message_analysis_id: analysisRow?.id || null,
    default_reply: suggestion.defaultReply,
    variants_json: suggestion.variants,
    why_this_works: suggestion.whyThisWorks,
    caution_text: suggestion.cautionText,
    next_action_text: suggestion.nextActionText,
  });

  if (analysis.riskLabel === "high") {
    await supabaseAdmin.from("ghost_guardrail_events").insert({
      session_id: session?.id || null,
      lane,
      project_id: projectId,
      event_type: "message_risk",
      severity: "high",
      event_text: suggestion.cautionText,
      event_json: {
        category: analysis.categoryLabel,
        threadId,
        historyCount: history.length,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    analysis,
    suggestion,
    snapshot,
    sessionId: session?.id || null,
  });
}