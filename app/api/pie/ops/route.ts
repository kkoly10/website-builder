// app/api/pie/ops/route.ts

import { NextRequest, NextResponse } from "next/server";
import { generatePieOpsReport } from "@/lib/pie/ops-agent";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { requireAdminRoute } from "@/lib/routeAuth";

export const dynamic = "force-dynamic";

type RequestBody = {
  intake?: Record<string, unknown>;
  previousResponseId?: string;
};

export async function POST(req: NextRequest) {
  try {
    // /pie-lab is the only legitimate caller and is admin-gated by its
    // layout — the route itself must enforce the same gate so direct
    // POSTs can't burn OpenAI tokens anonymously.
    const authErr = await requireAdminRoute();
    if (authErr) return authErr;

    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({ key: `pie-ops:${ip}`, limit: 5, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const body = (await req.json()) as RequestBody;

    if (!body?.intake || typeof body.intake !== "object") {
      return NextResponse.json(
        { ok: false, error: "Missing intake object." },
        { status: 400 }
      );
    }

    // Minimal safe coercion so your existing payload can pass through
    const intake = {
      ...body.intake,
      raw: body.intake,
    };

    const result = await generatePieOpsReport({
      intake,
      previousResponseId:
        typeof body.previousResponseId === "string" && body.previousResponseId.trim()
          ? body.previousResponseId.trim()
          : undefined,
    });

    return NextResponse.json({
      ok: true,
      responseId: result.responseId,
      model: result.model,
      report: result.report,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error generating PIE report.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}