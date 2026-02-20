import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function pickJsonObject(text: string) {
  // Grab first {...} block (good enough for “JSON only” responses)
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { quoteId } = await req.json();
    if (!quoteId || typeof quoteId !== "string" || !isUuid(quoteId)) {
      return NextResponse.json({ error: "Invalid quoteId" }, { status: 400 });
    }

    // 1) Load quote
    const { data: quote, error: qErr } = await supabaseAdmin
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (qErr || !quote) {
      return NextResponse.json({ error: "Quote not found", details: qErr?.message }, { status: 404 });
    }

    // Optional: load lead + call request
    const [{ data: lead }, { data: callReq }] = await Promise.all([
      supabaseAdmin.from("leads").select("*").eq("id", quote.lead_id).maybeSingle(),
      supabaseAdmin.from("call_requests").select("*").eq("quote_id", quoteId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    // 2) Build PIE input
    const pieInput = {
      quote: {
        id: quote.id,
        created_at: quote.created_at,
        status: quote.status,
        tier_recommended: quote.tier_recommended,
        estimate_total: quote.estimate_total,
        estimate_low: quote.estimate_low,
        estimate_high: quote.estimate_high,
      },
      lead: lead ?? null,
      call_request: callReq ?? null,
      intake_normalized: quote.intake_normalized ?? null,
      scope_snapshot: quote.scope_snapshot ?? null,
      intake_raw: quote.intake_raw ?? null,
    };

    // 3) Call OpenAI (Responses API via fetch)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const prompt = `
You are CrecyStudio PIE (Project Intake Engine).
Return STRICT JSON ONLY (no markdown).
Goal: produce a sales-ready internal report for this quote.

Required JSON shape:
{
  "headline": string,
  "summary": string,
  "recommended_tier": "essential"|"growth"|"premium"|"unknown",
  "recommended_price": { "low": number|null, "mid": number|null, "high": number|null },
  "lead_score": number,            // 0-100
  "confidence": number,            // 0-1
  "risk_flags": string[],
  "scope_assumptions": string[],
  "questions_to_ask": string[],
  "next_steps": string[],
  "sales_pitch": string,
  "negotiation_options": string[]
}

Here is the quote payload:
${JSON.stringify(pieInput)}
`.trim();

    const oaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5",
        input: prompt,
        temperature: 0.2,
        max_output_tokens: 1200,
      }),
    });

    if (!oaiRes.ok) {
      const errText = await oaiRes.text();
      return NextResponse.json({ error: "OpenAI error", details: errText }, { status: 500 });
    }

    const oaiJson: any = await oaiRes.json();
    const text =
      oaiJson?.output?.[0]?.content?.map((c: any) => c?.text).filter(Boolean).join("\n") ??
      oaiJson?.output_text ??
      "";

    const parsed = pickJsonObject(text) ?? {
      headline: "PIE generated (unparsed JSON)",
      summary: "Model output could not be parsed as JSON. See payload.",
      recommended_tier: quote.tier_recommended ?? "unknown",
      recommended_price: { low: quote.estimate_low ?? null, mid: quote.estimate_total ?? null, high: quote.estimate_high ?? null },
      lead_score: 50,
      confidence: 0.4,
      risk_flags: ["parse_failed"],
      scope_assumptions: [],
      questions_to_ask: [],
      next_steps: [],
      sales_pitch: "",
      negotiation_options: [],
      _raw: text,
    };

    const reportMarkdown = [
      `# ${parsed.headline ?? "PIE Report"}`,
      ``,
      `**Summary:** ${parsed.summary ?? ""}`,
      ``,
      `**Tier:** ${parsed.recommended_tier ?? "unknown"}  |  **Score:** ${parsed.lead_score ?? "—"}/100  |  **Confidence:** ${parsed.confidence ?? "—"}`,
      ``,
      `**Price:** ${parsed.recommended_price?.low ?? "—"} - ${parsed.recommended_price?.high ?? "—"} (mid: ${parsed.recommended_price?.mid ?? "—"})`,
      ``,
      `## Risk flags`,
      ...(parsed.risk_flags?.length ? parsed.risk_flags.map((x: string) => `- ${x}`) : ["- None"]),
      ``,
      `## Next steps`,
      ...(parsed.next_steps?.length ? parsed.next_steps.map((x: string) => `- ${x}`) : ["- Follow up"]),
    ].join("\n");

    // 4) Store PIE row (IMPORTANT: set quote_id!)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(); // 180 days

    const { data: pieRow, error: pErr } = await supabaseAdmin
      .from("pie_reports")
      .insert({
        token: crypto.randomUUID(),
        project_id: "crecystudio",
        report: reportMarkdown,
        expires_at: expiresAt,
        quote_id: quoteId,
        input: pieInput,
        payload: parsed,
        score: parsed.lead_score ?? null,
        tier: parsed.recommended_tier ?? quote.tier_recommended ?? null,
        confidence: parsed.confidence ?? null,
      })
      .select("*")
      .single();

    if (pErr || !pieRow) {
      return NextResponse.json({ error: "Failed to insert pie_reports", details: pErr?.message }, { status: 500 });
    }

    // 5) Link it back to the quote
    const { error: uErr } = await supabaseAdmin
      .from("quotes")
      .update({ latest_pie_report_id: pieRow.id })
      .eq("id", quoteId);

    if (uErr) {
      return NextResponse.json({ error: "PIE saved but failed to update quote", details: uErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pieReportId: pieRow.id });
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", details: e?.message ?? String(e) }, { status: 500 });
  }
}