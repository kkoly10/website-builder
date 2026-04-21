import TrackLink from "@/components/site/TrackLink";
import ScrollReveal from "@/components/site/ScrollReveal";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

const PROOF_ITEMS = [
  { value: "2-4 wk", label: "Typical delivery" },
  { value: "100%", label: "You own the code" },
  { value: "$0", label: "Until scope is approved" },
  { value: "Always", label: "Live project workspace" },
] as const;

const HOW_STEPS = [
  {
    phase: "/ 01 - Intake",
    title: "Tell us what the website needs to do",
    body: "You send the essentials: business, offer, pages, goals, and urgency. We scope against reality instead of guessing from a sales call.",
  },
  {
    phase: "/ 02 - Build",
    title: "Track the whole project in one workspace",
    body: "You review milestones, previews, files, and next steps in one place. No scattered email chain and no wondering what happens next.",
  },
  {
    phase: "/ 03 - Launch",
    title: "Go live with ownership intact",
    body: "We connect the domain, test the forms, and hand over the finished system. Your code, content, and accounts stay yours.",
  },
] as const;

const TIERS = [
  {
    name: "/ Starter",
    price: "$1,800 - $2,400",
    desc: "For a clean single-page site that needs to look credible fast.",
    features: [
      "Single-page custom design",
      "Mobile and desktop build",
      "Contact form and click-to-call",
      "Analytics and SEO basics",
      "2 revision rounds",
    ],
    featured: false,
  },
  {
    name: "/ Growth",
    price: "$3,500 - $4,500",
    desc: "For most service businesses that need a real site and a stronger first impression.",
    features: [
      "4-6 custom pages",
      "Lead capture or booking flow",
      "Messaging structure and light copy support",
      "Workspace-based review process",
      "3 revision rounds",
    ],
    featured: true,
  },
  {
    name: "/ Premium",
    price: "$6,500 - $10,000+",
    desc: "For businesses that need content depth, architecture, and more moving parts.",
    features: [
      "8+ pages and deeper content system",
      "Advanced integrations",
      "Conversion tracking setup",
      "Structured launch QA",
      "4 revision rounds",
    ],
    featured: false,
  },
] as const;

const JOURNEY_STEPS = [
  ["Intake", "done"],
  ["Agreement", "done"],
  ["Deposit", "done"],
  ["Content", "done"],
  ["Build", "done"],
  ["Review", "active"],
  ["Launch", "pending"],
] as const;

export default function Home() {
  return (
    <main className={styles.page}>
      <ScrollReveal />

      <header className={`${styles.hero} heroFadeUp`}>
        <div className="container">
          <p className={styles.heroLabel}>Northern Virginia web studio / est. 2024</p>
          <h1 className={styles.heroTitle}>
            Websites that make your <span>phone ring.</span>
          </h1>
          <p className={styles.heroSub}>
            We build small business websites that earn trust fast and give clients a
            live workspace to track scope, previews, feedback, and launch.
          </p>

          <div className={styles.heroActions}>
            <TrackLink href="/build/intro" event="cta_home_hero_quote" className="btn btnPrimary">
              Start a project <span className="btnArrow">-&gt;</span>
            </TrackLink>
            <TrackLink href="/process" event="cta_home_hero_process" className={styles.heroSecondaryCta}>
              See the process
            </TrackLink>
          </div>
        </div>
      </header>

      <section className={styles.proof}>
        <div className={`container ${styles.proofGrid}`}>
          {PROOF_ITEMS.map((item) => (
            <article key={item.label} className={styles.proofItem}>
              <p className={styles.proofValue}>{item.value}</p>
              <p className={styles.proofLabel}>{item.label}</p>
            </article>
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
              Most studios disappear between invoice and launch. We built a client
              workspace so you can track milestones, upload assets, review the live
              preview, and leave feedback in one place.
            </p>
          </div>

          <div className={styles.portalFrame}>
            <div className={styles.portalHead}>
              <p className={styles.portalKicker}>Workspace preview</p>
              <p className={styles.portalUrl}>crecy.studio/portal/your-project</p>
            </div>

            <div className={styles.portalHero}>
              <div>
                <p className={styles.portalEyebrow}>Website project</p>
                <h3>
                  Your build is <em>ready for review.</em>
                </h3>
              </div>

              <TrackLink href="/portal" event="cta_home_portal_preview" className={styles.portalCta}>
                Open preview -&gt;
              </TrackLink>
            </div>

            <div className={styles.journey}>
              {JOURNEY_STEPS.map(([step, state]) => (
                <div
                  key={step}
                  className={`${styles.jstep} ${
                    state === "done"
                      ? styles.jstepDone
                      : state === "active"
                        ? styles.jstepActive
                        : ""
                  }`}
                >
                  <span className={styles.jdot} />
                  <span className={styles.jname}>{step}</span>
                </div>
              ))}
            </div>

            <div className={styles.portalCards}>
              <article className={styles.portalCard}>
                <p className={styles.portalCardTitle}>Current milestone</p>
                <p className={styles.portalCardValue}>Client review</p>
                <p className={styles.portalCardMeta}>2 of 3 revisions used</p>
              </article>
              <article className={styles.portalCard}>
                <p className={styles.portalCardTitle}>Deposit</p>
                <p className={styles.portalCardValue}>Paid</p>
                <p className={styles.portalCardMeta}>50% received before build</p>
              </article>
              <article className={styles.portalCard}>
                <p className={styles.portalCardTitle}>Launch target</p>
                <p className={styles.portalCardValue}>Apr 22</p>
                <p className={styles.portalCardMeta}>Everything on track</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.how} fadeUp`}>
        <div className="container">
          <div className={styles.howHead}>
            <p className={styles.sectionLabel}>Process</p>
            <h2 className={styles.sectionTitle}>Three steps. No surprises.</h2>
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

      <section className={`${styles.pricing} fadeUp`}>
        <div className="container">
          <div className={styles.pricingHead}>
            <div>
              <p className={styles.sectionLabel}>Pricing</p>
              <h2 className={styles.sectionTitle}>You see the price before you commit.</h2>
            </div>
            <p className={styles.pricingLede}>
              Fixed estimates, scoped to the project in front of us. No hostage
              retainers, no surprise add-ons, and no mystery labor after kickoff.
            </p>
          </div>

          <div className={styles.tiers}>
            {TIERS.map((tier) => (
              <article
                key={tier.name}
                className={`${styles.tier} ${tier.featured ? styles.tierFeatured : ""}`}
              >
                <p className={styles.tierName}>{tier.name}</p>
                <p className={styles.tierPrice}>{tier.price}</p>
                <p className={styles.tierDesc}>{tier.desc}</p>
                <ul>
                  {tier.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <TrackLink href="/build/intro" event="cta_home_pricing_quote" className={styles.tierCta}>
                  Get a quote
                </TrackLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.closing} fadeUp`}>
        <div className="container">
          <p className={styles.sectionLabel}>Ready to move?</p>
          <h2>
            Let&apos;s make people <em>actually call you.</em>
          </h2>
          <TrackLink href="/build/intro" event="cta_home_closing_quote" className="btn btnPrimary">
            Start your free estimate <span className="btnArrow">-&gt;</span>
          </TrackLink>
        </div>
      </section>

      <section className={`${styles.also} fadeUp`}>
        <div className={`container ${styles.alsoGrid}`}>
          <p className={styles.sectionLabel}>Also offered</p>
          <div className={styles.lanes}>
            <article className={styles.lane}>
              <h3>Workflow systems</h3>
              <p>
                Automation for teams buried in spreadsheet ops, repetitive handoffs,
                and manual client follow-up.
              </p>
              <TrackLink href="/systems" event="cta_home_secondary_systems" className={styles.laneLink}>
                Explore systems -&gt;
              </TrackLink>
            </article>

            <article className={styles.lane}>
              <h3>E-commerce fixes</h3>
              <p>
                Storefront, checkout, and ops cleanup for online shops leaking time or
                conversions.
              </p>
              <TrackLink href="/ecommerce" event="cta_home_secondary_ecom" className={styles.laneLink}>
                Explore e-commerce -&gt;
              </TrackLink>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
