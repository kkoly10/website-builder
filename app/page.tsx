import Link from "next/link";
import ScrollReveal from "@/components/site/ScrollReveal";
import ProblemSwitcher from "@/components/home/ProblemSwitcher";
import WorkspaceStory from "@/components/home/WorkspaceStory";
import PricingExplorer from "@/components/home/PricingExplorer";
import TrackLink from "@/components/site/TrackLink";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className={`marketingPage ${styles.page}`}>
      <ScrollReveal />

      <section className={styles.hero}>
        <div className="container">
          <div className="kicker heroFadeUp">Website-first growth studio</div>
          <h1 className={`${styles.title} heroFadeUp`}>
            Websites that make your business look as good as it actually is.
          </h1>
          <p className={`${styles.sub} heroFadeUp`}>
            We design and build high-trust websites first, then extend into
            e-commerce and workflow systems when your growth needs it.
          </p>
          <div className={`${styles.actions} heroFadeUp`}>
            <TrackLink href="/build/intro" event="cta_home_hero_quote" className="btn btnPrimary">
              Get your free estimate <span className="btnArrow">→</span>
            </TrackLink>
            <TrackLink href="/websites" event="cta_home_hero_websites" className="btn btnGhost">
              See website packages
            </TrackLink>
          </div>
        </div>
      </section>

      <section className={styles.proof}>
        <div className="container">
          <div className={styles.proofGrid}>
            <div><strong>24h</strong><span>Estimate turnaround</span></div>
            <div><strong>2–4 wks</strong><span>Typical website launch window</span></div>
            <div><strong>1 workspace</strong><span>Content, approvals, and feedback in one place</span></div>
            <div><strong>100%</strong><span>You keep your domain, code, and assets</span></div>
          </div>
        </div>
      </section>

      <section className="section container fadeUp" id="services">
        <div className={styles.sectionHead}>
          <p className="metaLabel">Start with your biggest bottleneck</p>
          <h2 className="h2">Choose the problem costing you the most right now</h2>
        </div>
        <ProblemSwitcher />
      </section>

      <section className={`section container fadeUp`} id="how-it-works">
        <div className={styles.sectionHead}>
          <p className="metaLabel">Client portal journey</p>
          <h2 className="h2">Track every milestone from intake to launch</h2>
        </div>
        <WorkspaceStory />
      </section>

      <section className="section container fadeUp">
        <div className={styles.sectionHead}>
          <p className="metaLabel">Website pricing explorer</p>
          <h2 className="h2">Transparent ranges based on actual scope</h2>
        </div>
        <PricingExplorer />
      </section>

      <section className="section container fadeUp">
        <div className={styles.faqPreview}>
          <div>
            <p className="metaLabel">Common objections</p>
            <h2 className="h2">Answers before you commit</h2>
            <p className="p">See pricing, timeline, revisions, and ownership answers before booking.</p>
          </div>
          <Link href="/faq" className="btn btnGhost">View full FAQ</Link>
        </div>
      </section>

      <section className="section container fadeUp">
        <div className={styles.secondaryLinks}>
          <h3 className="h3">Need a different lane?</h3>
          <div className={styles.linkRow}>
            <TrackLink href="/ecommerce" event="cta_home_secondary_ecom" className="btn btnGhost">E-Commerce Services</TrackLink>
            <TrackLink href="/systems" event="cta_home_secondary_systems" className="btn btnGhost">Workflow Systems</TrackLink>
            <TrackLink href="/process" event="cta_home_secondary_process" className="btn btnGhost">See our process</TrackLink>
          </div>
        </div>
      </section>
    </main>
  );
}
