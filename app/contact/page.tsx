import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <main className="container section marketingPage">
      <p className="kicker"><span className="kickerDot" />Contact</p>
      <h1 className="h1">Contact & Support</h1>
      <p className="p">For proposals, support, legal notices, and portal issues, use the details below.</p>

      <section className="grid2stretch marketingStackLg">
        <article className="card"><div className="cardInner"><h2 className="h3">Primary contact</h2><p className="pDark">Email</p><p className="p"><a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a></p></div></article>
        <article className="card"><div className="cardInner"><h2 className="h3">Typical support topics</h2><ul className="serviceCardList"><li>Project updates and milestones</li><li>Billing and invoices</li><li>Portal access recovery</li><li>Legal/privacy requests</li></ul></div></article>
      </section>

      <div className="row marketingActions">
        <Link href="/portal" className="btn btnGhost">Open client portal</Link>
        <Link href="/terms" className="btn btnPrimary">Review terms</Link>
      </div>
    </main>
  );
}
