import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <main className="container" style={{ maxWidth: 920, padding: "56px 0 90px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Legal
      </div>
      <h1 className="h1" style={{ marginTop: 12 }}>Terms of Service</h1>
      <p className="pDark">Last updated: March 4, 2026</p>

      <section className="panel" style={{ marginTop: 22 }}>
        <div className="panelBody" style={{ display: "grid", gap: 18 }}>
          <p className="p">By using CrecyStudio services, you agree to the terms below. Project-specific proposals and signed agreements control when they conflict with this page.</p>

          <div>
            <h2 className="h3">Scope and estimates</h2>
            <p className="p">Quotes and recommendation ranges are estimates, not fixed-price commitments, until scope is approved in writing.</p>
          </div>

          <div>
            <h2 className="h3">Payments and deliverables</h2>
            <ul className="serviceCardList">
              <li>Projects generally require a deposit to begin.</li>
              <li>Remaining balance is due based on agreed milestones or final delivery.</li>
              <li>Late payment may pause work and delivery access.</li>
            </ul>
          </div>

          <div>
            <h2 className="h3">Client responsibilities</h2>
            <ul className="serviceCardList">
              <li>Provide accurate project information and lawful content.</li>
              <li>Respond to feedback requests in a timely manner.</li>
              <li>Maintain proper licenses/rights for any third-party assets you provide.</li>
            </ul>
          </div>

          <div>
            <h2 className="h3">Abuse, fraud, and malicious behavior</h2>
            <p className="p">We may suspend access, reject work, or terminate services immediately when we detect abuse, payment fraud, unauthorized account access attempts, threats, harassment, or unlawful use of our systems.</p>
          </div>

          <div>
            <h2 className="h3">Warranty and liability</h2>
            <p className="p">Services are provided on a commercially reasonable basis. To the maximum extent allowed by law, CrecyStudio is not liable for indirect, incidental, or consequential damages, including lost profits or downtime caused by third-party platforms.</p>
          </div>

          <div>
            <h2 className="h3">Chargebacks and disputes</h2>
            <p className="p">Before initiating a chargeback, clients agree to contact support first so we can resolve any billing or delivery issue. Fraudulent chargebacks may result in account suspension and collections action where allowed by law.</p>
          </div>
        </div>
      </section>

      <div className="row" style={{ marginTop: 18 }}>
        <Link href="/privacy" className="btn btnGhost">Privacy Policy</Link>
        <Link href="/contact" className="btn btnPrimary">Business Contact</Link>
      </div>
    </main>
  );
}
