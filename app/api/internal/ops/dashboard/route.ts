import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const { data: intakes, error: intakesError } = await supabaseAdmin
      .from("ops_intakes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (intakesError) {
      return NextResponse.json(
        { ok: false, error: intakesError.message },
        { status: 500 }
      );
    }

    const intakeIds = (intakes ?? []).map((x) => x.id).filter(Boolean);

    let calls: any[] = [];
    let reports: any[] = [];

    if (intakeIds.length > 0) {
      const { data: callRows, error: callsError } = await supabaseAdmin
        .from("ops_call_requests")
        .select("*")
        .in("ops_intake_id", intakeIds)
        .order("created_at", { ascending: false });

      if (callsError) {
        return NextResponse.json(
          { ok: false, error: callsError.message },
          { status: 500 }
        );
      }
      calls = callRows ?? [];

      const { data: reportRows, error: reportsError } = await supabaseAdmin
        .from("ops_pie_reports")
        .select("*")
        .in("ops_intake_id", intakeIds)
        .order("created_at", { ascending: false });

      if (reportsError) {
        return NextResponse.json(
          { ok: false, error: reportsError.message },
          { status: 500 }
        );
      }
      reports = reportRows ?? [];
    }

    // latest call per intake
    const latestCallByIntake = new Map<string, any>();
    for (const row of calls) {
      if (!latestCallByIntake.has(row.ops_intake_id)) {
        latestCallByIntake.set(row.ops_intake_id, row);
      }
    }

    // latest PIE per intake
    const latestPieByIntake = new Map<string, any>();
    for (const row of reports) {
      if (!latestPieByIntake.has(row.ops_intake_id)) {
        latestPieByIntake.set(row.ops_intake_id, row);
      }
    }

    const merged = (intakes ?? []).map((intake) => ({
      intake,
      latestCallRequest: latestCallByIntake.get(intake.id) ?? null,
      latestPieReport: latestPieByIntake.get(intake.id) ?? null,
    }));

    return NextResponse.json({
      ok: true,
      rows: merged,
      count: merged.length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected dashboard error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}