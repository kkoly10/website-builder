import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// CRITICAL FIX: Forces Vercel to allow up to 60 seconds for OpenAI to respond
export const maxDuration = 60; 
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function extractJsonFromText(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Could not parse request body." }, { status: 400 });
    
    const quoteId = body?.quoteId;
    if (!quoteId || !isUuid(quoteId)) return NextResponse.json({ ok: false, error: "Invalid or missing quoteId." }, { status: 400 });

    const { data: quote, error: qErr } = await supabaseAdmin
      .from("quotes")
      .select("*, leads(*)")
      .eq("id", quoteId)
      .single();

    if (qErr || !quote) return NextResponse.json({ ok: false, error: "Quote not found in database." }, { status: 404 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: "Server configuration missing OpenAI key." }, { status: 500 });

    const pieInput = {
      quote_details: {
        estimate_total: quote.estimate_total || quote.quote_json?.estimate?.total || 0,
        estimate_low: quote.estimate_low || quote.quote_json?.estimate?.low || 0,
        estimate_high: quote.estimate_high || quote.quote_json?.estimate?.high || 0,
        tier: quote.tier_recommended || quote.quote_json?.estimate?.tierRecommended || "unknown",
      },
      client_intake: quote.quote_json || quote.intake_normalized || {},
    };

    const prompt = `
You are CrecyStudio PIE (Project Intake Engine), an expert software agency project manager.
Analyze the client intake data for a web design project.
Return STRICT JSON ONLY. No markdown, no conversational text.

You MUST use this EXACT JSON schema:
{
  "version": "1.0",
  "overview": { "tier": "Premium", "headline": "Short title", "summary": "2 sentence summary", "quoted_price": 5000, "fit": "Good" },
  "pricing_guardrail": { "hourly_rate_used": 40, "cost_at_hourly": 4000, "quoted_price": 5000, "pricing_position": "Fair", "recommended_range": { "min": 4000, "max": 6000 }, "delta": 1000, "tier_range_check": { "tier": "Premium", "public_min": 4000, "public_max": 8000, "within_public_range": true } },
  "complexity": { "level": "Medium", "score_100": 75, "drivers": ["Integration required"] },
  "hours": { "total_hours": 100, "by_phase": { "design": 20, "development": 60, "admin": 20 }, "assumptions": ["Client copy"] },
  "timeline": { "part_time_weeks": 4, "full_time_weeks": 2 },
  "platform_recommendation": { "recommended": "Next.js", "why": ["Speed"], "caution": ["Over-engineering"] },
  "questions_to_ask": ["Brand guide?"],
  "risks": ["Scope creep"],
  "scope_tradeoffs": ["Cut animations"],
  "ai_insights": { "executive_summary": "Deep dive note", "client_psychology": "Readiness", "hidden_risks": ["Traps"], "upsell_opportunities": ["SEO"], "call_strategy": ["Pitch ROI"] },
  "call_strategy": { "emphasize": ["Speed to market"] }
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
      return NextResponse.json({ ok: false, error: `AI Service Error: ${oaiError?.error?.message || oaiRes.statusText}` }, { status: 500 });
    }

    const oaiJson = await oaiRes.json();
    const responseText = oaiJson.choices?.[0]?.message?.content || "";
    
    const parsedData = extractJsonFromText(responseText);
    if (!parsedData) {
      return NextResponse.json({ ok: false, error: "AI returned malformed data. Please try generating again." }, { status: 500 });
    }

    // FIX: Removed unverified columns (generator, model, status) to prevent Postgres crash on the Web side
    const { data: pieRow, error: pErr } = await supabaseAdmin
      .from("pie_reports")
      .insert({
        quote_id: quoteId,
        score: parsedData.complexity?.score_100 || null,
        tier: parsedData.overview?.tier || null,
        summary: parsedData.overview?.summary || "Analysis complete.",
        report_json: parsedData,
        input: pieInput
      })
      .select("id")
      .single();

    if (pErr) return NextResponse.json({ ok: false, error: `Failed to save to database: ${pErr.message}` }, { status: 500 });

    return NextResponse.json({ ok: true, pieReportId: pieRow.id });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: "An unexpected server error occurred." }, { status: 500 });
  }
}
