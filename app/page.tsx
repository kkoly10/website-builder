import TrackLink from "@/components/site/TrackLink";
import ScrollReveal from "@/components/site/ScrollReveal";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

const PROOF_ITEMS = [
  { value: "2–4 wk", label: "Typical delivery" },
  { value: "100%", label: "You own the code" },
  { value: "$0", label: "Until scope is approved" },
  { value: "Always", label: "Live project workspace" },
] as const;

const HOW_STEPS = [
  {
    phase: "/ 01 — WEEK 1",
    title: "Tell us about your business",
    body: "You fill out a short intake. We send back written scope, estimate range, and next step recommendations quickly.",
  },
  {
    phase: "/ 02 — WEEK 2",
    title: "We build it",
    body: "You track milestones in your workspace, review progress, and leave comments without email chaos.",
  },
  {
    phase: "/ 03 — WEEK 3",
    title: "Launch and own it",
    body: "We handle go-live and handoff. Your domain, code, assets, and operating access stay with you.",
  },
] as const;

const TIERS = [
  {
    name: "/ STARTER",
    price: "$1,800",
    desc: "For a clean, credible single-page site that does one job well.",
    features: ["Single-page custom design", "Mobile + desktop", "Contact form + click-to-call", "Analytics + SEO basics", "2 revision rounds"],
    featured: false,
  },
  {
    name: "/ GROWTH",
    price: "$3,800",
    desc: "For most small businesses ready to look the part and convert.",
    features: ["4–6 page custom site", "Booking or lead capture", "Light copy + structure", "Google profile alignment", "3 revision rounds"],
    featured: true,
  },
  {
    name: "/ PREMIUM",
    price: "$6,500",
    desc: "For businesses needing depth, integrations, and advanced architecture.",
    features: ["8+ pages + content system", "E-commerce or member areas", "Custom integrations", "Conversion tracking setup", "4 revision rounds"],
    featured: false,
  },
] as const;

export default function Home() {
  return (
    <main className={styles.page}>
      <ScrollReveal />

      <header className={`${styles.hero} heroFadeUp`}>
        <div className="container">
          <p className={styles.heroLabel}>A web studio in Northern Virginia · est. 2024</p>
          <h1 className={styles.heroTitle}>
            Websites that make your <span>phone ring.</span>
          </h1>
          <p className={styles.heroSub}>
            We build small business websites that earn trust quickly and convert visitors into customers — with a live project workspace so you always know what&apos;s happening.
          </p>
          <div className={styles.heroActions}>
            <TrackLink href="/build/intro" event="cta_home_hero_quote" className="btn btnPrimary">
              Get a free estimate <span className="btnArrow">→</span>
            </TrackLink>
            <TrackLink href="/process" event="cta_home_hero_process" className={styles.heroSecondaryCta}>
              See how it works
            </TrackLink>
          </div>
        </div>
      </header>

      <section className={styles.proof}>
        <div className={`container ${styles.proofGrid}`}>
          {PROOF_ITEMS.map((item) => (
            <div key={item.label} className={styles.proofItem}>
              <div className={styles.proofValue}>{item.value}</div>
              <div className={styles.proofLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.diff} fadeUp`}>
        <div className="container">
          <div className={styles.diffHead}>
            <div>
              <p className={styles.sectionLabel}>The difference</p>
              <h2 className={styles.sectionTitle}>Your project lives in a workspace.</h2>
            </div>
            <p className={styles.diffLede}>
              Most studios send a PDF and disappear for weeks. We built a client portal so you can <strong>track milestones, review previews, leave feedback, and handle approvals in one place.</strong>
            </p>
          </div>

          <div className={styles.portalFrame}>
            <div className={styles.portalBar}>
              <span />
              <span />
              <span />
              <span className={styles.portalUrl}>crecy.studio/portal/your-project</span>
            </div>

            <div className={styles.portalBody}>
              <p className={styles.portalKicker}>▸ Website project</p>
              <h3>
                Your website is <em>ready for review.</em>
              </h3>
              <TrackLink href="/portal" event="cta_home_portal_preview" className={styles.portalCta}>
                Open your preview →
              </TrackLink>

              <div className={styles.journey}>
                {[
                  ["Intake", "done"],
                  ["Agreement", "done"],
                  ["Deposit", "done"],
                  ["Content", "done"],
                  ["Build", "done"],
                  ["Review", "now"],
                  ["Launch", ""],
                ].map(([step, state]) => (
                  <div key={step} className={`${styles.jstep} ${state === "done" ? styles.jstepDone : ""} ${state === "now" ? styles.jstepNow : ""}`}>
                    <span className={styles.jdot} />
                    <span className={styles.jname}>{step}</span>
                  </div>
                ))}
              </div>

              <div className={styles.portalCards}>
                <div className={`${styles.portalCard} ${styles.portalCardLive}`}>
                  <p className={styles.portalCardTitle}>CURRENT MILESTONE</p>
                  <p className={styles.portalCardValue}>Client review</p>
                  <p className={styles.portalCardMeta}>2 of 3 revisions used</p>
                </div>
                <div className={styles.portalCard}>
                  <p className={styles.portalCardTitle}>DEPOSIT</p>
                  <p className={styles.portalCardValue}>Paid</p>
                  <p className={styles.portalCardMeta}>$1,800 · Mar 28</p>
                </div>
                <div className={styles.portalCard}>
                  <p className={styles.portalCardTitle}>EST. LAUNCH</p>
                  <p className={styles.portalCardValue}>Apr 22</p>
                  <p className={styles.portalCardMeta}>On track</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={`${styles.how} fadeUp`}>
        <div className="container">
          <div className={styles.howHead}>
            <p className={styles.sectionLabel}>How it works</p>
            <h2 className={styles.sectionTitle}>Three weeks. No surprises.</h2>
          </div>
          <div className={styles.howSteps}>
            {HOW_STEPS.map((step) => (
              <article key={step.phase} className={styles.howStep}>
                <p className={styles.howStepNum}>{step.phase}</p>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className={`${styles.pricing} fadeUp`}>
        <div className="container">
          <div className={styles.pricingHead}>
            <div>
              <p className={styles.sectionLabel}>Pricing</p>
              <h2 className={styles.sectionTitle}>You see the price before you commit.</h2>
            </div>
            <p className={styles.pricingLede}>
              Every project is scoped to what you actually need — no surprise add-ons and no hostage retainers.
            </p>
          </div>

          <div className={styles.tiers}>
            {TIERS.map((tier) => (
              <article key={tier.name} className={`${styles.tier} ${tier.featured ? styles.tierFeatured : ""}`}>
                <p className={styles.tierName}>{tier.name}</p>
                <p className={styles.tierPrice}>
                  <span>from</span>
                  {tier.price}
                </p>
                <p className={styles.tierDesc}>{tier.desc}</p>
                <ul>
                  {tier.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <TrackLink href="/build/intro" event="cta_home_pricing_quote" className={styles.tierCta}>Get a quote</TrackLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.closing} fadeUp`}>
        <div className="container">
          <h2>
            Let&apos;s make people <em>actually call you.</em>
          </h2>
          <TrackLink href="/build/intro" event="cta_home_closing_quote" className="btn btnPrimary">
            Start your free estimate <span className="btnArrow">→</span>
          </TrackLink>
        </div>
      </section>

      <section className={`${styles.also} fadeUp`}>
        <div className={`container ${styles.alsoGrid}`}>
          <p className={styles.sectionLabel}>Also offered</p>
          <div className={styles.lanes}>
            <article className={styles.lane}>
              <h4>Workflow automation</h4>
              <p>Custom automation for teams buried in manual handoffs, spreadsheet ops, and repetitive admin tasks.</p>
              <TrackLink href="/systems" event="cta_home_secondary_systems" className={styles.laneLink}>Explore workflow automation →</TrackLink>
            </article>
            <article className={styles.lane}>
              <h4>E-commerce</h4>
              <p>Diagnostic and rebuild work for stores that leak conversions or outgrow their current setup.</p>
              <TrackLink href="/ecommerce" event="cta_home_secondary_ecom" className={styles.laneLink}>Explore e-commerce →</TrackLink>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
