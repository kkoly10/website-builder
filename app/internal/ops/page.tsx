import OpsDashboardClient from "./OpsDashboardClient";

export const dynamic = "force-dynamic";

export default function InternalOpsPage() {
  return (
    <main className="container">
      <section className="section">
        <div className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Internal Ops Dashboard
            </div>
            <div style={{ height: 10 }} />
            <h1 className="h2">Ops intakes + PIE reports</h1>
            <p className="p" style={{ marginTop: 8 }}>
              Review submitted intakes, call requests, and generate PIE reports.
            </p>
          </div>
        </div>
      </section>

      <OpsDashboardClient />
    </main>
  );
}