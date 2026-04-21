import Link from "next/link";
import styles from "../marketing.module.css";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <p className={styles.label}>Legal</p>
            <h1 className={styles.title}>Terms of Service</h1>
            <p className={styles.intro}>
              Using CrecyStudio services means you agree to these terms. Signed
              proposals control scope, pricing, and deliverables whenever they are more
              specific than this page.
            </p>
            <p className={styles.legalMeta}>Last updated: April 12, 2026</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.prose}>
            <div className={styles.proseInner}>
              <section className={styles.proseSection}>
                <h2>Scope and changes</h2>
                <p>
                  Quotes remain estimates until approved in writing. Requests outside the
                  agreed scope may require a change order with revised pricing and
                  timeline.
                </p>
              </section>

              <section className={styles.proseSection}>
                <h2>Payments</h2>
                <ul>
                  <li>Deposits are generally required before kickoff.</li>
                  <li>Remaining balances follow the milestone schedule in the proposal.</li>
                  <li>Late payments may pause project work until the account is current.</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>Ownership</h2>
                <p>
                  After full payment, clients own the custom deliverables produced for
                  their project. Internal frameworks, reusable utilities, and operating
                  methods remain CrecyStudio property.
                </p>
              </section>

              <section className={styles.proseSection}>
                <h2>Support and disputes</h2>
                <p>
                  Contact support before initiating billing disputes so we have a chance
                  to resolve the issue directly. Most problems are easier to solve in the
                  workspace than through a processor claim.
                </p>
              </section>

              <section className={styles.proseSection}>
                <h2>Questions</h2>
                <p>
                  Reach out at{" "}
                  <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a> or read
                  the{" "}
                  <Link href="/privacy">privacy policy</Link> for related information about
                  data handling.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
