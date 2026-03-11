// app/page.tsx
import ScrollReveal from "@/components/site/ScrollReveal";
import TrackLink from "@/components/site/TrackLink";

export const dynamic = "force-dynamic";

const serviceCards = [
  {
    id: "1",
    title: "Website Building",
    image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Website design shown on desktop monitor",
    desc: "Premium conversion websites for brands that need a stronger first impression and cleaner lead capture.",
    who: "Who it’s for: businesses with outdated sites and low-quality leads from current traffic.",
    price: "Starts at: $1,500",
    href: "/build/intro",
    event: "cta_home_services_website",
  },
  {
    id: "2",
    title: "E-Commerce Systems",
    image: "https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "E-commerce order and checkout process",
    desc: "Storefront and backend flow upgrades for cleaner order operations, higher clarity, and better retention.",
    who: "Who it’s for: sellers scaling order volume with friction across checkout and fulfillment.",
    price: "Pricing: Transparent tiered options",
    href: "/ecommerce",
    event: "cta_home_services_ecommerce",
  },
  {
    id: "3",
    title: "Ops Workflow Automation",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Automation and AI workflow concept",
    desc: "Automation for intake, routing, status, and handoff so teams spend less time on repetitive admin tasks.",
    who: "Who it’s for: teams managing growth through manual handoffs and disconnected tools.",
    price: "Starts at: $1,000",
    href: "/systems",
    event: "cta_home_services_ops",
  },
];

export default function Home() {
  return (
    <main className="homePage">
      <ScrollReveal />

      <section className="section heroSection">
        <div className="container heroContainer">
          <div className="heroFadeUp">
            <div className="kicker">Premium Websites + E-Commerce Systems for Local Brands</div>
          </div>

          <h1 className="h1 heroFadeUp stagger-1">
            Look premium at first click.
            <br />
            Convert more visitors into buyers.
          </h1>

          <p className="p heroSubtitle heroFadeUp stagger-2">
            We build conversion-focused websites and e-commerce systems that sharpen brand perception,
            improve buyer flow, and reduce manual backend drag.
          </p>

          <div className="heroActions heroFadeUp stagger-3">
            <TrackLink href="/build/intro" event="cta_home_hero_unified" className="btn btnPrimary btnLg">
              Get My Growth Plan <span className="btnArrow">→</span>
            </TrackLink>
            <TrackLink href="#how-it-works" event="cta_home_hero_how" className="btn btnGhost btnLg">
              See How It Works
            </TrackLink>
          </div>

          <div className="pills heroPills heroFadeUp stagger-4">
            <span className="pill">3-min intake</span>
            <span className="pill">Scoped estimate in 24h</span>
            <span className="pill">Pricing visible upfront</span>
            <span className="pill">Website + E-Commerce priority</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid2stretch">
            <div className="card cardMedia cardHover scaleIn">
              <div className="cardInner">
                <img src="https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1400&q=80" alt="Website lane outcome preview" width={1200} height={700} style={{ aspectRatio: "16/9", objectFit: "cover" }} />
                <div className="cardMediaBody">
                  <div className="cardMediaTitle">What your website lane delivers</div>
                  <p className="pDark cardMediaDesc">
                    Premium visual positioning, conversion architecture, mobile performance, and cleaner lead capture.
                  </p>
                </div>
              </div>
            </div>

            <div className="card cardMedia cardHover scaleIn stagger-1">
              <div className="cardInner">
                <img src="https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&w=1400&q=80" alt="E-commerce lane outcome preview" width={1200} height={700} style={{ aspectRatio: "16/9", objectFit: "cover" }} />
                <div className="cardMediaBody">
                  <div className="cardMediaTitle">What your e-commerce lane delivers</div>
                  <p className="pDark cardMediaDesc">
                    Checkout and fulfillment flow cleanup, margin-aware ops support, and repeat-order system clarity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section sectionBand">
        <div className="container">
          <div className="sectionHead fadeUp">
            <div className="kicker">Services</div>
            <h2 className="h2">Three service lanes + who each is for</h2>
          </div>

          <div className="homeServicesGrid">
            {serviceCards.map((card, idx) => (
              <div key={card.title} className={`card cardHover homeServiceCard scaleIn stagger-${idx + 1}`}>
                <div className="cardInner">
                  <img src={card.image} alt={card.imageAlt} width={1200} height={700} className="homeServiceImage" />
                  <div className="badge">Service {card.id}</div>
                  <h3 className="h3" style={{ margin: 0 }}>{card.title}</h3>
                  <p className="pDark homeServiceDesc">{card.desc}</p>
                  <div className="pDark homeServiceWho">
                    {card.who}
                  </div>
                  <p className="pDark homeServicePrice">{card.price}</p>
                  <TrackLink href={card.href} event={card.event} className="btn btnGhost">
                    Explore {card.title} <span className="btnArrow">→</span>
                  </TrackLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section">
        <div className="container">
          <div className="sectionHead fadeUp">
            <div className="kicker">How it Works</div>
            <h2 className="h2">Low-friction from intake to launch</h2>
          </div>

          <div className="grid4">
            {[
              { n: "1", title: "Submit Intake", desc: "3 minutes. We capture goals, offer model, and timeline constraints." },
              { n: "2", title: "Get Scoped Plan", desc: "You receive priorities, transparent pricing range, and execution sequence." },
              { n: "3", title: "Strategy Alignment", desc: "Quick call to lock scope, timeline, and conversion priorities." },
              { n: "4", title: "Build + Launch", desc: "Milestone-driven delivery, revision clarity, and launch handoff support." },
            ].map((step) => (
              <div key={step.n} className={`card processCard fadeUp stagger-${step.n}`}>
                <div className="cardInner">
                  <div className="processNum">{step.n}</div>
                  <div className="processTitle">{step.title}</div>
                  <p className="pDark">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid4" style={{ marginTop: 14 }}>
            {[
              { value: "24h", label: "Average first response window" },
              { value: "2-4 wks", label: "Typical delivery after scope lock" },
              { value: "100%", label: "Scope clarity before build begins" },
              { value: "Portal", label: "Milestone visibility and updates" },
            ].map((metric) => (
              <div key={metric.label} className="card fadeUp">
                <div className="cardInner">
                  <div className="statNum" style={{ fontSize: 34 }}>{metric.value}</div>
                  <p className="pDark" style={{ marginTop: 6 }}>{metric.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card ctaCard scaleIn">
            <div className="cardInner">
              <div className="kicker">Ready to start?</div>
              <h2 className="h2">Start with one unified growth plan.</h2>
              <p className="p">
                Clear scope, clear pricing, no hidden add-ons. We route into the right lane and prioritize
                Website + E-Commerce outcomes first.
              </p>
              <div className="heroActions">
                <TrackLink href="/ecommerce/intake" event="cta_home_bottom_ecommerce" className="btn btnPrimary btnLg">
                  Start E-Commerce Intake <span className="btnArrow">→</span>
                </TrackLink>
                <TrackLink href="/build/intro" event="cta_home_bottom_quote" className="btn btnGhost btnLg">
                  Get Website Quote
                </TrackLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
