import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="container">
      {/* HERO */}
      <section className="hero">
        <div className="heroGrid">
          <div className="card cardHover heroCopy">
            <div className="kicker">CrecyStudio • Custom Websites</div>

            <h1 className="h1" style={{ marginTop: 14 }}>
              Professional websites,{" "}
              <span className="underline">priced clearly</span> — built fast.
            </h1>

            <p>
              We build modern business websites with clear scope, clear revisions,
              and transparent tier pricing. You’ll get a clean estimate in minutes,
              then we finalize details together.
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
              <span className="pill">Wix / Squarespace / Custom (Next.js)</span>
              <span className="pill">Clear revisions</span>
              <span className="pill">Fast turnaround</span>
              <span className="pill">Mobile-first</span>
            </div>
          </div>

          <div className="card heroSide">
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

            <div className="cardInner" style={{ padding: 16 }}>
              <div style={{ fontWeight: 950, marginBottom: 8 }}>
                What you’ll get
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, color: "rgba(255,255,255,0.86)" }}>
                <li>Scope snapshot (deliverables + exclusions)</li>
                <li>Tier recommendation + price range</li>
                <li>Clear revision policy</li>
                <li>Next step: deposit / call / assets</li>
              </ul>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="badge badgeHot">Most clients choose Growth</span>
                <span className="badge">No hidden fees</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TIERS */}
      <section className="section">
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="kicker">System 2 • 3 Tiers</div>
            <h2 className="h2" style={{ marginTop: 12 }}>
              Choose the right build level
            </h2>
            <div style={{ color: "rgba(255,255,255,0.68)", marginTop: 8, maxWidth: 760, lineHeight: 1.6 }}>
              You’ll see a recommended tier after the questionnaire. If budget is tight,
              we can use scope trade-offs or admin-only discounts (10–25%) — without changing the public pricing.
            </div>
          </div>

          <Link className="btn btnPrimary" href="/estimate">
            Get Estimate <span className="btnArrow">→</span>
          </Link>
        </div>

        <div className="tierGrid" style={{ marginTop: 16 }}>
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
          <div className="kicker">Professional process</div>
          <h2 className="h2" style={{ marginTop: 12 }}>How it works</h2>

          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            <Step n="1" title="Fast estimate" desc="Answer a quick questionnaire and get tier + range." />
            <Step n="2" title="Scope snapshot" desc="We confirm pages, features, timeline, revisions, exclusions." />
            <Step n="3" title="Deposit + build" desc="You pay a deposit, we build fast with clear milestones." />
          </div>
        </div>
      </section>

      {/* FOOTER SPACER */}
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
    <div className={`card cardHover`}>
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
    <div
      className="card"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.10)",
      }}
    >
      <div className="cardInner" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            fontWeight: 950,
            background: "rgba(255,122,24,0.14)",
            border: "1px solid rgba(255,122,24,0.30)",
            color: "rgba(255,200,150,0.95)",
          }}
        >
          {n}
        </div>
        <div>
          <div style={{ fontWeight: 950 }}>{title}</div>
          <div style={{ color: "rgba(255,255,255,0.68)", marginTop: 4, lineHeight: 1.5 }}>
            {desc}
          </div>
        </div>
      </div>
    </div>
  );
}