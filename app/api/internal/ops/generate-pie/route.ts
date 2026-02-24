// app/api/internal/ops/generate-pie/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { generateOpsPieForIntake } from "@/lib/opsPie";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const opsIntakeId = String(body?.opsIntakeId ?? "").trim();
    const force = body?.force !== false; // default true for admin button regen

    if (!opsIntakeId) {
      return NextResponse.json({ ok: false, error: "Missing opsIntakeId" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const allowed = await isAdminUser({
      userId: user?.id ?? null,
      email: user?.email ?? null,
    });

    if (!allowed) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
    }

    const result = await generateOpsPieForIntake(opsIntakeId, { force });

    return NextResponse.json({
      ok: true,
      generated: result.generated,
      report: {
        id: result.report?.id ?? null,
        created_at: result.report?.created_at ?? null,
        status: result.report?.status ?? "generated",
        generator: result.report?.generator ?? null,
        summary: result.report?.summary ?? null,
        report_json: result.report?.report_json ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to generate PIE report",
      },
      { status: 500 }
    );
  }
}
