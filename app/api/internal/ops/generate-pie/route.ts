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
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Could not parse request body." }, { status: 400 });

    const opsIntakeId = String(body.opsIntakeId ?? "").trim();
    if (!opsIntakeId || !isUuid(opsIntakeId)) return NextResponse.json({ ok: false, error: "Invalid or missing opsIntakeId." }, { status: 400 });

    const { data: intake, error: intakeError } = await supabaseAdmin
      .from("ops_intakes")
      .select("*")
      .eq("id", opsIntakeId)
      .single();

    if (intakeError || !intake) return NextResponse.json({ ok: false, error: "Ops intake not found in database." }, { status: 404 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: "Server configuration missing OpenAI key." }, { status: 500 });

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

    // FIX 1: Reverted "by_phase" keys to match Web schema so PieAdminReport.tsx doesn't crash
    const prompt = `
You are CrecyStudio PIE (Project Intake Engine), an expert Business Systems and Workflow Automation Architect.
Analyze the client intake data for an Operations project.
Return STRICT JSON ONLY. No markdown.

Use this EXACT JSON schema:
{
  "version": "1.0",
  "overview": { "tier": "Growth", "headline": "Short title", "summary": "2 sentence summary", "quoted_price": 2000, "fit": "Good" },
  "pricing_guardrail": { "hourly_rate_used": 60, "cost_at_hourly": 1800, "quoted_price": 2000, "pricing_position": "Fair", "recommended_range": { "min": 1500, "max": 3000 }, "delta": 200, "tier_range_check": { "tier": "Growth", "public_min": 1500, "public_max": 3500, "within_public_range": true } },
  "complexity": { "level": "Medium", "score_100": 85, "drivers": ["Legacy software integration"] },
  "hours": { "total_hours": 30, "by_phase": { "design": 5, "development": 20, "admin": 5 }, "assumptions": ["API access is available"] },
  "timeline": { "part_time_weeks": 3, "full_time_weeks": 1 },
  "platform_recommendation": { "recommended": "Make.com", "why": ["Handles complex routing better"], "caution": ["High operation count risk"] },
  "questions_to_ask": ["How is data currently entered?"],
  "risks": ["API rate limits"],
  "scope_tradeoffs": ["Cut Slack alerts to save time"],
  "ai_insights": { "executive_summary": "Deep dive note", "client_psychology": "Readiness analysis", "hidden_risks": ["Trap warnings"], "upsell_opportunities": ["Maintenance retainer"], "call_strategy": ["Pitch time savings ROI"] },
  "call_strategy": { "emphasize": ["Reduce manual entry", "Eliminate errors"] }
}

Client Data:
${JSON.stringify(pieInput)}
`;

    let oaiRes;
    try {
      oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt }], temperature: 0.2 }),
      });
    } catch (fetchErr: any) {
      return NextResponse.json({ ok: false, error: "Network error connecting to OpenAI AI." }, { status: 500 });
    }

    if (!oaiRes.ok) {
      const oaiError = await oaiRes.json().catch(() => ({}));
      return NextResponse.json({ ok: false, error: \`AI Service Error: \${oaiError?.error?.message || oaiRes.statusText}\` }, { status: 500 });
    }

    const oaiJson = await oaiRes.json();
    const responseText = oaiJson.choices?.[0]?.message?.content || "";
    
    const parsedData = extractJsonFromText(responseText);
    if (!parsedData) {
      return NextResponse.json({ ok: false, error: "AI returned malformed data. Please try generating again." }, { status: 500 });
    }

    // FIX 2: Added 'generator' and 'model' to populate the Ops UI card correctly
    const { data: pieRow, error: pErr } = await supabaseAdmin
      .from("ops_pie_reports")
      .insert({
        ops_intake_id: opsIntakeId,
        score: parsedData.complexity?.score_100 || null,
        tier: parsedData.overview?.tier || null,
        summary: parsedData.overview?.summary || "Analysis complete.",
        report_json: parsedData,
        input: pieInput,
        status: "generated",
        generator: "system",
        model: "gpt-4o"
      })
      .select("id")
      .single();

    if (pErr) return NextResponse.json({ ok: false, error: "Failed to save PIE report to database." }, { status: 500 });

    await supabaseAdmin.from("ops_intakes").update({ status: "analyzed" }).eq("id", opsIntakeId);

    return NextResponse.json({ ok: true, reportId: pieRow.id });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: "An unexpected server error occurred." }, { status: 500 });
  }
}
