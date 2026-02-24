// app/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="container">
      {/* HERO */}
      <section className="hero">
        <div className="heroGrid">
          <div className="card cardHover">
            <div className="cardInner heroCardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                CrecyStudio • System 2 pricing
              </div>

              <h1 className="h1" style={{ marginTop: 14 }}>
                Professional <span className="underline">websites</span>, priced clearly — built fast.
              </h1>

              <p className="p heroLead">
                You should know what you’re paying for before the build starts. CrecyStudio gives
                you a clear quote, scope snapshot, tier recommendation, and revision policy so the
                project stays clean from day one.
              </p>

              <div className="heroActions">
                <Link href="/build" className="btn btnPrimary">
                  Get an Estimate <span className="btnArrow">→</span>
                </Link>
                <Link href="/book" className="btn btnGhost">
                  Start a Build
                </Link>
              </div>

              <div className="pills">
                <span className="pill">Wix / Squarespace / Custom (Next.js)</span>
                <span className="pill">Clear revisions</span>
                <span className="pill">Mobile-first</span>
                <span className="pill">Fast turnaround</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardInner heroSideCard">
              <div className="heroMetricGrid">
                <div className="metricBox">
                  <div className="metricValue">$550+</div>
                  <div className="metricLabel">Start price (System 2)</div>
                </div>
                <div className="metricBox">
                  <div className="metricValue">1–3</div>
                  <div className="metricLabel">Typical weeks</div>
                </div>
              </div>

              <div className="featurePanel">
                <div className="featurePanelTitle">Every quote includes</div>
                <ul className="softList">
                  <li>Scope snapshot (deliverables + exclusions)</li>
                  <li>Tier recommendation + price range</li>
                  <li>Clear revision policy</li>
                  <li>Next step: deposit / call / assets</li>
                </ul>
              </div>

              <div className="heroBottomCards">
                <div className="miniCallout miniCalloutHot">
                  <div className="miniCalloutTitle">Most clients choose Growth</div>
                  <div className="miniCalloutSub">Balanced speed + stronger conversion flow</div>
                </div>
                <div className="miniCallout">
                  <div className="miniCalloutTitle">No hidden fees</div>
                  <div className="miniCalloutSub">Scope-first pricing</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM 2 INTRO */}
      <section className="section">
        <div className="splitSection">
          <div>
            <div className="sectionKicker">System 2 • 3 Tiers</div>
            <h2 className="h2" style={{ marginTop: 10 }}>
              Choose the right build level
            </h2>
            <p className="p" style={{ marginTop: 10, maxWidth: 760 }}>
              Tier recommendations come after the questionnaire, and your quote stays tied to the
              scope snapshot. That means cleaner decisions, fewer surprises, and better project
              delivery.
            </p>
          </div>

          <div className="snapshotPanel">
            <ul className="softList" style={{ margin: 0 }}>
              <li>Scope snapshot (deliverables + exclusions)</li>
              <li>Tier recommendation + price range</li>
              <li>Clear revision policy</li>
              <li>Next step: deposit / call / assets</li>
            </ul>

            <div className="heroBottomCards" style={{ marginTop: 12 }}>
              <div className="miniCallout miniCalloutHot">
                <div className="miniCalloutTitle">Most clients choose Growth</div>
                <div className="miniCalloutSub">Best balance of price + outcomes</div>
              </div>
              <div className="miniCallout">
                <div className="miniCalloutTitle">No hidden fees</div>
                <div className="miniCalloutSub">Clear revisions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TIERS */}
      <section id="pricing" className="section">
        <div className="tierGrid">
          <TierCard
            name="Essential Launch"
            price="$550–$850"
            badge="Best for simple launches"
            bullets={[
              "Landing page or compact site build",
              "Clean mobile layout + contact form",
              "Professional starter structure",
              "Structured revision process",
            ]}
          />

          <TierCard
            name="Growth Build"
            price="$900–$1,500"
            badge="Recommended"
            hot
            bullets={[
              "Stronger content flow + conversion focus",
              "Lead capture and booking improvements",
              "Better structure for SEO and trust",
              "Most common choice for local businesses",
            ]}
          />

          <TierCard
            name="Premium Platform"
            price="$1,700–$3,600+"
            badge="For scale / custom features"
            bullets={[
              "Custom layouts and advanced interactions",
              "Integrations, payments, or automation",
              "Portal/dashboard-ready architecture",
              "Best for long-term growth builds",
            ]}
          />
        </div>

        <div className="ctaRow" style={{ marginTop: 16 }}>
          <Link href="/build" className="btn btnPrimary">
            Get Your Estimate <span className="btnArrow">→</span>
          </Link>
          <Link href="/estimate" className="btn btnGhost">
            View Pricing Flow
          </Link>
        </div>
      </section>

      {/* SECONDARY OFFER: SYSTEMS / OPS */}
      <section className="section">
        <div className="card">
          <div className="cardInner">
            <div className="sectionKicker">Workflow Systems • Add-on or Standalone</div>
            <h2 className="h2" style={{ marginTop: 10 }}>
              Need help with invoicing, CRM, or back-office workflows?
            </h2>
            <p className="p" style={{ marginTop: 10, maxWidth: 900 }}>
              CrecyStudio also builds lightweight business systems for contractors and small
              businesses — lead intake, request tracking, payment reminders, client portals, and
              internal dashboards.
            </p>

            <div className="tierGrid" style={{ marginTop: 16 }}>
              <MiniOfferCard
                title="Quick Win Setup"
                price="$500–$1,200"
                bullets={[
                  "1–2 immediate workflow fixes",
                  "Lead intake + follow-up cleanup",
                  "Invoice reminder automation",
                ]}
              />
              <MiniOfferCard
                title="Operations Upgrade"
                price="$1,200–$3,000"
                hot
                bullets={[
                  "Lead → job → invoice workflow",
                  "CRM cleanup + visibility",
                  "Owner dashboard / reporting",
                ]}
              />
              <MiniOfferCard
                title="Custom Workflow Platform"
                price="$3,000+"
                bullets={[
                  "Portals + dashboards",
                  "Stripe / QuickBooks integrations",
                  "Custom internal tools",
                ]}
              />
            </div>

            <div className="ctaRow" style={{ marginTop: 16 }}>
              <Link href="/systems" className="btn btnPrimary">
                Start Workflow Review <span className="btnArrow">→</span>
              </Link>
              <Link href="/book?service=ops" className="btn btnGhost">
                Book a Call
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section">
        <div className="card">
          <div className="cardInner">
            <div className="sectionKicker">Professional Process</div>
            <h2 className="h2" style={{ marginTop: 10 }}>
              How CrecyStudio works
            </h2>

            <div className="processGrid" style={{ marginTop: 14 }}>
              <StepCard
                n="1"
                title="Estimate"
                desc="Start with the questionnaire so pricing and scope are grounded in real inputs."
              />
              <StepCard
                n="2"
                title="Scope Snapshot"
                desc="Get deliverables, exclusions, revision rules, and a recommended tier."
              />
              <StepCard
                n="3"
                title="Deposit + Assets"
                desc="Approve the project, pay deposit, and upload your content/logo/assets."
              />
              <StepCard
                n="4"
                title="Build + Revisions"
                desc="We build fast, track milestones, and handle revisions through the client portal."
              />
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section">
        <div className="ctaBand">
          <div>
            <div className="sectionKicker">Ready to start?</div>
            <h2 className="h2" style={{ marginTop: 10 }}>
              Let’s turn your idea into a clean, professional website.
            </h2>
            <p className="p" style={{ marginTop: 10, maxWidth: 780 }}>
              Start with a quote, then move into the client portal only when you’re ready to begin.
              That keeps the first step simple and the project flow organized.
            </p>
          </div>

          <div className="ctaRow">
            <Link href="/build" className="btn btnPrimary">
              Get Estimate <span className="btnArrow">→</span>
            </Link>
            <Link href="/login" className="btn btnGhost">
              Client Login
            </Link>
          </div>
        </div>
      </section>
    </main>
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
    <div className={`card cardHover ${hot ? "tierCardHot" : ""}`}>
      <div className="cardInner">
        <div className="tierHead">
          <div>
            <div className="tierName">{name}</div>
            <div className="tierSub">{price}</div>
          </div>
          <div className={`badge ${hot ? "badgeHot" : ""}`}>{badge}</div>
        </div>

        <ul className="tierList">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="tierCTA">
          <Link className="btn btnPrimary" href="/build">
            Start estimate <span className="btnArrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MiniOfferCard({
  title,
  price,
  bullets,
  hot,
}: {
  title: string;
  price: string;
  bullets: string[];
  hot?: boolean;
}) {
  return (
    <div className={`card cardHover ${hot ? "tierCardHot" : ""}`}>
      <div className="cardInner">
        <div className="tierHead">
          <div>
            <div className="tierName">{title}</div>
            <div className="tierSub">{price}</div>
          </div>
          <div className={`badge ${hot ? "badgeHot" : ""}`}>{hot ? "Popular" : "Ops"}</div>
        </div>

        <ul className="tierList">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StepCard({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
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