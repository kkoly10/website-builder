import OpsDashboardClient from "./OpsDashboardClient";

export const dynamic = "force-dynamic";

export default function InternalOpsPage() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Ops Dashboard
          </div>
          <div style={{ height: 10 }} />
          <h1 className="h2">Ops intakes + PIE reports</h1>
          <p className="p" style={{ marginTop: 8 }}>
            Review intake submissions, call requests, and generate detailed PIE ops reports.
          </p>
        </div>
      </div>

      <OpsDashboardClient />
    </section>
  );
}