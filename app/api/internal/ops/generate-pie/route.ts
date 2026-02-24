import { NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";
import { generateOpsPieForQuote } from "@/lib/ops/pie";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const email = user?.email ?? null;

    if (!email || !isAdminEmail(email)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const quoteId =
      typeof body?.quoteId === "string" && body.quoteId.trim().length > 0
        ? body.quoteId.trim()
        : null;

    if (!quoteId) {
      return NextResponse.json({ ok: false, error: "Missing quoteId" }, { status: 400 });
    }

    // NOTE:
    // Some versions of generateOpsPieForQuote return:
    //   A) the report row directly
    // Other versions return:
    //   B) { generated: boolean, report: <row> }
    // This normalizes both shapes so the route won't break again.
    const rawResult = (await generateOpsPieForQuote(quoteId)) as any;

    const report = rawResult?.report ?? rawResult ?? null;
    const generated =
      typeof rawResult?.generated === "boolean" ? rawResult.generated : !!report;

    if (!report) {
      return NextResponse.json(
        { ok: false, error: "Could not generate PIE report" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      generated,
      report: {
        id: report.id ?? null,
        created_at: report.created_at ?? null,
        quote_id: report.quote_id ?? null,
        project_id: report.project_id ?? null,
        // keep these optional so the route doesn't fail if your row shape changes
        summary: report.summary ?? null,
        score: report.score ?? null,
        version: report.version ?? null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error generating PIE report";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}