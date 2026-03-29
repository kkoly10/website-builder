import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <main
      className="container"
      style={{ maxWidth: 920, padding: "56px 0 90px" }}
    >
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Legal
      </div>
      <h1
        className="h1"
        style={{
          marginTop: 12,
          fontFamily: "'Playfair Display', Georgia, serif",
        }}
      >
        Terms of Service
      </h1>
      <p className="pDark">Last updated: March 29, 2026</p>

      <section className="panel" style={{ marginTop: 22 }}>
        <div className="panelBody" style={{ display: "grid", gap: 18 }}>
          <p className="p">
            By using CrecyStudio services, you agree to the terms below.
            Project-specific proposals and signed agreements control when they
            conflict with this page.
          </p>

          <div>
            <h2 className="h3">Services and scope</h2>
            <p className="p">
              CrecyStudio provides website design, e-commerce, and workflow
              systems services across three service lanes. Quotes,
              recommendation ranges, and tier-based pricing are estimates — not
              fixed-price commitments — until scope is approved in writing.
              Approved scope defines the work to be performed, the deliverables,
              and the agreed investment.
            </p>
          </div>

          <div>
            <h2 className="h3">Payments and deposits</h2>
            <ul className="serviceCardList">
              <li>
                Projects generally require a deposit before work begins. Deposit
                amounts are specified during the scoping process.
              </li>
              <li>
                Remaining balance is due based on agreed milestones or upon final
                delivery, as outlined in the project scope or proposal.
              </li>
              <li>
                Late payment may pause active work, restrict portal access, and
                delay delivery until the balance is resolved.
              </li>
              <li>
                All payments are in U.S. dollars unless otherwise agreed in
                writing.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="h3">Change orders and scope changes</h2>
            <p className="p">
              Work outside the approved scope — including additional pages,
              features, integrations, or revisions beyond the agreed structure —
              may require a change order with separate pricing and timeline
              adjustments. Change orders are documented and require approval
              before additional work begins.
            </p>
          </div>

          <div>
            <h2 className="h3">Client responsibilities</h2>
            <ul className="serviceCardList">
              <li>
                Provide accurate project information, content, assets, and
                access credentials in a timely manner.
              </li>
              <li>
                Respond to feedback requests, revision rounds, and approval
                milestones within a reasonable timeframe to keep the project on
                schedule.
              </li>
              <li>
                Maintain proper licenses and rights for any third-party assets,
                content, or integrations you provide.
              </li>
              <li>
                Ensure that all submitted content is lawful and does not infringe
                on the rights of others.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="h3">Project pauses and cancellation</h2>
            <p className="p">
              If a project is paused due to client delays exceeding 30 days
              without prior arrangement, CrecyStudio reserves the right to
              close the project and retain any deposits already paid for work
              completed. Restarting a paused project may require a new scope
              review and may be subject to updated pricing. Cancellation
              requests should be submitted in writing. Deposits cover work
              already performed and are generally non-refundable once work has
              begun.
            </p>
          </div>

          <div>
            <h2 className="h3">Intellectual property and ownership</h2>
            <p className="p">
              Upon full payment, clients receive ownership of custom
              deliverables created specifically for their project — including
              website designs, page content written for the project, and custom
              configurations. CrecyStudio retains ownership of its internal
              tools, templates, frameworks, processes, and any reusable
              components not created exclusively for the client. Third-party
              tools, platforms, and integrations remain subject to their own
              licensing terms.
            </p>
          </div>

          <div>
            <h2 className="h3">Abuse, fraud, and malicious behavior</h2>
            <p className="p">
              We may suspend access, reject work, or terminate services
              immediately when we detect abuse, payment fraud, unauthorized
              account access attempts, threats, harassment, or unlawful use of
              our systems.
            </p>
          </div>

          <div>
            <h2 className="h3">Warranty and liability</h2>
            <p className="p">
              Services are provided on a commercially reasonable basis.
              CrecyStudio does not guarantee specific business outcomes such as
              revenue increases, lead volume, or search rankings. To the maximum
              extent allowed by law, CrecyStudio is not liable for indirect,
              incidental, or consequential damages, including lost profits or
              downtime caused by third-party platforms, hosting providers, or
              payment processors.
            </p>
          </div>

          <div>
            <h2 className="h3">Chargebacks and billing disputes</h2>
            <p className="p">
              Before initiating a chargeback, clients agree to contact support
              first so we can resolve any billing or delivery issue directly.
              Fraudulent chargebacks may result in account suspension,
              termination of services, and collections action where allowed by
              law.
            </p>
          </div>

          <div>
            <h2 className="h3">Modifications to terms</h2>
            <p className="p">
              CrecyStudio may update these terms from time to time. Material
              changes will be reflected in the &quot;Last updated&quot; date
              above. Continued use of services after changes are posted
              constitutes acceptance of the updated terms.
            </p>
          </div>

          <div>
            <h2 className="h3">Governing law</h2>
            <p className="p">
              These terms are governed by the laws of the Commonwealth of
              Virginia, United States, without regard to conflict-of-law
              provisions. Any disputes arising from these terms or the services
              provided will be resolved in the courts located in Virginia.
            </p>
          </div>
        </div>
      </section>

      <div className="row" style={{ marginTop: 18 }}>
        <Link href="/privacy" className="btn btnGhost">
          Privacy Policy
        </Link>
        <Link href="mailto:hello@crecystudio.com" className="btn btnPrimary">
          Contact Support
        </Link>
      </div>
    </main>
  );
}
