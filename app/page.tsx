import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/site/ScrollReveal";
import TrackLink from "@/components/site/TrackLink";
import LaneGuide from "@/components/site/LaneGuide";
import { OPS_TIER_CONFIG, WEBSITE_TIER_CONFIG, money } from "@/lib/pricing";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

const websiteFrom = money(WEBSITE_TIER_CONFIG.starter_site.min);
const opsFrom = money(OPS_TIER_CONFIG.quick_workflow_fix.min);

const services = [
  {
    label: "Grow",
    title: "Website Building",
    description:
      "Premium conversion websites for service brands that need stronger trust, sharper positioning, and more effective lead flow.",
    who: "Best when your business needs a stronger first impression, better credibility, and cleaner lead conversion.",
    pricing: `Starts at ${websiteFrom}`,
    image: "/marketing/service-website.jpg",
    learnMoreHref: "/websites",
    startHref: "/build/intro",
    startLabel: "Get Website Quote",
    learnEvent: "cta_home_website_learn",
    startEvent: "cta_home_website_start",
  },
  {
    label: "Sell",
    title: "E-Commerce Systems",
    description:
      "Storefront, checkout, and post-purchase systems built to reduce friction and support cleaner online selling.",
    who: "Best when your real issue is not just having a store, but improving how the store sells and operates.",
    pricing: "Scoped after intake",
    image: "/marketing/service-ecommerce.jpg",
    learnMoreHref: "/ecommerce",
    startHref: "/ecommerce/intake",
    startLabel: "Start E-Commerce Intake",
    learnEvent: "cta_home_ecom_learn",
    startEvent: "cta_home_ecom_start",
  },
  {
    label: "Streamline",
    title: "Workflow Systems",
    description:
      "Operational systems for intake, routing, handoffs, status updates, and admin work that should not be manual anymore.",
    who: "Best when the business is losing time to repetitive tasks, disconnected tools, and messy handoffs.",
    pricing: `Starts at ${opsFrom}`,
    image: "/marketing/service-ops.jpg",
    learnMoreHref: "/systems",
    startHref: "/ops-intake",
    startLabel: "Start Workflow Audit",
    learnEvent: "cta_home_ops_learn",
    startEvent: "cta_home_ops_start",
  },
] as const;

export default function Home() {
  return (
    <main className={styles.home10x}>
      <ScrollReveal />

      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          <Image
            src="/marketing/hero-convergence.png"
            alt="Abstract convergence of three service lanes into one unified growth system"
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay} />
          <div className={styles.heroGlow} />
        </div>

        <div className={`container ${styles.heroContainer}`}>
          <div className={styles.heroShell}>
            <div className={`${styles.heroCopy} heroFadeUp`}>
              <div className="kicker">Unified Growth System</div>

              <h1 className={`h1 ${styles.heroTitle}`}>
                Three service lanes.
                <span className={styles.accent}> One cleaner growth engine.</span>
              </h1>

              <p className={styles.heroSubheadline}>
                Websites, e-commerce, and workflow systems designed to help your
                business look better, sell better, and run cleaner.
              </p>

              <div className={styles.heroActions}>
                <TrackLink
                  href="/#services"
                  event="cta_home_hero_start_here"
                  className="btn btnPrimary btnLg"
                >
                  Explore Services <span className="btnArrow">→</span>
                </TrackLink>

                <TrackLink
                  href="/process"
                  event="cta_home_hero_process"
                  className="btn btnGhost btnLg"
                >
                  How It Works
                </TrackLink>
              </div>
            </div>

            <aside className={`${styles.heroPanel} heroFadeUp`}>
              <div className={styles.panelEyebrow}>Start with the right lane</div>
              <div className={styles.panelTitle}>
                Pick the problem you need solved first.
              </div>

              <div className={styles.laneList}>
                <Link href="/websites" className={styles.laneItem}>
                  <div className={styles.laneDot} />
                  <div>
                    <strong>Grow</strong>
                    <span>Trust, credibility, and lead conversion.</span>
                  </div>
                </Link>

                <Link href="/ecommerce" className={styles.laneItem}>
                  <div className={styles.laneDot} />
                  <div>
                    <strong>Sell</strong>
                    <span>Storefront flow, checkout, and order experience.</span>
                  </div>
                </Link>

                <Link href="/systems" className={styles.laneItem}>
                  <div className={styles.laneDot} />
                  <div>
                    <strong>Streamline</strong>
                    <span>Internal operations, routing, and automation.</span>
                  </div>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="services" className={`section ${styles.services}`}>
        <div className="container">
          <div className={`${styles.sectionHead} fadeUp`}>
            <div className={styles.eyebrow}>Services</div>
            <h2 className={`h2 ${styles.sectionTitle}`}>
              Pick the lane that matches your biggest problem
            </h2>
          </div>

          <div className={styles.cardGrid}>
            {services.map((service, i) => (
              <article
                key={service.title}
                className={`${styles.serviceCard} card scaleIn stagger-${Math.min(i + 1, 4)}`}
              >
                <Link href={service.learnMoreHref} className={styles.imageLink}>
                  <div className={styles.imageWrap}>
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      sizes="(max-width: 980px) 100vw, 33vw"
                      className={styles.image}
                      priority={i === 0}
                    />
                    <div className={styles.imageOverlay} />
                  </div>
                </Link>

                <div className={styles.cardBody}>
                  <div className={styles.cardLabel}>{service.label}</div>

                  <Link href={service.learnMoreHref} className={styles.titleLink}>
                    <h3 className={styles.cardTitle}>{service.title}</h3>
                  </Link>

                  <p className={styles.cardDesc}>{service.description}</p>

                  <div className={styles.whoBox}>
                    <span>Who it's for:</span> {service.who}
                  </div>

                  <div className={styles.pricing}>{service.pricing}</div>

                  <div className={styles.cardActions}>
                    <TrackLink
                      href={service.startHref}
                      event={service.startEvent}
                      className={`btn btnPrimary ${styles.startButton}`}
                    >
                      {service.startLabel} <span className="btnArrow">→</span>
                    </TrackLink>

                    <TrackLink
                      href={service.learnMoreHref}
                      event={service.learnEvent}
                      className={`btn btnGhost ${styles.learnButton}`}
                    >
                      Learn More
                    </TrackLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="guide" className={`section ${styles.guideSection}`}>
        <div className="container">
          <div className={`${styles.guideWrapper} card scaleIn`}>
            <LaneGuide />
          </div>
        </div>
      </section>
    </main>
  );
}
