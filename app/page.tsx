import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/site/ScrollReveal";
import TrackLink from "@/components/site/TrackLink";
import {
  OPS_TIER_CONFIG,
  PRICING_MESSAGES,
  WEBSITE_TIER_CONFIG,
  money,
} from "@/lib/pricing";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

const websiteFrom = money(WEBSITE_TIER_CONFIG.starter_site.min);
const opsFrom = money(OPS_TIER_CONFIG.quick_workflow_fix.min);

const services = [
  {
    label: "Service 1",
    title: "Website Building",
    description:
      "Premium conversion websites for local brands that need stronger first-click performance, sharper credibility, and better lead flow.",
    who: "businesses with outdated sites, weak conversion, or no clear digital presence",
    pricing: `Starts at ${websiteFrom}`,
    href: "/build/intro",
    cta: "Get Website Quote",
    event: "cta_home_service_website",
    image: "/marketing/service-website.jpg",
  },
  {
    label: "Service 2",
    title: "E-Commerce Systems",
    description:
      "Storefront and backend process upgrades for cleaner checkout, better retention, stronger merchandising, and smoother order operations.",
    who: "sellers scaling orders with friction after checkout or weak backend flow",
    pricing: "Pricing: scoped after intake",
    href: "/ecommerce/intake",
    cta: "Start E-Commerce Intake",
    event: "cta_home_service_ecommerce",
    image: "/marketing/service-ecommerce.jpg",
  },
  {
    label: "Service 3",
    title: "Ops Workflow Automation",
    description:
      "Automation for intake, routing, status tracking, billing handoff, and repetitive admin work that slows the business down.",
    who: "teams buried in manual handoffs, disconnected tools, and messy operations",
    pricing: `Starts at ${opsFrom}`,
    href: "/ops-intake",
    cta: "Start Workflow Audit",
    event: "cta_home_service_ops",
    image: "/marketing/service-ops.jpg",
  },
] as const;

const processSteps = [
  {
    n: "1",
    title: "Submit Intake",
    desc: "Tell us your goal, timeline, and current bottlenecks.",
  },
  {
    n: "2",
    title: "Get Scoped Plan",
    desc: "Receive priorities, estimate range, and execution path.",
  },
  {
    n: "3",
    title: "Strategy Call",
    desc: "Align scope, timeline, and the right service lane.",
  },
  {
    n: "4",
    title: "Build + Launch",
    desc: "Milestone-driven delivery with visible progress.",
  },
] as const;

export default function Home() {
  return (
    <main className={styles.home10x}>
      <ScrollReveal />

      <section className={`section ${styles.home10xHero}`}>
        <div className="container">
          <div className={`${styles.home10xHeroShell} card fadeUp inView`}>
            <div className={styles.home10xHeroCopy}>
              <div className="kicker">Unified Growth System</div>

              <h1 className={`h1 ${styles.home10xHeroTitle}`}>
                One studio for your
                <span className={styles.home10xAccent}> website</span>,
                <span className={styles.home10xAccent}> e-commerce</span>, and
                <span className={styles.home10xAccent}> operations</span>.
              </h1>

              <p className={`p ${styles.home10xHeroText}`}>
                CrecyStudio helps local businesses look premium online, tighten
                their buying flow, and remove manual backend friction so growth
                feels cleaner from first click to fulfillment.
              </p>

              <div className={styles.home10xHeroActions}>
                <TrackLink
                  href="/ecommerce/intake"
                  event="cta_home_hero_ecommerce"
                  className="btn btnPrimary btnLg"
                >
                  Start E-Commerce Intake <span className="btnArrow">→</span>
                </TrackLink>

                <TrackLink
                  href="/build/intro"
                  event="cta_home_hero_quote"
                  className="btn btnGhost btnLg"
                >
                  Get Website Quote
                </TrackLink>
              </div>

              <div className={styles.home10xMiniPills}>
                <span className="pill">Free estimate paths</span>
                <span className="pill">{PRICING_MESSAGES.depositPolicy}</span>
                <span className="pill">Scoped before build</span>
              </div>
            </div>

            <div className={styles.home10xHeroPanel}>
              <div className={styles.home10xHeroPanelTop}>
                <div className={styles.home10xPanelEyebrow}>What this solves</div>
                <div className={styles.home10xPanelTitle}>
                  Three lanes. One cleaner growth plan.
                </div>
              </div>

              <div className={styles.home10xLaneList}>
                <div className={styles.home10xLaneItem}>
                  <div className={styles.home10xLaneDot} />
                  <div>
                    <strong>Website Building</strong>
                    <span>Sharpen credibility, conversion, and lead capture.</span>
                  </div>
                </div>

                <div className={styles.home10xLaneItem}>
                  <div className={styles.home10xLaneDot} />
                  <div>
                    <strong>E-Commerce Systems</strong>
                    <span>Improve storefront flow and post-checkout operations.</span>
                  </div>
                </div>

                <div className={styles.home10xLaneItem}>
                  <div className={styles.home10xLaneDot} />
                  <div>
                    <strong>Ops Workflow Automation</strong>
                    <span>Remove manual handoffs, status confusion, and admin drag.</span>
                  </div>
                </div>
              </div>

              <div className={styles.home10xHeroPanelFoot}>
                Best for businesses that are growing faster than their current systems.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`section ${styles.home10xServices}`}>
        <div className="container">
          <div className={`${styles.home10xSectionHead} fadeUp`}>
            <div className={styles.home10xEyebrow}>All Services</div>
            <h2 className={`h2 ${styles.home10xSectionTitle}`}>
              Three service cards + who each is for
            </h2>
          </div>

          <div className={styles.home10xCardGrid}>
            {services.map((service, i) => (
              <article
                key={service.title}
                className={`${styles.home10xServiceCard} card scaleIn stagger-${Math.min(i + 1, 4)}`}
              >
                <div className={styles.home10xImageWrap}>
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 980px) 100vw, 33vw"
                    className={styles.home10xImage}
                    priority={i === 0}
                  />
                  <div className={styles.home10xImageOverlay} />
                </div>

                <div className={styles.home10xCardBody}>
                  <div className={styles.home10xCardLabel}>{service.label}</div>
                  <h3 className={styles.home10xCardTitle}>{service.title}</h3>
                  <p className={styles.home10xCardDesc}>{service.description}</p>

                  <div className={styles.home10xWhoBox}>
                    <span>Who it’s for:</span> {service.who}
                  </div>

                  <div className={styles.home10xPricing}>{service.pricing}</div>

                  <TrackLink
                    href={service.href}
                    event={service.event}
                    className={`btn btnGhost ${styles.home10xCardButton}`}
                  >
                    {service.cta} <span className="btnArrow">→</span>
                  </TrackLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.home10xProcess}`}>
        <div className="container">
          <div className={`${styles.home10xSectionHead} fadeUp`}>
            <div className={styles.home10xEyebrow}>Process</div>
            <h2 className={`h2 ${styles.home10xSectionTitle}`}>
              Simple from intake to launch
            </h2>
          </div>

          <div className={styles.home10xProcessGrid}>
            {processSteps.map((step, i) => (
              <div
                key={step.n}
                className={`${styles.home10xProcessCard} card fadeUp stagger-${Math.min(i + 1, 4)}`}
              >
                <div className={styles.home10xProcessNum}>{step.n}</div>
                <div className={styles.home10xProcessTitle}>{step.title}</div>
                <p className={styles.home10xProcessDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.home10xBottomCta}`}>
        <div className="container">
          <div className={`${styles.home10xBottomPanel} card scaleIn`}>
            <div className={styles.home10xBottomEyebrow}>Ready to start?</div>
            <h2 className={`h2 ${styles.home10xBottomTitle}`}>
              Start with one unified growth plan.
            </h2>
            <p className={styles.home10xBottomText}>
              We&apos;ll route you into the right lane and prioritize the
              highest-leverage move first — website, e-commerce, or operations.
            </p>

            <div className={styles.home10xBottomActions}>
              <TrackLink
                href="/ecommerce/intake"
                event="cta_home_bottom_ecommerce"
                className="btn btnPrimary"
              >
                Start E-Commerce Intake <span className="btnArrow">→</span>
              </TrackLink>

              <TrackLink
                href="/build/intro"
                event="cta_home_bottom_quote"
                className="btn btnGhost"
              >
                Get Website Quote
              </TrackLink>

              <Link href="/systems" className="btn btnGhost">
                Explore Workflow Systems
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}