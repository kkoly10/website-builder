// app/api/internal/admin/proposal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeObj(v: any) {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return {};
}

function estimateHours(score: number, tier: string) {
  const t = (tier || "").toLowerCase();
  let min = 8;
  let max = 14;

  if (t === "growth") {
    min = 16;
    max = 30;
  } else if (t === "premium") {
    min = 30;
    max = 60;
  }

  if (score > 0) {
    min = Math.max(min, Math.round(score * 0.25));
    max = Math.max(max, Math.round(score * 0.5));
    if (max <= min) max = min + 4;
  }

  const weeksMin = Math.max(1, Math.round(min / 15));
  const weeksMax = Math.max(1, Math.round(max / 15));

  return {
    min,
    max,
    weeksLabel:
      weeksMin === weeksMax
        ? `${weeksMin} week${weeksMin > 1 ? "s" : ""}`
        : `${weeksMin}–${weeksMax} weeks`,
  };
}

function money(n?: number | null) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function buildRuleBasedProposal(args: {
  leadEmail: string;
  tier: string;
  quoteStatus: string;
  pie: any;
  quote: any;
  callRequest: any;
  hourlyRate: number;
}) {
  const { leadEmail, tier, pie, quote, callRequest, hourlyRate } = args;

  const score = Number(pie.score ?? 0) || 0;
  const confidence = pie.confidence || "Medium";
  const summary = pie.summary || "Scope reviewed and aligned to project needs.";
  const pricing = safeObj(pie.pricing);
  const pitch = safeObj(pie.pitch);

  const target =
    typeof pricing.target === "number"
      ? pricing.target
      : Math.round((quote.total_cents || 0) / 100);

  const minPrice =
    typeof pricing.minimum === "number"
      ? pricing.minimum
      : Math.round((quote.min_total_cents || 0) / 100);

  const upperBuffer = Array.isArray(pricing.buffers)
    ? pricing.buffers.find((b: any) =>
        String(b?.label || "").toLowerCase().includes("upper")
      )
    : null;

  const maxPrice =
    typeof upperBuffer?.amount === "number"
      ? upperBuffer.amount
      : Math.round((quote.max_total_cents || 0) / 100);

  const hours = estimateHours(score, tier || pie.tier || "");
  const laborMin = Math.round(hours.min * hourlyRate);
  const laborMax = Math.round(hours.max * hourlyRate);

  const risks = Array.isArray(pie.risks) ? pie.risks : [];
  const emphasize = Array.isArray(pitch.emphasize) ? pitch.emphasize : [];
  const objections = Array.isArray(pitch.objections) ? pitch.objections : [];

  const lines: string[] = [];

  lines.push(`Proposal Draft — ${leadEmail}`);
  lines.push("");
  lines.push(`Recommended tier: ${pie.tier || tier || "Essential"}`);
  lines.push(`PIE complexity score: ${score}/100 (${confidence} confidence)`);
  lines.push(`Estimated build time: ${hours.min}–${hours.max} hours (${hours.weeksLabel})`);
  lines.push(`Labor check @ $${hourlyRate}/hr: ${money(laborMin)}–${money(laborMax)}`);
  lines.push("");
  lines.push("Pricing recommendation");
  lines.push(`- Floor: ${money(minPrice)}`);
  lines.push(`- Target: ${money(target)}`);
  lines.push(`- Upper / buffer: ${money(maxPrice)}`);
  lines.push("");
  lines.push("Scope summary");
  lines.push(summary);

  if (emphasize.length) {
    lines.push("");
    lines.push("What to emphasize on the call");
    for (const item of emphasize) lines.push(`- ${item}`);
  }

  if (risks.length) {
    lines.push("");
    lines.push("Risks / blockers to confirm");
    for (const r of risks) lines.push(`- ${r}`);
  }

  lines.push("");
  lines.push("Discovery questions to ask next");
  lines.push("- Do they already have all website content (text, images, branding)?");
  lines.push("- Do they need booking/forms/payments or just lead capture?");
  lines.push("- Who is providing domain/hosting and do they already own the domain?");
  lines.push("- What is the real launch deadline and what is flexible?");
  lines.push("- What pages/features can be phase 2 if budget is tight?");

  if (callRequest) {
    lines.push("");
    lines.push("Call request context");
    lines.push(`- Status: ${callRequest.status || "new"}`);
    lines.push(
      `- Best time: ${
        callRequest.best_time_to_call ||
        callRequest.preferred_times ||
        "—"
      }`
    );
    lines.push(`- Timezone: ${callRequest.timezone || "—"}`);
    lines.push(`- Notes: ${callRequest.notes || "—"}`);
  }

  if (objections.length) {
    lines.push("");
    lines.push("Likely objections");
    for (const o of objections) lines.push(`- ${o}`);
  }

  lines.push("");
  lines.push("Suggested close");
  lines.push(
    `Recommend starting at ${money(target)} with a phased scope option if needed.`
  );
  lines.push(
    "Next step: confirm scope, finalize proposal, collect deposit, and request content/assets."
  );

  return lines.join("\n");
}

async function maybeGenerateWithAI(input: {
  leadEmail: string;
  tier: string;
  quote: any;
  pie: any;
  callRequest: any;
  hourlyRate: number;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.PIE_OPENAI_MODEL || "gpt-5-mini";

  const system = [
    "You are an internal proposal assistant for a web design studio.",
    "Write a clean, admin-facing proposal planning note (not customer-facing marketing fluff).",
    "Be specific and practical.",
    "Include: complexity, time estimate, pricing guidance, risks, discovery questions, and call strategy.",
    "Use concise headings and bullets.",
  ].join(" ");

  const user = JSON.stringify(
    {
      leadEmail: input.leadEmail,
      tier: input.tier,
      hourlyRate: input.hourlyRate,
      quote: input.quote,
      pie: input.pie,
      callRequest: input.callRequest,
    },
    null,
    2
  );

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("OpenAI did not return proposal text");
  }

  return { text: content, model };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const quoteId = String(body?.quoteId || "").trim();
    const hourlyRate = Number(body?.hourlyRate || 40) || 40;

    if (!quoteId) {
      return NextResponse.json(
        { ok: false, error: "quoteId is required" },
        { status: 400 }
      );
    }

    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .select(
        "id, created_at, status, tier, total_cents, min_total_cents, max_total_cents, breakdown, debug, lead_id"
      )
      .eq("id", quoteId)
      .maybeSingle();

    if (quoteError) {
      return NextResponse.json(
        { ok: false, error: quoteError.message },
        { status: 500 }
      );
    }
    if (!quote) {
      return NextResponse.json(
        { ok: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    const [{ data: lead }, { data: callRows }, { data: pieRows }] = await Promise.all([
      quote.lead_id
        ? supabaseAdmin
            .from("leads")
            .select("id, email, name")
            .eq("id", quote.lead_id)
            .maybeSingle()
        : Promise.resolve({ data: null } as any),
      supabaseAdmin
        .from("call_requests")
        .select(
          "id, quote_id, status, best_time_to_call, preferred_times, timezone, notes, created_at"
        )
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabaseAdmin
        .from("pie_reports")
        .select("id, quote_id, created_at, score, tier, confidence, report, payload")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    const callRequest = Array.isArray(callRows) ? callRows[0] : null;
    const latestPie = Array.isArray(pieRows) ? pieRows[0] : null;

    if (!latestPie) {
      return NextResponse.json(
        { ok: false, error: "No PIE report found for this quote yet." },
        { status: 400 }
      );
    }

    const pieReport = safeObj(latestPie.report);
    const piePayload = safeObj(latestPie.payload);
    const pie = Object.keys(pieReport).length ? pieReport : piePayload;

    // Ensure core fields exist for proposal generation
    pie.score = Number(latestPie.score ?? pie.score ?? 0) || 0;
    pie.tier = latestPie.tier ?? pie.tier ?? quote.tier ?? "Essential";
    pie.confidence = latestPie.confidence ?? pie.confidence ?? "Medium";

    const leadEmail = lead?.email || "lead@example.com";

    let proposalText = "";
    let mode: "rule" | "ai" = "rule";
    let aiModel: string | null = null;

    try {
      const ai = await maybeGenerateWithAI({
        leadEmail,
        tier: quote.tier || pie.tier || "Essential",
        quote,
        pie,
        callRequest,
        hourlyRate,
      });

      if (ai?.text) {
        proposalText = ai.text;
        mode = "ai";
        aiModel = ai.model;
      } else {
        proposalText = buildRuleBasedProposal({
          leadEmail,
          tier: quote.tier || pie.tier || "Essential",
          quoteStatus: quote.status || "new",
          pie,
          quote,
          callRequest,
          hourlyRate,
        });
      }
    } catch {
      // If AI fails, gracefully fall back
      proposalText = buildRuleBasedProposal({
        leadEmail,
        tier: quote.tier || pie.tier || "Essential",
        quoteStatus: quote.status || "new",
        pie,
        quote,
        callRequest,
        hourlyRate,
      });
      mode = "rule";
    }

    // Persist to quotes.debug so it shows up in admin tools
    const debug = safeObj(quote.debug);
    debug.generatedProposal = proposalText;
    debug.generatedProposalUpdatedAt = new Date().toISOString();

    await supabaseAdmin
      .from("quotes")
      .update({ debug })
      .eq("id", quoteId);

    return NextResponse.json({
      ok: true,
      mode,
      model: aiModel,
      proposalText,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}