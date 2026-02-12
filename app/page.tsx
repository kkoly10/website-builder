import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="container">
      {/* HERO */}
      <section className="hero">
        <div className="heroGrid">
          <div className="card cardHover heroCopy">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              CrecyStudio • Custom Websites
            </div>

            <h1 className="h1" style={{ marginTop: 14 }}>
              Professional websites, <span className="underline">priced clearly</span> — built fast.
            </h1>

            <p className="p" style={{ marginTop: 12 }}>
              We build modern business websites with clear scope, clear revisions, and transparent tier pricing.
              Get a clean estimate in minutes, then we finalize details together.
            </p>

            <div className="heroActions">
              <Link href="/estimate" className="btn btnPrimary">
                Get an Estimate <span className="btnArrow">→</span>
              </Link>
              <Link href="/build" className="btn btnGhost">
                Start a Build
              </Link>
            </div>

            <div className="pills">
              <span className="pill">
                <span className="pillDot" aria-hidden="true" />
                Wix / Squarespace / Custom (Next.js)
              </span>
              <span className="pill">
                <span className="pillDot" aria-hidden="true" />
                Clear revisions
              </span>
              <span className="pill">
                <span className="pillDot" aria-hidden="true" />
                Fast turnaround
              </span>
              <span className="pill">
                <span className="pillDot" aria-hidden="true" />
                Mobile-first
              </span>
            </div>

            <div className="trustRow">
              <span className="trustBadge">Conversion-first</span>
              <span className="trustBadge">Performance-minded</span>
              <span className="trustBadge">No hidden fees</span>
            </div>
          </div>

          <div className="card heroSide">
            <div className="heroSideTop">
              <div className="statRow">
                <div className="stat">
                  <div className="statNum">$550+</div>
                  <div className="statLab">Start price (System 2)</div>
                </div>
                <div className="stat">
                  <div className="statNum">1–3 wks</div>
                  <div className="statLab">Typical timeline</div>
                </div>
              </div>

              <div className="miniPanel">
                <div className="miniTitle">What you’ll get</div>
                <ul className="miniList">
                  <li>Scope snapshot (deliverables + exclusions)</li>
                  <li>Tier recommendation + price range</li>
                  <li>Clear revision policy</li>
                  <li>Next step: deposit / call / assets</li>
                </ul>

                <div className="badgeRow">
                  <span className="badge badgeHot">Most clients choose Growth</span>
                  <span className="badge">No hidden fees</span>
                </div>
              </div>
            </div>

            <div className="heroSideBottom">
              <div className="callout">
                <div className="calloutTitle">Want the fastest path?</div>
                <div className="calloutText">
                  Use the estimate tool — then we’ll confirm details and lock scope.
                </div>
                <Link className="btn btnSoft" href="/estimate">
                  Get estimate now <span className="btnArrow">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TIERS */}
      <section className="section">
        <div className="sectionHead">
          <div>
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              System 2 • 3 Tiers
            </div>
            <h2 className="h2" style={{ marginTop: 12 }}>
              Choose the right build level
            </h2>
            <p className="p" style={{ marginTop: 8, maxWidth: 820 }}>
              You’ll see a recommended tier after the questionnaire. If budget is tight,
              we can use scope trade-offs or admin-only discounts (10–25%) — without changing public pricing.
            </p>
          </div>

          <Link className="btn btnPrimary" href="/estimate">
            Get Estimate <span className="btnArrow">→</span>
          </Link>
        </div>

        <div className="tierGrid">
          <TierCard
            name="Essential Launch"
            price="$550–$850"
            badge="Best for simple launches"
            bullets={[
              "Up to ~5 sections / pages",
              "Clean layout + mobile responsive",
              "Contact form + basic SEO",
              "1 revision round (structured)",
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
              "2 revision rounds (structured)",
            ]}
          />

          <TierCard
            name="Premium Platform"
            price="$1,700–$3,500+"
            badge="Best for scale"
            bullets={[
              "Custom features + integrations",
              "Advanced UI + performance focus",
              "Payments/membership/automation options",
              "2–3 revision rounds (by scope)",
            ]}
          />
        </div>
      </section>

      {/* PROCESS */}
      <section className="section">
        <div className="card cardInner">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Professional process
          </div>
          <h2 className="h2" style={{ marginTop: 12 }}>
            How it works
          </h2>

          <div className="stepGrid">
            <Step n="1" title="Fast estimate" desc="Answer a quick questionnaire and get tier + range." />
            <Step n="2" title="Scope snapshot" desc="We confirm pages, features, timeline, revisions, exclusions." />
            <Step n="3" title="Deposit + build" desc="You pay a deposit, we build fast with clear milestones." />
          </div>
        </div>
      </section>

      <section className="sectionSm" />
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
    <div className="card cardHover tierCard">
      <div className="cardInner">
        <div className="tierHead">
          <div>
            <div className="tierName">{name}</div>
            <div className="tierSub">{badge}</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div className="tierPrice">{price}</div>
            <div className={`badge ${hot ? "badgeHot" : ""}`} style={{ marginTop: 10 }}>
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
          <Link className="btn btnPrimary" href="/estimate">
            See your estimate <span className="btnArrow">→</span>
          </Link>
          <Link className="btn btnGhost" href="/build">
            Start build
          </Link>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="stepCard">
      <div className="stepN">{n}</div>
      <div>
        <div className="stepTitle">{title}</div>
        <div className="stepDesc">{desc}</div>
      </div>
    </div>
  );
}