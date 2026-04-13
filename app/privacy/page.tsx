import SupportPageShell from "@/components/site/SupportPageShell";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <SupportPageShell
      kicker="Legal"
      title="Privacy Policy"
      description="Last updated: April 12, 2026"
      ctas={[
        { href: "mailto:hello@crecystudio.com", label: "Contact support" },
        { href: "/terms", label: "View terms", variant: "ghost" },
      ]}
    >
      <section className="panel marketingStackLg">
        <div className="panelBody marketingBody">
          <p className="p">We collect only data needed to quote, deliver, and support client projects.</p>
          <div>
            <h2 className="h3">Information we collect</h2>
            <ul className="serviceCardList">
              <li>Contact details and company info.</li>
              <li>Project details submitted via forms.</li>
              <li>Operational metadata for billing and security.</li>
            </ul>
          </div>
          <div>
            <h2 className="h3">How we use data</h2>
            <ul className="serviceCardList">
              <li>Prepare quotes and recommendations.</li>
              <li>Deliver milestones and portal updates.</li>
              <li>Process payments and support requests.</li>
            </ul>
          </div>
          <div>
            <h2 className="h3">Your rights</h2>
            <p className="p">
              Request access, correction, or deletion by emailing <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>.
            </p>
          </div>
        </div>
      </section>
    </SupportPageShell>
  );
}
