import { Link } from "@/i18n/navigation";
import ScrollReveal from "@/components/site/ScrollReveal";
import styles from "../marketing.module.css";

export const dynamic = "force-dynamic";

const FAQS = [
  {
    question: "How fast do I get an estimate?",
    answer:
      "Most website estimates go out within 24 hours of the intake. Larger e-commerce or systems work may need a quick follow-up before we lock scope.",
  },
  {
    question: "Do you only build websites?",
    answer:
      "Websites are the main lane. We also handle e-commerce fixes and workflow automation when the business problem lives there instead.",
  },
  {
    question: "Will I own the finished project?",
    answer:
      "Yes. Once the project is paid, you keep the code, content, domain access, and production accounts tied to the work.",
  },
  {
    question: "How does the client portal work?",
    answer:
      "Clients get a workspace for milestones, uploads, previews, approvals, notes, and launch tracking so the project does not get buried in email.",
  },
  {
    question: "What if I need ongoing changes later?",
    answer:
      "That can be a follow-on project or a support arrangement, depending on the kind of work. We do not trap deliverables behind a maintenance hostage model.",
  },
  {
    question: "What if my problem is not the website?",
    answer:
      "Then we will say so. Sometimes the real issue is checkout friction, bad ops, or manual internal routing, and that should change the lane we recommend.",
  },
] as const;

export default function FaqPage() {
  return (
    <main className={styles.page}>
      <ScrollReveal />

      <section className={`${styles.hero} heroFadeUp`}>
        <div className="container">
          <div className={styles.heroInner}>
            <p className={styles.label}>FAQ</p>
            <h1 className={styles.title}>Answers before you commit.</h1>
            <p className={styles.intro}>
              Clear answers on scope, ownership, timelines, and how the project
              workspace works before anything is signed.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>Common questions</p>
            <h2 className={styles.sectionTitle}>What people usually ask before signing.</h2>
          </div>

          <div className={styles.faqGrid}>
            {FAQS.map((faq) => (
              <article key={faq.question} className={styles.faqCard}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>

          <div className={styles.ctaRow}>
            <Link href="/websites" className="btn btnGhost">
              Explore websites
            </Link>
            <Link href="/contact" className="btn btnPrimary">
              Contact support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
