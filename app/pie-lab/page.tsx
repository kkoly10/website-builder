// app/pie-lab/page.tsx

import PieLabClient from "./pie-lab-client";

export const dynamic = "force-dynamic";

export default function PieLabPage() {
  return (
    <main className="container">
      <section className="section">
        <div className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              PIE Lab
            </div>
            <div style={{ height: 10 }} />
            <h1 className="h2">PIE Smart Assistant Test</h1>
            <p className="p" style={{ marginTop: 8 }}>
              Paste a client intake JSON and generate a structured diagnosis + implementation plan.
            </p>
          </div>
        </div>
      </section>

      <PieLabClient />
    </main>
  );
}