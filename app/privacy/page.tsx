import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <main className="container" style={{ maxWidth: 920, padding: "56px 0 90px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Legal
      </div>
      <h1 className="h1" style={{ marginTop: 12 }}>Privacy Policy</h1>
      <p className="pDark">Last updated: March 4, 2026</p>

      <section className="panel" style={{ marginTop: 22 }}>
        <div className="panelBody" style={{ display: "grid", gap: 18 }}>
          <p className="p">CrecyStudio collects only the information needed to quote, deliver, and support website and workflow projects.</p>

          <div>
            <h2 className="h3">Information we collect</h2>
            <ul className="serviceCardList">
              <li>Contact details (name, email, phone, company).</li>
              <li>Project details submitted through estimate and intake forms.</li>
              <li>Operational metadata required for support, billing, and security.</li>
            </ul>
          </div>

          <div>
            <h2 className="h3">How we use data</h2>
            <ul className="serviceCardList">
              <li>Prepare quotes and recommendations.</li>
              <li>Deliver project milestones and portal updates.</li>
              <li>Process deposits, invoices, and support requests.</li>
              <li>Protect services from fraud, abuse, and unauthorized access.</li>
            </ul>
          </div>

          <div>
            <h2 className="h3">Data sharing</h2>
            <p className="p">We do not sell personal data. Data is shared only with essential service providers used to run the business (for example hosting, payments, and email delivery) under their standard processing terms.</p>
          </div>

          <div>
            <h2 className="h3">Retention and security</h2>
            <p className="p">We retain records as long as needed for service delivery, legal compliance, dispute handling, and business operations. Reasonable technical and administrative safeguards are used to protect your data.</p>
          </div>

          <div>
            <h2 className="h3">Your rights</h2>
            <p className="p">You can request access, correction, or deletion of personal information by emailing <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>.</p>
          </div>
        </div>
      </section>

      <div className="row" style={{ marginTop: 18 }}>
        <Link href="/terms" className="btn btnGhost">View Terms</Link>
        <Link href="mailto:hello@crecystudio.com" className="btn btnPrimary">Contact Support</Link>
      </div>
    </main>
  );
}
