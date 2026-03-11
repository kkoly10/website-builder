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
    <main className="home10x">
      <ScrollReveal />

      <section className="home10xHero section">
        <div className="container">
          <div className="home10xHeroShell card fadeUp inView">
            <div className="home10xHeroCopy">
              <div className="kicker">Unified Growth System</div>

              <h1 className="h1 home10xHeroTitle">
                One studio for your
                <span className="home10xAccent"> website</span>,
                <span className="home10xAccent"> e-commerce</span>, and
                <span className="home10xAccent"> operations</span>.
              </h1>

              <p className="p home10xHeroText">
                CrecyStudio helps local businesses look premium online, tighten
                their buying flow, and remove manual backend friction so growth
                feels cleaner from first click to fulfillment.
              </p>

              <div className="home10xHeroActions">
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

              <div className="home10xMiniPills">
                <span className="pill">Free estimate paths</span>
                <span className="pill">{PRICING_MESSAGES.depositPolicy}</span>
                <span className="pill">Scoped before build</span>
              </div>
            </div>

            <div className="home10xHeroPanel">
              <div className="home10xHeroPanelTop">
                <div className="home10xPanelEyebrow">What this solves</div>
                <div className="home10xPanelTitle">Three lanes. One cleaner growth plan.</div>
              </div>

              <div className="home10xLaneList">
                <div className="home10xLaneItem">
                  <div className="home10xLaneDot" />
                  <div>
                    <strong>Website Building</strong>
                    <span>Sharpen credibility, conversion, and lead capture.</span>
                  </div>
                </div>

                <div className="home10xLaneItem">
                  <div className="home10xLaneDot" />
                  <div>
                    <strong>E-Commerce Systems</strong>
                    <span>Improve storefront flow and post-checkout operations.</span>
                  </div>
                </div>

                <div className="home10xLaneItem">
                  <div className="home10xLaneDot" />
                  <div>
                    <strong>Ops Workflow Automation</strong>
                    <span>Remove manual handoffs, status confusion, and admin drag.</span>
                  </div>
                </div>
              </div>

              <div className="home10xHeroPanelFoot">
                Best for businesses that are growing faster than their current systems.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home10xServices section">
        <div className="container">
          <div className="home10xSectionHead fadeUp">
            <div className="home10xEyebrow">All Services</div>
            <h2 className="h2 home10xSectionTitle">Three service cards + who each is for</h2>
          </div>

          <div className="home10xCardGrid">
            {services.map((service, i) => (
              <article
                key={service.title}
                className={`home10xServiceCard card scaleIn stagger-${Math.min(i + 1, 4)}`}
              >
                <div className="home10xImageWrap">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 980px) 100vw, 33vw"
                    className="home10xImage"
                    priority={i === 0}
                  />
                  <div className="home10xImageOverlay" />
                </div>

                <div className="home10xCardBody">
                  <div className="home10xCardLabel">{service.label}</div>
                  <h3 className="home10xCardTitle">{service.title}</h3>
                  <p className="home10xCardDesc">{service.description}</p>

                  <div className="home10xWhoBox">
                    <span>Who it’s for:</span> {service.who}
                  </div>

                  <div className="home10xPricing">{service.pricing}</div>

                  <TrackLink
                    href={service.href}
                    event={service.event}
                    className="btn btnGhost home10xCardButton"
                  >
                    {service.cta} <span className="btnArrow">→</span>
                  </TrackLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home10xProcess section">
        <div className="container">
          <div className="home10xSectionHead fadeUp">
            <div className="home10xEyebrow">Process</div>
            <h2 className="h2 home10xSectionTitle">Simple from intake to launch</h2>
          </div>

          <div className="home10xProcessGrid">
            {processSteps.map((step, i) => (
              <div
                key={step.n}
                className={`home10xProcessCard card fadeUp stagger-${Math.min(i + 1, 4)}`}
              >
                <div className="home10xProcessNum">{step.n}</div>
                <div className="home10xProcessTitle">{step.title}</div>
                <p className="home10xProcessDesc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home10xBottomCta section">
        <div className="container">
          <div className="home10xBottomPanel card scaleIn">
            <div className="home10xBottomEyebrow">Ready to start?</div>
            <h2 className="h2 home10xBottomTitle">Start with one unified growth plan.</h2>
            <p className="home10xBottomText">
              We&apos;ll route you into the right lane and prioritize the highest-leverage
              move first — website, e-commerce, or operations.
            </p>

            <div className="home10xBottomActions">
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

      <style jsx global>{`
        .home10x {
          background:
            radial-gradient(900px 480px at 12% 0%, rgba(201, 168, 76, 0.06), transparent 55%),
            radial-gradient(900px 520px at 88% 8%, rgba(66, 92, 180, 0.12), transparent 52%),
            linear-gradient(180deg, #070b14 0%, #090d18 46%, #070b14 100%);
        }

        .home10x .section {
          padding: 76px 0;
        }

        .home10xHero {
          padding-top: 54px;
          padding-bottom: 44px;
        }

        .home10xHeroShell {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 28px;
          padding: 28px;
          background:
            linear-gradient(180deg, rgba(18, 24, 42, 0.92), rgba(10, 14, 24, 0.95));
          border: 1px solid rgba(74, 86, 126, 0.38);
          box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.38),
            inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        .home10xHeroTitle {
          margin-top: 18px;
          max-width: 760px;
          line-height: 1.02;
        }

        .home10xAccent {
          color: #d8b455;
        }

        .home10xHeroText {
          max-width: 720px;
          margin-top: 16px;
          font-size: 18px;
          color: #a9afc1;
        }

        .home10xHeroActions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        .home10xMiniPills {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .home10xHeroPanel {
          border-radius: 18px;
          border: 1px solid rgba(77, 89, 129, 0.4);
          background:
            linear-gradient(180deg, rgba(15, 22, 40, 0.92), rgba(11, 16, 29, 0.98));
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 100%;
        }

        .home10xHeroPanelTop {
          margin-bottom: 18px;
        }

        .home10xPanelEyebrow,
        .home10xEyebrow,
        .home10xBottomEyebrow {
          color: #d6b25d;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .home10xPanelTitle {
          margin-top: 10px;
          font-size: 22px;
          font-weight: 800;
          line-height: 1.15;
          color: #eef2ff;
        }

        .home10xLaneList {
          display: grid;
          gap: 14px;
        }

        .home10xLaneItem {
          display: grid;
          grid-template-columns: 10px 1fr;
          gap: 12px;
          align-items: start;
          padding: 12px 0;
          border-top: 1px solid rgba(67, 75, 108, 0.32);
        }

        .home10xLaneItem:first-child {
          border-top: 0;
          padding-top: 0;
        }

        .home10xLaneDot {
          width: 10px;
          height: 10px;
          margin-top: 6px;
          border-radius: 999px;
          background: linear-gradient(135deg, #d7b45d, #8da4ff);
          box-shadow: 0 0 16px rgba(141, 164, 255, 0.26);
        }

        .home10xLaneItem strong {
          display: block;
          color: #f0f3ff;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .home10xLaneItem span {
          color: #98a1b7;
          font-size: 14px;
          line-height: 1.5;
        }

        .home10xHeroPanelFoot {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(67, 75, 108, 0.32);
          color: #7e879f;
          font-size: 13px;
          line-height: 1.55;
        }

        .home10xSectionHead {
          margin-bottom: 24px;
        }

        .home10xSectionTitle {
          margin-top: 10px;
          color: #eef2ff;
        }

        .home10xCardGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .home10xServiceCard {
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid rgba(68, 79, 114, 0.48);
          background:
            linear-gradient(180deg, rgba(14, 20, 35, 0.98), rgba(10, 14, 24, 0.98));
          box-shadow: 0 16px 44px rgba(0, 0, 0, 0.24);
        }

        .home10xImageWrap {
          position: relative;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          border-bottom: 1px solid rgba(68, 79, 114, 0.34);
        }

        .home10xImage {
          object-fit: cover;
        }

        .home10xImageOverlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(4, 8, 18, 0.04), rgba(4, 8, 18, 0.22));
          pointer-events: none;
        }

        .home10xCardBody {
          padding: 18px 18px 20px;
        }

        .home10xCardLabel {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(215, 180, 93, 0.28);
          background: rgba(215, 180, 93, 0.08);
          color: #d6b25d;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .home10xCardTitle {
          margin: 14px 0 8px;
          font-size: 33px;
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: #eef2ff;
          font-weight: 800;
        }

        .home10xCardDesc {
          margin: 0;
          color: #9aa3b8;
          font-size: 15px;
          line-height: 1.62;
        }

        .home10xWhoBox {
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px dashed rgba(89, 100, 138, 0.44);
          background: rgba(255, 255, 255, 0.02);
          color: #b6bdd0;
          font-size: 13px;
          line-height: 1.55;
        }

        .home10xWhoBox span {
          color: #e8ecfa;
          font-weight: 800;
        }

        .home10xPricing {
          margin-top: 14px;
          color: #d4dae9;
          font-size: 14px;
          font-weight: 700;
        }

        .home10xCardButton {
          width: 100%;
          margin-top: 16px;
          justify-content: center;
        }

        .home10xProcess {
          border-top: 1px solid rgba(44, 53, 79, 0.52);
          border-bottom: 1px solid rgba(44, 53, 79, 0.52);
          background: rgba(6, 9, 18, 0.34);
        }

        .home10xProcessGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .home10xProcessCard {
          padding: 24px 20px;
          border-radius: 16px;
          background:
            linear-gradient(180deg, rgba(12, 18, 32, 0.96), rgba(9, 13, 23, 0.98));
          border: 1px solid rgba(68, 79, 114, 0.42);
        }

        .home10xProcessNum {
          color: #d6b25d;
          font-size: 42px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.05em;
          margin-bottom: 18px;
        }

        .home10xProcessTitle {
          color: #eef2ff;
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .home10xProcessDesc {
          margin: 0;
          color: #98a1b7;
          font-size: 14px;
          line-height: 1.55;
        }

        .home10xBottomPanel {
          padding: 28px;
          border-radius: 18px;
          border: 1px solid rgba(71, 83, 122, 0.42);
          background:
            radial-gradient(900px 280px at 70% 10%, rgba(79, 101, 203, 0.16), transparent 48%),
            linear-gradient(180deg, rgba(13, 20, 36, 0.96), rgba(10, 14, 24, 0.98));
        }

        .home10xBottomTitle {
          margin-top: 12px;
          color: #eef2ff;
          font-size: clamp(34px, 4vw, 54px);
          letter-spacing: -0.05em;
        }

        .home10xBottomText {
          margin-top: 10px;
          max-width: 760px;
          color: #9aa3b8;
          font-size: 18px;
          line-height: 1.65;
        }

        .home10xBottomActions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        @media (max-width: 1100px) {
          .home10xCardTitle {
            font-size: 29px;
          }
        }

        @media (max-width: 980px) {
          .home10xHeroShell {
            grid-template-columns: 1fr;
          }

          .home10xCardGrid {
            grid-template-columns: 1fr;
          }

          .home10xProcessGrid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 640px) {
          .home10x .section {
            padding: 56px 0;
          }

          .home10xHeroShell,
          .home10xBottomPanel {
            padding: 20px;
          }

          .home10xHeroText,
          .home10xBottomText {
            font-size: 16px;
          }

          .home10xCardTitle {
            font-size: 26px;
          }

          .home10xProcessGrid {
            grid-template-columns: 1fr;
          }

          .home10xHeroActions,
          .home10xBottomActions {
            flex-direction: column;
          }

          .home10xHeroActions .btn,
          .home10xBottomActions .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </main>
  );
}