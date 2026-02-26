import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function extractJsonFromText(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const opsIntakeId = String(body.opsIntakeId ?? "").trim();
    
    if (!opsIntakeId || !isUuid(opsIntakeId)) {
      return NextResponse.json({ ok: false, error: "Invalid or missing opsIntakeId" }, { status: 400 });
    }

    const { data: intake, error: intakeError } = await supabaseAdmin
      .from("ops_intakes")
      .select("*")
      .eq("id", opsIntakeId)
      .single();

    if (intakeError || !intake) {
      return NextResponse.json({ ok: false, error: "Ops intake not found" }, { status: 404 });
    }

    const pieInput = {
      businessName: intake.company_name,
      contactName: intake.contact_name,
      industry: intake.industry,
      teamSize: intake.team_size,
      currentTools: intake.current_tools,
      painPoints: intake.pain_points,
      workflowsNeeded: intake.workflows_needed,
      budgetRange: intake.recommendation_price_range,
      urgency: intake.urgency,
      notes: intake.notes,
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });

    const prompt = `
You are CrecyStudio PIE (Project Intake Engine), an expert Business Systems and Workflow Automation Architect.
Analyze the client intake data for an Operations project.
Return STRICT JSON ONLY. No markdown, no conversational text.

You MUST use this EXACT JSON schema:
{
  "version": "1.0",
  "overview": {
    "tier": "Essential | Growth | Premium",
    "headline": "A short, punchy title for this automation project",
    "summary": "A 2-3 sentence executive summary of their operational bottlenecks and proposed solution",
    "quoted_price": 2000,
    "fit": "Great | Good | Risky"
  },
  "pricing_guardrail": {
    "hourly_rate_used": 60,
    "cost_at_hourly": 1800,
    "quoted_price": 2000,
    "pricing_position": "Underpriced | Fair | Premium",
    "recommended_range": { "min": 1500, "max": 3000 },
    "delta": 200,
    "tier_range_check": { "tier": "Growth", "public_min": 1500, "public_max": 3500, "within_public_range": true }
  },
  "complexity": {
    "level": "Low | Medium | High",
    "score_100": 85,
    "drivers": ["List of factors making this complex (e.g. legacy software, bad APIs)"]
  },
  "hours": {
    "total_hours": 30,
    "by_phase": { "design": 5, "development": 20, "admin": 5 },
    "assumptions": ["list", "of", "assumptions"]
  },
  "timeline": {
    "part_time_weeks": 3,
    "full_time_weeks": 1
  },
  "platform_recommendation": {
    "recommended": "Zapier | Make.com | Airtable | Custom API",
    "why": ["reasons"],
    "caution": ["API limits, data silos, adoption pushback"]
  },
  "questions_to_ask": ["Discovery call questions about their operations"],
  "risks": ["Scope creep risks"],
  "scope_tradeoffs": ["Workflows to cut if budget is tight"],
  "ai_insights": {
    "executive_summary": "Deep dive note on operational efficiency",
    "client_psychology": "Analysis of their readiness for change management",
    "hidden_risks": ["hidden traps in their current tools"],
    "upsell_opportunities": ["ongoing maintenance retainer, more workflows"],
    "call_strategy": ["how to pitch the ROI of time saved"]
  },
  "call_strategy": {
    "emphasize": ["2-3 short bullet points to emphasize on the call"]
  }
}

Client Data:
${JSON.stringify(pieInput)}
`;

    const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt }], temperature: 0.2 }),
    });

    if (!oaiRes.ok) return NextResponse.json({ ok: false, error: "OpenAI API failed" }, { status: 500 });

    const oaiJson = await oaiRes.json();
    const responseText = oaiJson.choices?.[0]?.message?.content || "";
    const parsedData = extractJsonFromText(responseText);

    if (!parsedData) return NextResponse.json({ ok: false, error: "OpenAI returned invalid JSON" }, { status: 500 });

    const { data: pieRow, error: pErr } = await supabaseAdmin
      .from("ops_pie_reports")
      .insert({
        ops_intake_id: opsIntakeId,
        score: parsedData.complexity?.score_100 || null,
        tier: parsedData.overview?.tier || null,
        summary: parsedData.overview?.summary || "Analysis complete.",
        report_json: parsedData,
        input: pieInput,
        status: "generated"
      })
      .select("id")
      .single();

    if (pErr || !pieRow) return NextResponse.json({ ok: false, error: "Database insert failed" }, { status: 500 });

    await supabaseAdmin.from("ops_intakes").update({ status: "analyzed" }).eq("id", opsIntakeId);

    return NextResponse.json({ ok: true, reportId: pieRow.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Server Error" }, { status: 500 });
  }
}
