import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <main className="container section marketingPage" style={{ maxWidth: 920 }}>
      <p className="kicker"><span className="kickerDot" />Legal</p>
      <h1 className="h1">Terms of Service</h1>
      <p className="pDark">Last updated: April 12, 2026</p>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panelBody" style={{ display: "grid", gap: 16 }}>
          <p className="p">Using CrecyStudio services means you agree to these terms. Signed proposals govern scope and pricing when conflicts occur.</p>
          <div><h2 className="h3">Scope and changes</h2><p className="p">Quotes are estimates until approved in writing. Out-of-scope work may require change orders with timeline and pricing updates.</p></div>
          <div><h2 className="h3">Payments</h2><ul className="serviceCardList"><li>Deposits are generally required before kickoff.</li><li>Remaining balances follow agreed milestones.</li><li>Late payments may pause project work.</li></ul></div>
          <div><h2 className="h3">Ownership</h2><p className="p">After full payment, clients own custom deliverables for their project. Internal frameworks and reusable tooling remain CrecyStudio property.</p></div>
          <div><h2 className="h3">Support and disputes</h2><p className="p">Contact support before initiating billing disputes so we can resolve issues directly.</p></div>
        </div>
      </section>

      <div className="row" style={{ marginTop: 16 }}>
        <Link href="/privacy" className="btn btnGhost">Privacy policy</Link>
        <Link href="mailto:hello@crecystudio.com" className="btn btnPrimary">Contact support</Link>
      </div>
    </main>
  );
}
