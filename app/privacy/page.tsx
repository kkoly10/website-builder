import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <main className="container section marketingPage">
      <p className="kicker"><span className="kickerDot" />Legal</p>
      <h1 className="h1">Privacy Policy</h1>
      <p className="pDark">Last updated: April 12, 2026</p>

      <section className="panel marketingStackLg">
        <div className="panelBody marketingBody">
          <p className="p">We collect only data needed to quote, deliver, and support client projects.</p>
          <div><h2 className="h3">Information we collect</h2><ul className="serviceCardList"><li>Contact details and company info.</li><li>Project details submitted via forms.</li><li>Operational metadata for billing and security.</li></ul></div>
          <div><h2 className="h3">How we use data</h2><ul className="serviceCardList"><li>Prepare quotes and recommendations.</li><li>Deliver milestones and portal updates.</li><li>Process payments and support requests.</li></ul></div>
          <div><h2 className="h3">Your rights</h2><p className="p">Request access, correction, or deletion by emailing <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>.</p></div>
        </div>
      </section>

      <div className="row marketingActions">
        <Link href="/terms" className="btn btnGhost">View terms</Link>
        <Link href="mailto:hello@crecystudio.com" className="btn btnPrimary">Contact support</Link>
      </div>
    </main>
  );
}
