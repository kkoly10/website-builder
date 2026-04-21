import Link from "next/link";
import ScrollReveal from "@/components/site/ScrollReveal";
import styles from "../marketing.module.css";

export const dynamic = "force-dynamic";

const WEBSITE_TIERS = [
  {
    label: "/ Starter",
    value: "$1,800 - $2,400",
    detail: "For a clean, credible single-page site that needs to do one job well.",
    meta: "Single-page build / mobile-first / fast launch",
  },
  {
    label: "/ Growth",
    value: "$3,500 - $4,500",
    detail: "For most service businesses that need a multi-page site and a stronger first impression.",
    meta: "4-6 pages / lead capture / workspace review",
  },
  {
    label: "/ Premium",
    value: "$6,500 - $10,000+",
    detail: "For businesses that need content depth, integrations, and more architectural lift.",
    meta: "8+ pages / advanced scope / deeper implementation",
  },
] as const;

const OTHER_WORK = [
  {
    title: "E-commerce",
    body: "Store builds, fixes, and monthly ops work are priced by store complexity, platform, and operational load after intake.",
  },
  {
    title: "Systems",
    body: "Automation work starts with diagnosis so pricing is based on the process that actually needs fixing, not vague tool promises.",
  },
] as const;

export default function PricingPage() {
  return (
    <main className={styles.page}>
      <ScrollReveal />

      <section className={`${styles.hero} heroFadeUp`}>
        <div className="container">
          <div className={styles.heroInner}>
            <p className={styles.label}>Pricing</p>
            <h1 className={styles.title}>Clear ranges before the work starts.</h1>
            <p className={styles.intro}>
              We scope first, send a written estimate, and keep the number tied to the
              actual project instead of inventing surprise labor later.
            </p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.pricingWrap}`}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>Website tiers</p>
            <h2 className={styles.sectionTitle}>Most website projects land in one of these bands.</h2>
          </div>

          <div className={styles.pricingGrid}>
            {WEBSITE_TIERS.map((tier) => (
              <article key={tier.label} className={styles.pricingCard}>
                <p className={styles.cardKicker}>{tier.label}</p>
                <p className={styles.pricingValue}>{tier.value}</p>
                <p>{tier.detail}</p>
                <div className={styles.pricingMeta}>{tier.meta}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>Other engagements</p>
            <h2 className={styles.sectionTitle}>Not every project is a website build.</h2>
          </div>

          <div className={styles.gridTwo}>
            {OTHER_WORK.map((item) => (
              <article key={item.title} className={styles.card}>
                <p className={styles.cardKicker}>How it is scoped</p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>

          <div className={styles.ctaRow}>
            <Link href="/build/intro" className="btn btnPrimary">
              Start a website estimate
            </Link>
            <Link href="/process" className="btn btnGhost">
              See the process
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
