import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <main className="container" style={{ maxWidth: 860, padding: "56px 0 90px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Business Contact
      </div>
      <h1 className="h1" style={{ marginTop: 12 }}>Contact & Support</h1>
      <p className="p">For proposals, support, legal notices, and account help, use the contact details below.</p>

      <section className="grid2stretch" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="cardInner">
            <h2 className="h3">Primary Contact</h2>
            <p className="pDark" style={{ marginBottom: 6 }}>Email</p>
            <p className="p"><a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a></p>
            <p className="pDark" style={{ marginBottom: 6 }}>Response Time</p>
            <p className="p">Typically within 1 business day.</p>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <h2 className="h3">Support Scope</h2>
            <ul className="serviceCardList">
              <li>Project status and delivery updates.</li>
              <li>Billing and invoice support.</li>
              <li>Portal access and account recovery help.</li>
              <li>Legal/privacy requests.</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="row" style={{ marginTop: 18 }}>
        <Link href="/portal" className="btn btnGhost">Open Client Portal</Link>
        <Link href="/terms" className="btn btnPrimary">Review Service Terms</Link>
      </div>
    </main>
  );
}
