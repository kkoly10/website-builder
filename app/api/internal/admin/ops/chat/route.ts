import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import {
  getOpsWorkspaceBundle,
  appendChatMessage,
  getWorkspaceState,
  type ChatMessage,
} from "@/lib/opsWorkspace/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildSystemPrompt(bundle: Awaited<ReturnType<typeof getOpsWorkspaceBundle>>) {
  if (!bundle) return "You are Ghost Admin, an operations advisor.";

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
- PIE summary: ${bundle.pie.summary}

Give concise, actionable advice. Focus on what to automate first, which tools to use, and how to reduce manual work. Keep answers under 200 words unless asked for detail.`;
}

async function callOpenAI(systemPrompt: string, messages: { role: string; content: string }[]): Promise<string> {
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
          ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "Unknown error");
      console.error("Ghost Admin OpenAI error:", errText);
      return generateStructuredFallback(messages[messages.length - 1]?.content || "");
    }

    const json = await resp.json();
    return json.choices?.[0]?.message?.content || generateStructuredFallback("");
  } catch (err) {
    console.error("Ghost Admin fetch error:", err);
    return generateStructuredFallback(messages[messages.length - 1]?.content || "");
  }
}

function generateStructuredFallback(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("automate") || lower.includes("first")) {
    return "Start with the highest-pain, lowest-complexity workflow. Map the current steps, identify the manual handoff, and build a single trigger-action automation. Validate with 10 real records before scaling.";
  }
  if (lower.includes("tool") || lower.includes("zapier") || lower.includes("make")) {
    return "Choose the tool based on complexity: Zapier for simple trigger-action flows (under 5 steps), Make for multi-branch logic or data transforms, and custom code only when you need database writes or complex conditionals. Start with a free tier proof-of-concept.";
  }
  if (lower.includes("sop") || lower.includes("process")) {
    return "Write the SOP in three sections: (1) Trigger — what starts the workflow, (2) Steps — each action with owner and tool, (3) Exceptions — what happens when something breaks. Keep it under one page and test it with a team member who wasn't involved in building it.";
  }
  if (lower.includes("risk") || lower.includes("edge case")) {
    return "The biggest risks are usually: (1) data living in two places, (2) no fallback when automation fails, and (3) skipping the human-approval checkpoint. Address these three before going live.";
  }

  return "I'd recommend reviewing the discovery snapshot and diagnosis tabs first, then focusing on the highest-priority backlog item. If you need specific guidance, ask me about automation sequencing, tool selection, SOP writing, or risk mitigation.";
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const opsIntakeId = String(body.opsIntakeId || "").trim();
    const userContent = String(body.message || "").trim();

    if (!opsIntakeId || !userContent) {
      return NextResponse.json(
        { ok: false, error: "Missing opsIntakeId or message" },
        { status: 400 }
      );
    }

    const [bundle, wsState] = await Promise.all([
      getOpsWorkspaceBundle(opsIntakeId),
      getWorkspaceState(opsIntakeId),
    ]);

    const existingMessages = (wsState.chatMessages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: userContent,
      timestamp: new Date().toISOString(),
    };

    const systemPrompt = buildSystemPrompt(bundle);
    const allMessages = [...existingMessages, { role: "user", content: userContent }];
    const assistantContent = await callOpenAI(systemPrompt, allMessages);

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

  const wsState = await getWorkspaceState(opsIntakeId);
  return NextResponse.json({ ok: true, messages: wsState.chatMessages ?? [] });
}
