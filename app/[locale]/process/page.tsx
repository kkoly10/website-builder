import { Link } from "@/i18n/navigation";
import ScrollReveal from "@/components/site/ScrollReveal";
import styles from "../marketing.module.css";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    step: "/ 01 - Intake",
    title: "Tell us what the business needs",
    body: "You submit the lane-specific intake with goals, constraints, examples, and urgency. That gives us enough to scope without pretending every project is the same.",
  },
  {
    step: "/ 02 - Scope",
    title: "Get a real estimate",
    body: "We review the request, score the complexity, and send back a written recommendation with price range, timeline, and next steps.",
  },
  {
    step: "/ 03 - Build",
    title: "Review everything in the workspace",
    body: "The project runs through a shared workspace for milestones, files, approvals, previews, and revision requests. No scattered handoffs.",
  },
  {
    step: "/ 04 - Launch",
    title: "Go live with a clean handoff",
    body: "We finish QA, launch the work, and hand over access with the final files and operating context still in your hands.",
  },
] as const;

const NOTES = [
  {
    title: "Website builds",
    body: "Most projects land in the 2-4 week range depending on page count, copy readiness, and revision speed.",
  },
  {
    title: "E-commerce work",
    body: "Store builds, fixes, and ops retainers use the same rhythm, but the scope shifts based on storefront complexity and operational load.",
  },
  {
    title: "Systems work",
    body: "Automation projects always begin with diagnosis first so we solve the bottleneck instead of automating a broken process.",
  },
] as const;

export default function ProcessPage() {
  return (
    <main className={styles.page}>
      <ScrollReveal />

      <section className={`${styles.hero} heroFadeUp`}>
        <div className="container">
          <div className={styles.heroInner}>
            <p className={styles.label}>Process</p>
            <h1 className={styles.title}>A simple process with clear milestones.</h1>
            <p className={styles.intro}>
              Every lane uses the same execution rhythm so the scope stays visible, the
              pricing stays understandable, and nobody wonders what happens next.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.darkBand}>
        <div className="container">
          <p className={styles.darkLead}>
            The point is not to make the process feel fancy. The point is to make it
            hard for work to disappear into silence.
          </p>

          <div className={styles.darkGrid}>
            {STEPS.map((step) => (
              <article key={step.step} className={styles.darkCard}>
                <p className={styles.darkStep}>{step.step}</p>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>By lane</p>
            <h2 className={styles.sectionTitle}>The rhythm stays the same, the scope changes.</h2>
          </div>

          <div className={styles.gridThree}>
            {NOTES.map((note) => (
              <article key={note.title} className={styles.card}>
                <p className={styles.cardKicker}>What changes</p>
                <h3>{note.title}</h3>
                <p>{note.body}</p>
              </article>
            ))}
          </div>

          <div className={styles.ctaRow}>
            <Link href="/build/intro" className="btn btnPrimary">
              Start a website project
            </Link>
            <Link href="/pricing" className="btn btnGhost">
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
