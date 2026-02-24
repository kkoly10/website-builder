import { supabaseAdmin } from "@/lib/supabaseAdmin";
import OpsDashboardClient from "./OpsDashboardClient";

export const dynamic = "force-dynamic";

type IntakeRow = {
  id: string;
  created_at: string | null;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  urgency: string | null;
  readiness: string | null;
  recommendation_tier: string | null;
  recommendation_price_range: string | null;
  recommendation_score: number | null;
  status: string | null;
};

type CallRow = {
  id: string;
  ops_intake_id: string;
  created_at: string | null;
  best_time_to_call: string | null;
  preferred_times: string | null;
  timezone: string | null;
  status: string | null;
};

type PieRow = {
  id: string;
  ops_intake_id: string;
  created_at: string | null;
  status: string | null;
  summary: string | null;
  generator: string | null;
  model: string | null;
};

async function countRows(table: string) {
  const { count } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

export default async function InternalOpsPage() {
  const [intakesCount, callsCount, pieCount] = await Promise.all([
    countRows("ops_intakes"),
    countRows("ops_call_requests"),
    countRows("ops_pie_reports"),
  ]);

  const { data: intakes } = await supabaseAdmin
    .from("ops_intakes")
    .select(
      "id, created_at, company_name, contact_name, email, phone, industry, urgency, readiness, recommendation_tier, recommendation_price_range, recommendation_score, status"
    )
    .order("created_at", { ascending: false })
    .limit(60);

  const intakeRows = ((intakes ?? []) as IntakeRow[]) || [];
  const intakeIds = intakeRows.map((x) => x.id);

  let callRows: CallRow[] = [];
  let pieRows: PieRow[] = [];

  if (intakeIds.length > 0) {
    const [{ data: calls }, { data: pies }] = await Promise.all([
      supabaseAdmin
        .from("ops_call_requests")
        .select(
          "id, ops_intake_id, created_at, best_time_to_call, preferred_times, timezone, status"
        )
        .in("ops_intake_id", intakeIds)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("ops_pie_reports")
        .select("id, ops_intake_id, created_at, status, summary, generator, model")
        .in("ops_intake_id", intakeIds)
        .order("created_at", { ascending: false }),
    ]);

    callRows = (calls ?? []) as CallRow[];
    pieRows = (pies ?? []) as PieRow[];
  }

  const latestCallByIntake = new Map<string, CallRow>();
  for (const c of callRows) {
    if (!latestCallByIntake.has(c.ops_intake_id)) latestCallByIntake.set(c.ops_intake_id, c);
  }

  const latestPieByIntake = new Map<string, PieRow>();
  for (const p of pieRows) {
    if (!latestPieByIntake.has(p.ops_intake_id)) latestPieByIntake.set(p.ops_intake_id, p);
  }

  const rows = intakeRows.map((i) => ({
    intake: i,
    latestCall: latestCallByIntake.get(i.id) ?? null,
    latestPie: latestPieByIntake.get(i.id) ?? null,
  }));

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="heroGrid">
        <div className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Ops Dashboard
            </div>
            <div style={{ height: 10 }} />
            <h1 className="h2">Ops intakes + calls + PIE</h1>
            <p className="p" style={{ marginTop: 8 }}>
              Review incoming workflow requests, call bookings, and generate/track PIE reports.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div className="statRow">
              <div className="stat">
                <div className="statNum">{intakesCount}</div>
                <div className="statLab">Ops Intakes</div>
              </div>
              <div className="stat">
                <div className="statNum">{callsCount}</div>
                <div className="statLab">Call Requests</div>
              </div>
            </div>

            <div className="statRow" style={{ marginTop: 10 }}>
              <div className="stat">
                <div className="statNum">{pieCount}</div>
                <div className="statLab">PIE Reports</div>
              </div>
              <div className="stat">
                <div className="statNum">{rows.length}</div>
                <div className="statLab">Showing</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OpsDashboardClient initialRows={rows} />
    </section>
  );
}