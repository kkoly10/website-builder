import { NextResponse } from "next/server";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";

type RequestBody = {
  businessName: string;
  industry: string;
  goal: string;
  tone: string;
};

function buildPrompt(input: RequestBody) {
  return `
Create website copy for a small business website.

Business name: ${input.businessName}
Industry: ${input.industry}
Primary goal: ${input.goal}
Tone: ${input.tone}

Return ONLY valid JSON with this exact shape:
{
  "businessName": string,
  "industry": string,
  "goal": string,
  "tone": string,
  "heroHeadline": string,
  "heroSubheadline": string,
  "about": string,
  "services": string[],
  "ctaHeadline": string,
  "ctaButton": string
}

Rules:
- Keep it concise and professional.
- Services should be 4–6 bullet items.
- No markdown, no extra keys, no commentary.
`.trim();
}

function extractTextFromResponsesAPI(json: any): string {
  try {
    const output = json?.output || [];
    for (const item of output) {
      const content = item?.content || [];
      for (const c of content) {
        if (typeof c?.text === "string") return c.text;
        if (typeof c?.content === "string") return c.content;
      }
    }
  } catch {
    // ignore
  }
  if (typeof json?.text === "string") return json.text;
  return "";
}

export async function POST(req: Request) {
  try {
    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({ key: `ai-generate:${ip}`, limit: 5, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY environment variable." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as RequestBody;

    if (!body.businessName || !body.industry || !body.goal) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(body);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: prompt,
        text: { format: { type: "json_object" } },
        max_output_tokens: 900,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ai/generate] OpenAI API error:", errText);
      return NextResponse.json(
        { error: "AI generation failed. Please try again." },
        { status: 500 }
      );
    }

    const json = await response.json();
    const text = extractTextFromResponsesAPI(json);

    if (!text) {
      return NextResponse.json(
        { error: "No text returned from OpenAI." },
        { status: 500 }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse JSON from OpenAI output.", raw: text },
        { status: 500 }
      );
    }

    const draft = {
      businessName: parsed.businessName ?? body.businessName,
      industry: parsed.industry ?? body.industry,
      goal: parsed.goal ?? body.goal,
      tone: parsed.tone ?? body.tone,
      heroHeadline: parsed.heroHeadline ?? "",
      heroSubheadline: parsed.heroSubheadline ?? "",
      about: parsed.about ?? "",
      services: Array.isArray(parsed.services) ? parsed.services : [],
      ctaHeadline: parsed.ctaHeadline ?? "",
      ctaButton: parsed.ctaButton ?? "",
    };

    return NextResponse.json(draft);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error." },
      { status: 500 }
    );
  }
}
