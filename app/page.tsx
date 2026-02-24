import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="container homePage">
      {/* HERO */}
      <section className="hero">
        <div className="heroGrid">
          <div className="card cardHover heroCopy">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                CrecyStudio • Websites + Business Systems
              </div>

              <div style={{ height: 14 }} />

              <h1 className="h1">
                Build your <span className="underline">website</span> and fix your{" "}
                <span className="underline">workflow</span> — in one place.
              </h1>

              <p className="p heroLead">
                CrecyStudio helps service businesses launch professional websites and clean up the back office:
                lead capture, CRM handoff, invoicing flow, reminders, request tracking, and simple dashboards.
              </p>

              <div className="heroRoleLine">
                <strong>Business Systems Developer (Web + Automation)</strong>
                <span>•</span>
                <span>Scope-first pricing</span>
                <span>•</span>
                <span>Client portal included</span>
              </div>

              <div className="heroActions">
                <Link href="/build" className="btn btnPrimary">
                  Start Website Quote <span className="btnArrow">→</span>
                </Link>

                <Link href="/systems" className="btn btnGhost">
                  Start Workflow Review
                </Link>

                <Link href="/portal" className="btn btnGhost">
                  Client Portal
                </Link>
              </div>

              <div className="pills">
                <span className="pill">Wix / Squarespace / Custom (Next.js)</span>
                <span className="pill">CRM + intake workflows</span>
                <span className="pill">Invoice reminders</span>
                <span className="pill">Dashboards + automation</span>
              </div>
            </div>
          </div>

          <div className="card heroSideCard">
            <div className="statRow">
              <div className="stat">
                <div className="statNum">$550+</div>
                <div className="statLab">Website builds</div>
              </div>
              <div className="stat">
                <div className="statNum">$500+</div>
                <div className="statLab">Ops systems</div>
              </div>
            </div>

            <div className="cardInner">
              <div className="splitIntro">
                <div className="splitCard">
                  <div className="splitBadge">Web</div>
                  <div className="splitTitle">Website Build</div>
                  <div className="splitText">
                    Launch or upgrade your site with clear scope, pricing tiers, and revision structure.
                  </div>
                </div>

                <div className="splitCard">
                  <div className="splitBadge splitBadgeOps">Ops</div>
                  <div className="splitTitle">Workflow System</div>
                  <div className="splitText">
                    Fix lead intake, request tracking, invoicing follow-up, and reporting visibility.
                  </div>
                </div>
              </div>

              <div className="miniChecklist">
                <div className="miniChecklistTitle">What clients get</div>
                <ul className="featureList">
                  <li className="featureItem">Scope snapshot (deliverables + exclusions)</li>
                  <li className="featureItem">Tier recommendation + price range</li>
                  <li className="featureItem">Clear revision policy</li>
                  <li className="featureItem">Next step: deposit / call / assets</li>
                </ul>
              </div>

              <div className="miniGrid">
                <div className="miniCard miniCardHot">
                  <div className="miniCardTitle">Most clients choose Growth</div>
                  <div className="miniCardText">Start fast, then expand features</div>
                </div>
                <div className="miniCard">
                  <div className="miniCardTitle">No hidden fees</div>
                  <div className="miniCardText">Scope-first pricing system</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHOOSE PATH */}
      <section className="section">
        <div className="sectionHeader">
          <div>
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Choose your path
            </div>
            <div style={{ height: 10 }} />
            <h2 className="h2">What do you need help with right now?</h2>
            <p className="p" style={{ maxWidth: 820, marginTop: 10 }}>
              Start with the problem you want solved first. You can always bundle website + workflow together.
            </p>
          </div>
        </div>

        <div className="tierGrid" style={{ marginTop: 18 }}>
          <ServiceCard
            title="Custom Websites"
            subtitle="Best for launching or upgrading your online presence"
            bullets={[
              "Professional website design + build",
              "Lead capture and contact/booking setup",
              "Wix / Squarespace / Custom (Next.js)",
              "Clear scope + revision structure",
            ]}
            ctaLabel="Get Website Quote"
            ctaHref="/build"
            secondaryLabel="Website Pricing"
            secondaryHref="/estimate"
          />

          <ServiceCard
            title="Workflow Automation"
            subtitle="Best for invoicing, CRM, and back-office systems"
            hot
            bullets={[
              "Lead intake + request/job tracking",
              "Invoice reminders and payment follow-up",
              "CRM / QuickBooks workflow cleanup",
              "Dashboards + process visibility",
            ]}
            ctaLabel="Start Workflow Review"
            ctaHref="/systems"
            secondaryLabel="Ops Packages"
            secondaryHref="#ops-packages"
          />
        </div>
      </section>

      {/* WEB TIERS */}
      <section className="section">
        <div className="sectionHeader">
          <div>
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Website Services • System 2
            </div>
            <div style={{ height: 10 }} />
            <h2 className="h2">Website builds with clear pricing and scope</h2>
            <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
              Use the estimate flow to get a real price range based on your scope, timeline, and features.
            </p>
          </div>

          <Link className="btn btnPrimary" href="/build">
            Start Website Quote <span className="btnArrow">→</span>
          </Link>
        </div>

        <div className="tierGrid" style={{ marginTop: 18 }}>
          <TierCard
            name="Essential Launch"
            price="$550–$850"
            badge="Best for simple launches"
            bullets={[
              "Up to ~5 sections/pages",
              "Clean layout + mobile responsive",
              "Contact form + basic SEO setup",
              "1 structured revision round",
            ]}
          />

          <TierCard
            name="Growth Build"
            price="$900–$1,500"
            badge="Most chosen"
            hot
            bullets={[
              "5–8 pages/sections + stronger UX",
              "Booking + lead capture improvements",
              "Better SEO structure + analytics",
              "2 structured revision rounds",
            ]}
          />

          <TierCard
            name="Premium Platform"
            price="$1,700–$3,500+"
            badge="Best for scale"
            bullets={[
              "Custom features + integrations",
              "Advanced UI + performance focus",
              "Payments / portal / automation options",
              "2–3 revisions by scope",
            ]}
          />
        </div>
      </section>

      {/* OPS PACKAGES */}
      <section id="ops-packages" className="section">
        <div className="card">
          <div className="cardInner">
            <div className="sectionHeader">
              <div>
                <div className="kicker">
                  <span className="kickerDot" aria-hidden="true" />
                  CrecyStudio Ops • Workflow Systems
                </div>
                <div style={{ height: 10 }} />
                <h2 className="h2">Back-office systems for service businesses</h2>
                <p className="p" style={{ marginTop: 10, maxWidth: 900 }}>
                  We build practical systems that reduce admin chaos: intake, request tracking, invoicing follow-up,
                  CRM handoff, and owner dashboards.
                </p>
              </div>

              <Link className="btn btnGhost" href="/systems">
                View Workflow Review
              </Link>
            </div>

            <div className="tierGrid" style={{ marginTop: 18 }}>
              <OpsCard
                title="Quick Win Setup"
                price="$500–$1,200"
                badge="Fastest start"
                bullets={[
                  "1–2 workflow fixes (intake + reminders)",
                  "Basic request/job tracking",
                  "Invoice reminder setup",
                  "7–10 day setup target",
                ]}
              />

              <OpsCard
                title="Operations Upgrade"
                price="$1,200–$3,000"
                badge="Best value"
                hot
                bullets={[
                  "CRM + workflow cleanup",
                  "Lead → job → invoice process",
                  "Owner dashboard / reporting",
                  "Process mapping + optimization",
                ]}
              />

              <OpsCard
                title="Custom Workflow Platform"
                price="$3,000+"
                badge="Advanced systems"
                bullets={[
                  "Multi-step automations",
                  "Client/staff portals",
                  "Integrations (Stripe, QuickBooks, etc.)",
                  "Custom internal tools",
                ]}
              />
            </div>

            <div className="ctaBand">
              <div>
                <div className="ctaBandTitle">Need both website + ops setup?</div>
                <div className="ctaBandText">
                  Start with whichever is urgent, then bundle the second phase into one roadmap.
                </div>
              </div>

              <div className="row">
                <Link className="btn btnPrimary" href="/build">
                  Website Quote
                </Link>
                <Link className="btn btnGhost" href="/systems">
                  Workflow Review
                </Link>
                <Link className="btn btnGhost" href="/book?service=ops">
                  Book Call
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section">
        <div className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Professional process
            </div>

            <div style={{ height: 10 }} />
            <h2 className="h2">How CrecyStudio works</h2>

            <div className="processGrid">
              <Step
                n="1"
                title="Choose your track"
                desc="Website build, workflow system, or both. Start with the problem you want solved first."
              />
              <Step
                n="2"
                title="Scope intake"
                desc="We collect the right details so pricing is based on real scope, not guesswork."
              />
              <Step
                n="3"
                title="Estimate + scope snapshot"
                desc="You get pricing range, deliverables, exclusions, revisions, and clear next steps."
              />
              <Step
                n="4"
                title="Build + portal visibility"
                desc="Track status, assets, revisions, and updates through your client portal."
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({
  title,
  subtitle,
  bullets,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  hot,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  hot?: boolean;
}) {
  return (
    <div className="card cardHover">
      <div className="cardInner">
        <div className="tierHead">
          <div>
            <div className="tierName">{title}</div>
            <div className="tierSub">{subtitle}</div>
          </div>
          <div className={`badge ${hot ? "badgeHot" : ""}`}>{hot ? "Recommended" : "Service"}</div>
        </div>

        <ul className="tierList">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="tierCTA">
          <Link className="btn btnPrimary" href={ctaHref}>
            {ctaLabel} <span className="btnArrow">→</span>
          </Link>
          <Link className="btn btnGhost" href={secondaryHref}>
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

function TierCard({
  name,
  price,
  bullets,
  badge,
  hot,
}: {
  name: string;
  price: string;
  bullets: string[];
  badge: string;
  hot?: boolean;
}) {
  return (
    <div className="card cardHover">
      <div className="cardInner">
        <div className="tierHead">
          <div>
            <div className="tierName">{name}</div>
            <div className="tierSub">{badge}</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div className="tierPrice">{price}</div>
            <div className={`badge ${hot ? "badgeHot" : ""}`} style={{ marginTop: 8 }}>
              {hot ? "Recommended" : "Tier"}
            </div>
          </div>
        </div>

        <ul className="tierList">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="tierCTA">
          <Link className="btn btnPrimary" href="/build">
            Get estimate <span className="btnArrow">→</span>
          </Link>
          <Link className="btn btnGhost" href="/estimate">
            Pricing details
          </Link>
        </div>
      </div>
    </div>
  );
}

function OpsCard({
  title,
  price,
  bullets,
  badge,
  hot,
}: {
  title: string;
  price: string;
  bullets: string[];
  badge: string;
  hot?: boolean;
}) {
  return (
    <div className="card cardHover">
      <div className="cardInner">
        <div className="tierHead">
          <div>
            <div className="tierName">{title}</div>
            <div className="tierSub">{badge}</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div className="tierPrice">{price}</div>
            <div className={`badge ${hot ? "badgeHot" : ""}`} style={{ marginTop: 8 }}>
              {hot ? "Popular" : "Ops"}
            </div>
          </div>
        </div>

        <ul className="tierList">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="tierCTA">
          <Link className="btn btnPrimary" href="/systems">
            Start review <span className="btnArrow">→</span>
          </Link>
          <Link className="btn btnGhost" href="/book?service=ops">
            Book call
          </Link>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="stepCard">
      <div className="stepNum">{n}</div>
      <div>
        <div className="stepTitle">{title}</div>
        <div className="stepDesc">{desc}</div>
      </div>
    </div>
  );
}