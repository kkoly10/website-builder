import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="container">
      <section className="hero">
        <div className="heroGrid">
          <div className="card cardHover heroCopy">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                CrecyStudio • Custom Websites
              </div>

              <div style={{ height: 14 }} />

              <h1 className="h1">
                Professional websites,{" "}
                <span className="underline">priced clearly</span> — built fast.
              </h1>

              <p className="p" style={{ maxWidth: 760, marginTop: 14 }}>
                Clean scope. Clear revisions. Tier pricing that makes sense.
                Start with the questionnaire and get a real estimate that changes based on your needs.
              </p>

              <div className="heroActions">
                <Link href="/build" className="btn btnPrimary">
                  Get a Quote <span className="btnArrow">→</span>
                </Link>
                <Link href="/estimate" className="btn btnGhost">
                  See Estimate Page
                </Link>
              </div>

              <div className="pills">
                <span className="pill">Wix / Squarespace / Custom (Next.js)</span>
                <span className="pill">Clear revisions</span>
                <span className="pill">Fast turnaround</span>
                <span className="pill">Conversion-first</span>
              </div>
            </div>
          </div>

          <div className="card">
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

            <div className="cardInner">
              <div style={{ fontWeight: 950, marginBottom: 10 }}>What you’ll get</div>

              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, color: "rgba(255,255,255,0.84)" }}>
                <li>Scope snapshot (deliverables + exclusions)</li>
                <li>Tier recommendation + price range</li>
                <li>Clear revision policy</li>
                <li>Next step: deposit / call / assets</li>
              </ul>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="badge badgeHot">Most clients choose Growth</span>
                <span className="badge">No hidden fees</span>
              </div>

              <div style={{ marginTop: 14 }}>
                <Link className="btn btnPrimary" href="/build">
                  Start Questionnaire <span className="btnArrow">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TIERS */}
      <section className="section">
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              System 2 • 3 Tiers
            </div>

            <div style={{ height: 12 }} />

            <h2 className="h2">Choose the right build level</h2>

            <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
              You’ll see a recommended tier after the questionnaire. If budget is tight,
              we can use scope trade-offs or admin-only discounts (10–25%) — without changing the public pricing.
            </p>
          </div>

          <Link className="btn btnPrimary" href="/build">
            Get a Quote <span className="btnArrow">→</span>
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
        <div className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Professional process
            </div>

            <div style={{ height: 12 }} />
            <h2 className="h2">How it works</h2>

            <div style={{ height: 14 }} />

            <div style={{ display: "grid", gap: 12 }}>
              <Step n="1" title="Questionnaire" desc="Answer a few questions—only what’s relevant." />
              <Step n="2" title="Estimate + tier" desc="We calculate a real estimate and recommend a tier." />
              <Step n="3" title="Scope snapshot" desc="We confirm deliverables, exclusions, revisions, timeline." />
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div>© 2026 CrecyStudio. Built to convert.</div>
        <div className="footerLinks">
          <Link href="/">Home</Link>
          <Link href="/build">Get a Quote</Link>
          <Link href="/estimate">Estimate</Link>
          <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
        </div>
      </footer>
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
    <div className="card cardHover">
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
          <Link className="btn btnPrimary" href="/build">
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
    <div className="card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}>
      <div className="cardInner" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            fontWeight: 950,
            background: "rgba(255,122,24,0.14)",
            border: "1px solid rgba(255,122,24,0.30)",
            color: "rgba(255,220,200,0.95)",
            flex: "0 0 auto",
          }}
        >
          {n}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 950 }}>{title}</div>
          <div className="p" style={{ marginTop: 4 }}>
            {desc}
          </div>
        </div>
      </div>
    </div>
  );
}