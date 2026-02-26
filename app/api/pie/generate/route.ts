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

    const prompt = `
You are CrecyStudio PIE (Project Intake Engine), an expert software agency project manager.
Analyze the following client intake data for a website project.
Return STRICT JSON ONLY. No markdown, no conversational text.

Required JSON shape:
{
  "summary": "A 2-3 sentence executive summary of the project and the client's needs.",
  "recommended_tier": "Essential | Growth | Premium",
  "lead_score": 85, 
  "confidence": 0.9, 
  "pricing_guardrail": {
    "quoted_price": 1500,
    "recommended_range": { "min": 1200, "max": 2000 }
  },
  "risks": [
    "List of 2-3 potential scope creep risks or blockers"
  ],
  "call_strategy": {
    "emphasize": ["What 2-3 things should the sales rep focus on during the discovery call?"]
  }
}

Client Data:
${JSON.stringify(pieInput)}
`;

    const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o", 
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!oaiRes.ok) {
      return NextResponse.json({ ok: false, error: "OpenAI API failed" }, { status: 500 });
    }

    const oaiJson = await oaiRes.json();
    const responseText = oaiJson.choices?.[0]?.message?.content || "";
    const parsedData = extractJsonFromText(responseText);

    if (!parsedData) {
      return NextResponse.json({ ok: false, error: "OpenAI returned invalid JSON" }, { status: 500 });
    }

    const { data: pieRow, error: pErr } = await supabaseAdmin
      .from("pie_reports")
      .insert({
        quote_id: quoteId,
        score: parsedData.lead_score || null,
        tier: parsedData.recommended_tier || null,
        summary: parsedData.summary || "Analysis complete.",
        report_json: parsedData,
        input: pieInput,
      })
      .select("id")
      .single();

    if (pErr || !pieRow) {
      return NextResponse.json({ ok: false, error: "Failed to save PIE report to database" }, { status: 500 });
    }

    await supabaseAdmin
      .from("quotes")
      .update({ latest_pie_report_id: pieRow.id })
      .eq("id", quoteId);

    return NextResponse.json({ ok: true, pieReportId: pieRow.id });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Server Error" }, { status: 500 });
  }
}
