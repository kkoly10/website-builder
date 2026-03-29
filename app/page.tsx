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

export default function Home() {
  return (
    <main className={styles.home10x}>
      <ScrollReveal />

      {/* ═══════════════════════════════
          HERO
          ═══════════════════════════════ */}
      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          <Image
            src="/marketing/hero-convergence.png"
            alt="Three service lanes converging into one growth system"
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
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                Web studio for small businesses
              </div>

              <h1 className={`h1 ${styles.heroTitle}`}>
                Your business deserves a website
                <span className={styles.accent}> that actually works.</span>
              </h1>

              <p className={styles.heroSub}>
                We build websites that earn trust and convert visitors. We automate
                the workflows that eat your time. And we fix the e-commerce systems
                that leak your revenue.
              </p>

              <div className={styles.heroPricing}>
                Websites from <strong>{websiteFrom}</strong> · Workflow automation
                from <strong>{opsFrom}</strong> · Free estimate in 24 hours
              </div>

              <div className={styles.heroActions}>
                <TrackLink
                  href="/build/intro"
                  event="cta_home_hero_quote"
                  className="btn btnPrimary btnLg"
                >
                  Get your free estimate <span className="btnArrow">→</span>
                </TrackLink>
                <TrackLink
                  href="/#how-it-works"
                  event="cta_home_hero_how"
                  className="btn btnGhost btnLg"
                >
                  See how it works
                </TrackLink>
              </div>
            </div>

            <aside className={`${styles.heroPanel} heroFadeUp`}>
              <div className={styles.panelEyebrow}>Pick your problem</div>
              <div className={styles.panelTitle}>
                Which one is costing you the most?
              </div>

              <div className={styles.laneList}>
                <Link href="/#services" className={styles.laneItem}>
                  <div className={styles.laneDot} style={{ background: "#c9a84c" }} />
                  <div>
                    <strong>My website looks amateur</strong>
                    <span>Get a site that makes people trust you on sight.</span>
                  </div>
                </Link>
                <Link href="/#services" className={styles.laneItem}>
                  <div className={styles.laneDot} style={{ background: "#5DCAA5" }} />
                  <div>
                    <strong>I&apos;m drowning in repetitive work</strong>
                    <span>Automate the tasks you do the same way every time.</span>
                  </div>
                </Link>
                <Link href="/#services" className={styles.laneItem}>
                  <div className={styles.laneDot} style={{ background: "#8da4ff" }} />
                  <div>
                    <strong>My store isn&apos;t converting</strong>
                    <span>Fix checkout, fulfillment, and post-purchase flow.</span>
                  </div>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          THREE EQUAL LANES
          ═══════════════════════════════ */}
      <section id="services" className={`section ${styles.lanesSection}`}>
        <div className="container">
          <div className={`${styles.sectionHead} fadeUp`}>
            <div className={styles.eyebrow}>Three services, one studio</div>
            <h2 className={`h2 ${styles.sectionTitle}`}>
              Pick the problem. We build the fix.
            </h2>
          </div>

          <div className={`${styles.lanesGrid} fadeUp`}>
            {/* ── WEBSITES ── */}
            <div className={styles.laneCard}>
              <div className={styles.laneCardAccent} style={{ background: "#c9a84c" }} />
              <div className={styles.laneCardInner}>
                <div className={styles.laneCardLabel} style={{ color: "#c9a84c", borderColor: "rgba(201,168,76,0.25)", background: "rgba(201,168,76,0.06)" }}>
                  Grow
                </div>
                <h3 className={styles.laneCardTitle}>Website building</h3>
                <p className={styles.laneCardDesc}>
                  Your website is the first thing people check before they call,
                  book, or buy. We build custom sites that load fast, look premium,
                  and turn visitors into leads — not template sites with your logo
                  pasted on.
                </p>

                <div className={styles.laneCardChecks}>
                  <span>Custom design, no templates</span>
                  <span>Mobile-first, SEO-ready</span>
                  <span>Forms, booking, analytics included</span>
                  <span>You own the code and domain</span>
                </div>

                <div className={styles.laneCardPrice}>
                  <span className={styles.laneCardPriceLabel}>From</span>
                  <span className={styles.laneCardPriceValue}>{websiteFrom}</span>
                </div>

                <div className={styles.laneCardActions}>
                  <TrackLink href="/build/intro" event="cta_home_web_start" className="btn btnPrimary">
                    Get website quote <span className="btnArrow">→</span>
                  </TrackLink>
                  <TrackLink href="/websites" event="cta_home_web_learn" className="btn btnGhost">
                    Learn more
                  </TrackLink>
                </div>
              </div>
            </div>

            {/* ── AUTOMATION ── */}
            <div className={styles.laneCard}>
              <div className={styles.laneCardAccent} style={{ background: "#5DCAA5" }} />
              <div className={styles.laneCardInner}>
                <div className={styles.laneCardLabel} style={{ color: "#5DCAA5", borderColor: "rgba(93,202,165,0.25)", background: "rgba(93,202,165,0.06)" }}>
                  Streamline
                </div>
                <h3 className={styles.laneCardTitle}>Workflow automation</h3>
                <p className={styles.laneCardDesc}>
                  If you&apos;re copying data between tools, sending the same emails
                  manually, or losing track of handoffs — we build the automation
                  that eliminates the repetition. Zapier, Make.com, or custom
                  integrations.
                </p>

                <div className={styles.laneCardChecks}>
                  <span>Audit your current workflow first</span>
                  <span>Zapier, Make.com, custom builds</span>
                  <span>Intake routing, notifications, CRM</span>
                  <span>Ongoing support available</span>
                </div>

                <div className={styles.laneCardPrice}>
                  <span className={styles.laneCardPriceLabel}>From</span>
                  <span className={styles.laneCardPriceValue}>{opsFrom}</span>
                </div>

                <div className={styles.laneCardActions}>
                  <TrackLink href="/ops-intake" event="cta_home_ops_start" className="btn btnPrimary">
                    Start workflow audit <span className="btnArrow">→</span>
                  </TrackLink>
                  <TrackLink href="/systems" event="cta_home_ops_learn" className="btn btnGhost">
                    Learn more
                  </TrackLink>
                </div>
              </div>
            </div>

            {/* ── E-COMMERCE ── */}
            <div className={styles.laneCard}>
              <div className={styles.laneCardAccent} style={{ background: "#8da4ff" }} />
              <div className={styles.laneCardInner}>
                <div className={styles.laneCardLabel} style={{ color: "#8da4ff", borderColor: "rgba(141,164,255,0.25)", background: "rgba(141,164,255,0.06)" }}>
                  Sell
                </div>
                <h3 className={styles.laneCardTitle}>E-commerce support</h3>
                <p className={styles.laneCardDesc}>
                  Your store exists but something isn&apos;t working — checkout
                  drops, messy fulfillment, no post-purchase flow. We diagnose
                  what&apos;s leaking revenue and fix the operational side so you
                  sell more with less friction.
                </p>

                <div className={styles.laneCardChecks}>
                  <span>Checkout and conversion audit</span>
                  <span>Fulfillment and shipping flow</span>
                  <span>Post-purchase automation</span>
                  <span>Shopify, WooCommerce, custom</span>
                </div>

                <div className={styles.laneCardPrice}>
                  <span className={styles.laneCardPriceLabel}>Pricing</span>
                  <span className={styles.laneCardPriceValue}>Scoped after intake</span>
                </div>

                <div className={styles.laneCardActions}>
                  <TrackLink href="/ecommerce/intake" event="cta_home_ecom_start" className="btn btnPrimary">
                    Start e-commerce intake <span className="btnArrow">→</span>
                  </TrackLink>
                  <TrackLink href="/ecommerce" event="cta_home_ecom_learn" className="btn btnGhost">
                    Learn more
                  </TrackLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          VISUAL PROCESS TIMELINE
          ═══════════════════════════════ */}
      <section id="how-it-works" className={`section ${styles.processSection}`}>
        <div className="container">
          <div className={`${styles.sectionHead} fadeUp`}>
            <div className={styles.eyebrow}>How it works</div>
            <h2 className={`h2 ${styles.sectionTitle}`}>
              From &quot;I need help&quot; to launched — in four steps
            </h2>
          </div>

          <div className={`${styles.timeline} fadeUp`}>
            <div className={styles.timelineLine} />

            <div className={styles.timelineStep}>
              <div className={styles.timelineDot}>
                <div className={styles.timelineDotInner}>1</div>
              </div>
              <div className={styles.timelineContent}>
                <h3 className={styles.timelineTitle}>Tell us what you need</h3>
                <p className={styles.timelineBody}>
                  Fill out a 2-minute form about your business, goals, and timeline.
                  No sales call required. We ask the right questions so we can scope
                  your project accurately.
                </p>
                <div className={styles.timelineTag}>Takes 2 minutes</div>
              </div>
            </div>

            <div className={styles.timelineStep}>
              <div className={styles.timelineDot}>
                <div className={styles.timelineDotInner}>2</div>
              </div>
              <div className={styles.timelineContent}>
                <h3 className={styles.timelineTitle}>Get a detailed estimate in 24 hours</h3>
                <p className={styles.timelineBody}>
                  Our system scores your project and generates a scope with pricing,
                  timeline, pages included, and what&apos;s excluded. You review
                  everything in your own private workspace.
                </p>
                <div className={styles.timelineTag}>AI-assisted scoping</div>
              </div>
            </div>

            <div className={styles.timelineStep}>
              <div className={styles.timelineDot}>
                <div className={styles.timelineDotInner}>3</div>
              </div>
              <div className={styles.timelineContent}>
                <h3 className={styles.timelineTitle}>We build — you watch it come together</h3>
                <p className={styles.timelineBody}>
                  Once you approve and send the deposit, we start building. You see
                  a live preview, track milestones, submit feedback, and upload your
                  content — all from one workspace.
                </p>
                <div className={styles.timelineTag}>Live preview included</div>
              </div>
            </div>

            <div className={styles.timelineStep}>
              <div className={styles.timelineDot}>
                <div className={styles.timelineDotInner}>4</div>
              </div>
              <div className={styles.timelineContent}>
                <h3 className={styles.timelineTitle}>Launch and handoff — you own everything</h3>
                <p className={styles.timelineBody}>
                  Domain connected, analytics set up, forms tested, SEO basics done.
                  We hand you the keys. Your code, your domain, your data. No vendor
                  lock-in, no monthly hostage fees.
                </p>
                <div className={styles.timelineTag}>Full ownership</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          WORKSPACE DEMO — Show the actual portal
          ═══════════════════════════════ */}
      <section className={`section ${styles.demoSection}`}>
        <div className="container">
          <div className={`${styles.sectionHead} fadeUp`}>
            <div className={styles.eyebrow}>Your private workspace</div>
            <h2 className={`h2 ${styles.sectionTitle}`}>
              Every project gets a client portal — not just a website
            </h2>
            <p className={styles.sectionSub}>
              Most studios send a PDF and disappear for three weeks. We built an
              entire project workspace so you always know where things stand.
            </p>
          </div>

          <div className={`${styles.demoShell} fadeUp`}>
            {/* Browser chrome */}
            <div className={styles.demoBrowser}>
              <div className={styles.demoBrowserBar}>
                <div className={styles.demoDots}>
                  <span style={{ background: "#c9a84c", opacity: 0.7 }} />
                  <span style={{ background: "rgba(255,255,255,0.1)" }} />
                  <span style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
                <div className={styles.demoUrl}>crecy.studio/portal/your-project</div>
              </div>

              <div className={styles.demoBody}>
                {/* Story headline */}
                <div className={styles.demoKicker}>
                  <span className={styles.demoKickerDot} />
                  Website project
                </div>
                <div className={styles.demoHeadline}>
                  Your website is <em>ready for review</em>
                </div>
                <div className={styles.demoCta}>Open your preview →</div>

                {/* Journey map */}
                <div className={styles.demoJourney}>
                  {["Intake", "Agreement", "Deposit", "Content", "Preview", "Review", "Launch"].map(
                    (step, i) => (
                      <div key={step} className={styles.demoJourneyStep}>
                        <div
                          className={styles.demoJourneyDot}
                          style={{
                            background: i < 5 ? "#c9a84c" : "transparent",
                            border: i === 5 ? "2px solid #c9a84c" : i < 5 ? "none" : "2px solid rgba(255,255,255,0.1)",
                          }}
                        />
                        <span
                          style={{
                            color: i < 5 ? "rgba(255,255,255,0.7)" : i === 5 ? "#c9a84c" : "rgba(255,255,255,0.2)",
                            fontWeight: i === 5 ? 600 : 400,
                          }}
                        >
                          {step}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Feature highlights */}
                <div className={styles.demoFeatures}>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureTitle}>Live preview</div>
                    <div className={styles.demoFeatureDesc}>
                      See your website before it goes public
                    </div>
                  </div>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureTitle}>Upload content</div>
                    <div className={styles.demoFeatureDesc}>
                      Drop logos, photos, and copy in one place
                    </div>
                  </div>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureTitle}>Leave feedback</div>
                    <div className={styles.demoFeatureDesc}>
                      Request revisions with priority levels
                    </div>
                  </div>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureTitle}>Track launch</div>
                    <div className={styles.demoFeatureDesc}>
                      Domain, analytics, SEO — all checked off
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.demoCaption}>
              This is a real screenshot of the workspace every client gets.
              No PDFs, no email chains, no guessing.
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          LANE GUIDE
          ═══════════════════════════════ */}
      <section id="guide" className={`section ${styles.guideSection}`}>
        <div className="container">
          <div className={`${styles.sectionHead} fadeUp`}>
            <div className={styles.eyebrow}>Not sure where to start?</div>
            <h2 className={`h2 ${styles.sectionTitle}`}>
              Answer 3 questions — we&apos;ll recommend the right service
            </h2>
          </div>
          <div className={`${styles.guideWrapper} card scaleIn`}>
            <LaneGuide />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          CLOSING CTA
          ═══════════════════════════════ */}
      <section className={`section ${styles.closingSection}`}>
        <div className="container">
          <div className={`${styles.closingCard} fadeUp`}>
            <h2 className={`h2 ${styles.closingTitle}`}>
              Ready to stop losing customers
              <span className={styles.accent}> to a bad first impression?</span>
            </h2>
            <p className={styles.closingDesc}>
              Get a free estimate in 24 hours. No call required, no commitment,
              no pressure. Tell us what you need and we&apos;ll show you exactly
              what it costs and how fast we can deliver.
            </p>
            <div className={styles.closingPricing}>
              Websites from <strong>{websiteFrom}</strong> · Automation from{" "}
              <strong>{opsFrom}</strong> · E-commerce scoped after intake
            </div>
            <div className={styles.closingActions}>
              <TrackLink
                href="/build/intro"
                event="cta_home_closing_start"
                className="btn btnPrimary btnLg"
              >
                Get your free estimate <span className="btnArrow">→</span>
              </TrackLink>
              <TrackLink
                href="/faq"
                event="cta_home_closing_faq"
                className="btn btnGhost btnLg"
              >
                Read the FAQ
              </TrackLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
