import SupportPageShell from "@/components/site/SupportPageShell";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <SupportPageShell
      kicker="Contact"
      title="Contact & Support"
      description="For proposals, support, legal notices, and portal issues, use the details below."
      ctas={[
        { href: "/terms", label: "Review terms" },
        { href: "/portal", label: "Open client portal", variant: "ghost" },
      ]}
    >
      <section className="grid2stretch marketingStackLg">
        <article className="card">
          <div className="cardInner">
            <h2 className="h3">Primary contact</h2>
            <p className="pDark">Email</p>
            <p className="p">
              <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
            </p>
          </div>
        </article>

        <article className="card">
          <div className="cardInner">
            <h2 className="h3">Typical support topics</h2>
            <ul className="serviceCardList">
              <li>Project updates and milestones</li>
              <li>Billing and invoices</li>
              <li>Portal access recovery</li>
              <li>Legal/privacy requests</li>
            </ul>
          </div>
        </article>
      </section>
    </SupportPageShell>
  );
}
