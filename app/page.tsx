import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/site/ScrollReveal";
import TrackLink from "@/components/site/TrackLink";
import { OPS_TIER_CONFIG, WEBSITE_TIER_CONFIG, money } from "@/lib/pricing";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

const websiteFrom = money(WEBSITE_TIER_CONFIG.starter_site.min);
const opsFrom = money(OPS_TIER_CONFIG.quick_workflow_fix.min);

const services = [
  {
    label: "Service 1",
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
    label: "Service 2",
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
    label: "Service 3",
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

const comparison = [
  {
    title: "Choose Websites if...",
    text:
      "your biggest problem is trust, credibility, positioning, or lead conversion.",
    learnMoreHref: "/websites",
    startHref: "/build/intro",
    startLabel: "Start Website Quote",
  },
  {
    title: "Choose E-Commerce if...",
    text:
      "your biggest problem is online selling flow, checkout friction, product-page clarity, or store operations.",
    learnMoreHref: "/ecommerce",
    startHref: "/ecommerce/intake",
    startLabel: "Start E-Commerce Intake",
  },
  {
    title: "Choose Workflow Systems if...",
    text:
      "your biggest problem is admin drag, routing, status updates, manual handoffs, or disconnected tools.",
    learnMoreHref: "/systems",
    startHref: "/ops-intake",
    startLabel: "Start Workflow Audit",
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
          <div className={styles.heroContent}>
            <div className="kicker">Unified Growth System</div>

            <h1 className={`h1 ${styles.heroTitle}`}>
              Three service lanes.
              <span className={styles.accent}> One cleaner growth engine.</span>
            </h1>

            <div className={styles.heroLaneStack}>
              <Link href="/websites" className={styles.heroLaneRow}>
                <span className={styles.heroLaneName}>Websites:</span>
                <span className={styles.heroLaneText}>
                  trust, credibility, and lead conversion.
                </span>
              </Link>

              <Link href="/ecommerce" className={styles.heroLaneRow}>
                <span className={styles.heroLaneName}>E-Commerce:</span>
                <span className={styles.heroLaneText}>
                  storefront, checkout, and order experience.
                </span>
              </Link>

              <Link href="/systems" className={styles.heroLaneRow}>
                <span className={styles.heroLaneName}>Workflow Systems:</span>
                <span className={styles.heroLaneText}>
                  internal operations, routing, and automation.
                </span>
              </Link>
            </div>

            <p className={styles.heroSupport}>
              CrecyStudio helps businesses build a stronger online presence,
              improve customer-facing sales flow, and remove backend friction so
              growth feels more organized from first click to fulfillment.
            </p>
          </div>
        </div>
      </section>

      <section id="services" className={`section ${styles.services}`}>
        <div className="container">
          <div className={`${styles.sectionHead} fadeUp`}>
            <div className={styles.eyebrow}>Services</div>
            <h2 className={`h2 ${styles.sectionTitle}`}>
              Learn more first, then start the right flow
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
                    <span>Who it’s for:</span> {service.who}
                  </div>

                  <div className={styles.pricing}>{service.pricing}</div>

                  <div className={styles.cardActions}>
                    <TrackLink
                      href={service.learnMoreHref}
                      event={service.learnEvent}
                      className={`btn btnGhost ${styles.learnButton}`}
                    >
                      Learn More
                    </TrackLink>

                    <TrackLink
                      href={service.startHref}
                      event={service.startEvent}
                      className={`btn btnPrimary ${styles.startButton}`}
                    >
                      {service.startLabel} <span className="btnArrow">→</span>
                    </TrackLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.compareSection}`}>
        <div className="container">
          <div className={`${styles.sectionHead} fadeUp`}>
            <div className={styles.eyebrow}>Comparison</div>
            <h2 className={`h2 ${styles.sectionTitle}`}>
              Not sure which lane fits your problem?
            </h2>
          </div>

          <div className={styles.compareGrid}>
            {comparison.map((item, i) => (
              <article
                key={item.title}
                className={`${styles.compareCard} card fadeUp stagger-${Math.min(i + 1, 4)}`}
              >
                <h3 className={styles.compareTitle}>{item.title}</h3>
                <p className={styles.compareText}>{item.text}</p>

                <div className={styles.compareActions}>
                  <Link href={item.learnMoreHref} className="btn btnGhost">
                    Learn More
                  </Link>
                  <Link href={item.startHref} className="btn btnPrimary">
                    {item.startLabel} <span className="btnArrow">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.bottomCta}`}>
        <div className="container">
          <div className={`${styles.bottomPanel} card scaleIn`}>
            <div className={styles.bottomEyebrow}>Ready to move?</div>
            <h2 className={`h2 ${styles.bottomTitle}`}>
              Start with the right lane — not the wrong form.
            </h2>
            <p className={styles.bottomText}>
              Use the service pages to understand what each lane does, then move
              into the quote or intake flow that actually matches your business.
            </p>

            <div className={styles.bottomActions}>
              <TrackLink
                href="/#services"
                event="cta_home_bottom_start_here"
                className="btn btnPrimary"
              >
                Start Here <span className="btnArrow">→</span>
              </TrackLink>

              <TrackLink
                href="/process"
                event="cta_home_bottom_process"
                className="btn btnGhost"
              >
                See the Process
              </TrackLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}