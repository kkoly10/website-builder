// lib/pie/ops-agent.ts

import {
  PIE_OPS_REPORT_SCHEMA,
  buildPieOpsSystemPrompt,
  buildPieOpsUserInput,
  type PieOpsInput,
} from "./ops-schema";

type PieOpsAgentArgs = {
  intake: PieOpsInput;
  previousResponseId?: string;
};

type ResponsesApiTextContent =
  | { type: "output_text"; text: string }
  | { type: string; [key: string]: unknown };

type ResponsesApiOutputItem = {
  type?: string;
  role?: string;
  content?: ResponsesApiTextContent[];
  [key: string]: unknown;
};

type ResponsesApiResponse = {
  id?: string;
  output?: ResponsesApiOutputItem[];
  // SDK has output_text helper, but raw REST may not.
  output_text?: string;
  error?: { message?: string };
};

function extractOutputText(data: ResponsesApiResponse): string {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const textParts: string[] = [];

  for (const item of data.output ?? []) {
    if (!Array.isArray(item.content)) continue;
    for (const c of item.content) {
      if (c && c.type === "output_text" && typeof c.text === "string") {
        textParts.push(c.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

export async function generatePieOpsReport({
  intake,
  previousResponseId,
}: PieOpsAgentArgs) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const model = process.env.PIE_MODEL || "gpt-5";

  const body: Record<string, unknown> = {
    model,
    store: false,
    input: [
      {
        role: "system",
        content: buildPieOpsSystemPrompt(),
      },
      {
        role: "user",
        content: buildPieOpsUserInput(intake),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "pie_ops_report",
        strict: true,
        schema: PIE_OPS_REPORT_SCHEMA,
      },
    },
    temperature: 0.2,
    truncation: "auto",
  };

  if (previousResponseId) {
    body.previous_response_id = previousResponseId;
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as ResponsesApiResponse;

  if (!res.ok) {
    const msg = data?.error?.message || `OpenAI request failed (${res.status})`;
    throw new Error(msg);
  }

  const text = extractOutputText(data);

  if (!text) {
    throw new Error("No text returned from OpenAI Responses API.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Model returned non-JSON output (structured output parse failed).");
  }

  return {
    responseId: data.id || null,
    report: parsed,
    rawText: text,
    model,
  };
}