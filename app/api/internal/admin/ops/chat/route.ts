import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import { getOpsWorkspaceBundle } from "@/lib/opsWorkspace/server";
import type { EnrichedOpsWorkspaceBundle, ChatMessage } from "@/lib/opsWorkspace/state";
import {
  appendChatMessage,
  enrichOpsBundle,
  getWorkspaceState,
} from "@/lib/opsWorkspace/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildSystemPrompt(bundle: EnrichedOpsWorkspaceBundle) {
  return `You are Ghost Admin, an operations advisor for CrecyStudio.
You are advising on the ops project for "${bundle.intake.companyName}".

Context:
- Industry: ${bundle.intake.industry}
- Pain points: ${bundle.intake.painPoints.join(", ") || "Not specified"}
- Workflows needed: ${bundle.intake.workflowsNeeded.join(", ") || "Not specified"}
- Current tools: ${bundle.intake.currentTools.join(", ") || "None listed"}
- Urgency: ${bundle.intake.urgency}
- Readiness: ${bundle.intake.readiness}
- Best tool recommendation: ${bundle.ghostAdmin.bestTool}
- Automation readiness: ${bundle.ghostAdmin.automationReadiness}
- Risk level: ${bundle.ghostAdmin.riskLevel}
- Business objective: ${bundle.ghostAdmin.businessObjective}
- Main bottleneck: ${bundle.ghostAdmin.mainBottleneck}
- Root cause: ${bundle.ghostAdmin.rootCause}
- Best first fix: ${bundle.ghostAdmin.bestFirstFix}
- Current phase: ${bundle.workspace.phase}
- Waiting on: ${bundle.workspace.waitingOn}
- Public note: ${bundle.workspace.adminPublicNote || "None"}
- Internal diagnosis note: ${bundle.workspace.internalDiagnosisNote || "None"}
- Next actions: ${bundle.workspace.nextActions.join(", ") || "None"}
- PIE summary: ${bundle.pie.summary}

Give concise, actionable advice.
Focus on what to automate first, which tools to use, how to reduce manual work, and how to protect against failures.
Keep answers under 220 words unless asked for detail.`;
}

async function callOpenAI(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return generateStructuredFallback(messages[messages.length - 1]?.content || "");
  }

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPS_CHAT_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 500,
        temperature: 0.6,
      }),
    });

    if (!resp.ok) {
      return generateStructuredFallback(messages[messages.length - 1]?.content || "");
    }

    const json = await resp.json();
    return json.choices?.[0]?.message?.content || generateStructuredFallback("");
  } catch {
    return generateStructuredFallback(messages[messages.length - 1]?.content || "");
  }
}

function generateStructuredFallback(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("automate") || lower.includes("first")) {
    return "Start with the highest-pain, lowest-complexity workflow. Pick one trigger, one destination, and one clear success condition. Validate with test data before adding branches or escalations.";
  }

  if (lower.includes("tool") || lower.includes("zapier") || lower.includes("make")) {
    return "Use Zapier for straightforward trigger to action flows. Use Make when the workflow has branching, formatting, or state transitions. Use custom code only if you need database writes or logic that automation tools handle poorly.";
  }

  if (lower.includes("sop") || lower.includes("process")) {
    return "Write the SOP in four parts: trigger, steps, exceptions, and success check. Keep it short enough that someone new can run it without asking for clarification.";
  }

  if (lower.includes("risk") || lower.includes("edge case") || lower.includes("fail")) {
    return "The biggest ops risks are duplicate records, missing required fields, and no fallback when automation fails. Add a human review step for exceptions and test duplicate submissions before launch.";
  }

  return "Review the diagnosis, workflow map, and backlog together. Then decide the first automation based on pain, simplicity, and the amount of client access already available.";
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const opsIntakeId = String(body?.opsIntakeId || "").trim();
    const userContent = String(body?.message || "").trim();

    if (!opsIntakeId || !userContent) {
      return NextResponse.json(
        { ok: false, error: "Missing opsIntakeId or message" },
        { status: 400 }
      );
    }

    const [bundle, state] = await Promise.all([
      getOpsWorkspaceBundle(opsIntakeId),
      getWorkspaceState(opsIntakeId),
    ]);

    if (!bundle) {
      return NextResponse.json({ ok: false, error: "Ops project not found." }, { status: 404 });
    }

    const enriched = enrichOpsBundle(bundle, state);
    const existingMessages = (state.chatMessages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: userContent,
      timestamp: new Date().toISOString(),
    };

    const assistantContent = await callOpenAI(
      buildSystemPrompt(enriched),
      [...existingMessages, { role: "user", content: userContent }]
    );

    const assistantMsg: ChatMessage = {
      id: makeId(),
      role: "assistant",
      content: assistantContent,
      timestamp: new Date().toISOString(),
    };

    await appendChatMessage(opsIntakeId, userMsg);
    await appendChatMessage(opsIntakeId, assistantMsg);

    return NextResponse.json({
      ok: true,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const opsIntakeId = req.nextUrl.searchParams.get("opsIntakeId");
  if (!opsIntakeId) {
    return NextResponse.json({ ok: false, error: "Missing opsIntakeId" }, { status: 400 });
  }

  const state = await getWorkspaceState(opsIntakeId);
  return NextResponse.json({ ok: true, messages: state.chatMessages ?? [] });
}