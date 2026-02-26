import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function extractJsonFromText(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const quoteId = body?.quoteId;

    if (!quoteId || typeof quoteId !== "string" || !isUuid(quoteId)) {
      return NextResponse.json({ ok: false, error: "Invalid quoteId" }, { status: 400 });
    }

    const { data: quote, error: qErr } = await supabaseAdmin
      .from("quotes")
      .select("*, leads(email, name, phone)")
      .eq("id", quoteId)
      .single();

    if (qErr || !quote) {
      return NextResponse.json({ ok: false, error: "Quote not found" }, { status: 404 });
    }

    const pieInput = {
      quote_details: {
        estimate_total: quote.estimate_total || quote.quote_json?.estimate?.total || 0,
        estimate_low: quote.estimate_low || quote.quote_json?.estimate?.low || 0,
        estimate_high: quote.estimate_high || quote.quote_json?.estimate?.high || 0,
        tier: quote.tier_recommended || quote.quote_json?.estimate?.tierRecommended || "unknown",
      },
      client_intake: quote.quote_json || quote.intake_normalized || {},
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY in environment" }, { status: 500 });
    }

    // THE FIX: Schema perfectly balances the PieAdminReport AND the Pipeline CRM Cards
    const prompt = `
You are CrecyStudio PIE (Project Intake Engine), an expert software agency project manager.
Analyze the client intake data for a web design project.
Return STRICT JSON ONLY. No markdown, no conversational text.

You MUST use this EXACT JSON schema:
{
  "version": "1.0",
  "overview": {
    "tier": "Essential | Growth | Premium",
    "headline": "A short, punchy title for this project",
    "summary": "A 2-3 sentence executive summary",
    "quoted_price": number (the target price),
    "fit": "Great | Good | Risky"
  },
  "pricing_guardrail": {
    "hourly_rate_used": 40,
    "cost_at_hourly": number (estimated hours * 40),
    "quoted_price": number (same as overview),
    "pricing_position": "Underpriced | Fair | Premium",
    "recommended_range": { "min": number, "max": number },
    "delta": number (quoted_price - cost_at_hourly),
    "tier_range_check": { "tier": "string", "public_min": number, "public_max": number, "within_public_range": boolean }
  },
  "complexity": {
    "level": "Low | Medium | High",
    "score_100": number (0-100),
    "drivers": ["list", "of", "factors"]
  },
  "hours": {
    "total_hours": number,
    "by_phase": { "design": number, "development": number, "admin": number },
    "assumptions": ["list", "of", "assumptions"]
  },
  "timeline": {
    "part_time_weeks": number,
    "full_time_weeks": number
  },
  "platform_recommendation": {
    "recommended": "Next.js | WordPress | Shopify",
    "why": ["reasons"],
    "caution": ["watchouts"]
  },
  "questions_to_ask": ["discovery call questions"],
  "risks": ["scope creep risks"],
  "scope_tradeoffs": ["features to cut if budget is tight"],
  "ai_insights": {
    "executive_summary": "Deep dive note",
    "client_psychology": "Analysis of their readiness",
    "hidden_risks": ["hidden traps"],
    "upsell_opportunities": ["things to sell later"],
    "call_strategy": ["how to run the call"]
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
      body: JSON.stringify({
        model: "gpt-4o", 
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!oaiRes.ok) return NextResponse.json({ ok: false, error: "OpenAI API failed" }, { status: 500 });

    const oaiJson = await oaiRes.json();
    const responseText = oaiJson.choices?.[0]?.message?.content || "";
    const parsedData = extractJsonFromText(responseText);

    if (!parsedData) return NextResponse.json({ ok: false, error: "OpenAI returned invalid JSON" }, { status: 500 });

    // Safely map the nested data back to the top-level table columns
    const { data: pieRow, error: pErr } = await supabaseAdmin
      .from("pie_reports")
      .insert({
        quote_id: quoteId,
        score: parsedData.complexity?.score_100 || null,
        tier: parsedData.overview?.tier || null,
        summary: parsedData.overview?.summary || "Analysis complete.",
        report_json: parsedData,
        input: pieInput,
      })
      .select("id")
      .single();

    if (pErr || !pieRow) return NextResponse.json({ ok: false, error: "Database insert failed" }, { status: 500 });

    await supabaseAdmin.from("quotes").update({ latest_pie_report_id: pieRow.id }).eq("id", quoteId);

    return NextResponse.json({ ok: true, pieReportId: pieRow.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Server Error" }, { status: 500 });
  }
}
