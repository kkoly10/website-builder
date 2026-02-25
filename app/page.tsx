import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="homePage">
      <div className="homeStarWash" aria-hidden="true" />

      <div className="container">
        {/* HERO */}
        <section className="hero">
          <div className="heroGrid">
            {/* LEFT HERO CARD */}
            <div className="card cardHover heroCopy">
              <div className="cardInner">
                <div className="kicker">
                  <span className="kickerDot" aria-hidden="true" />
                  CrecyStudio • Websites + Workflow Systems
                </div>

                <div style={{ height: 14 }} />

                <h1 className="h1">
                  Professional <span className="underline">websites</span> and{" "}
                  <span className="underline">workflow systems</span> for local businesses.
                </h1>

                <p className="p" style={{ maxWidth: 760, marginTop: 14 }}>
                  I help businesses look professional online and run smoother behind the scenes —
                  from custom websites to intake, billing, CRM, and admin workflow automation.
                </p>

                <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                  <div className="badge" style={{ justifyContent: "flex-start" }}>
                    Workflow Automation & Billing Systems Engineer
                  </div>
                  <div className="badge" style={{ justifyContent: "flex-start" }}>
                    QuickBooks / CRM / Invoice Automation Specialist
                  </div>
                  <div className="badge" style={{ justifyContent: "flex-start" }}>
                    Business Systems Developer (Web + Automation)
                  </div>
                </div>

                <div className="heroActions">
                  <Link href="/systems" className="btn btnPrimary">
                    Fix My Workflow <span className="btnArrow">→</span>
                  </Link>
                  <Link href="/build" className="btn btnGhost">
                    Get Website Quote
                  </Link>
                </div>

                <div className="pills">
                  <span className="pill">Stafford • Fredericksburg • Woodbridge</span>
                  <span className="pill">Local + remote service</span>
                  <span className="pill">Next.js + Supabase builds</span>
                  <span className="pill">Fast turnaround</span>
                </div>
              </div>
            </div>

            {/* RIGHT HERO CARD */}
            <div className="card">
              <div className="statRow">
                <div className="stat">
                  <div className="statNum">2 Paths</div>
                  <div className="statLab">Website or workflow fix</div>
                </div>
                <div className="stat">
                  <div className="statNum">$550+</div>
                  <div className="statLab">Website projects start</div>
                </div>
              </div>

              <div className="cardInner">
                <div style={{ fontWeight: 950, marginBottom: 10 }}>Start the right way</div>

                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    lineHeight: 1.85,
                    color: "rgba(255,255,255,0.84)",
                  }}
                >
                  <li>Choose your path: Website build or workflow systems</li>
                  <li>Answer a short intake (business + goals + pain points)</li>
                  <li>Get a clear plan, price range, and next steps</li>
                  <li>Admin dashboard + client portal flow built in</li>
                </ul>

                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span className="badge badgeHot">Best for local service businesses</span>
                  <span className="badge">No fluff, clear scope</span>
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="btn btnPrimary" href="/systems">
                    Start Workflow Intake <span className="btnArrow">→</span>
                  </Link>
                  <Link className="btn btnGhost" href="/build">
                    Start Website Intake
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT WE DO */}
        <section className="section">
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                Clear offers • Fast-start + long-term
              </div>

              <div style={{ height: 12 }} />

              <h2 className="h2">Two ways businesses hire CrecyStudio</h2>

              <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
                This setup is intentionally broad enough to serve fast-moving small businesses and
                more established teams. A contractor, dental office, cleaning company, clinic, law
                office, or e-commerce business can all fit into one of these paths.
              </p>
            </div>
          </div>

          <div className="tierGrid" style={{ marginTop: 18 }}>
            <OfferCard
              title="Custom Websites"
              subtitle="Public-facing growth"
              bullets={[
                "Professional website design (Wix / Squarespace / Custom)",
                "Lead capture forms, booking, and quote pages",
                "SEO-ready structure + mobile optimization",
                "Perfect for businesses needing more customers",
              ]}
              ctaLabel="Get Website Quote"
              ctaHref="/build"
              secondaryLabel="See Pricing"
              secondaryHref="/pricing"
              badge="Most common starter"
              hot
            />

            <OfferCard
              title="Workflow Systems"
              subtitle="Back-office efficiency"
              bullets={[
                "Intake → CRM → invoice workflows",
                "Billing/admin process cleanup and automation",
                "Ops dashboards for tracking jobs, clients, and status",
                "Perfect for businesses losing time to manual work",
              ]}
              ctaLabel="Fix My Workflow"
              ctaHref="/systems"
              secondaryLabel="How It Works"
              secondaryHref="/systems"
              badge="Fast ROI"
            />

            <OfferCard
              title="Ongoing Support"
              subtitle="Monthly optimization"
              bullets={[
                "Website updates + landing pages",
                "Workflow improvements as business grows",
                "Reporting, fixes, and system tuning",
                "Best for teams needing a long-term tech partner",
              ]}
              ctaLabel="Book a Call"
              ctaHref="/systems"
              secondaryLabel="Client Portal"
              secondaryHref="/portal"
              badge="Retainer-friendly"
            />
          </div>
        </section>

        {/* SERVICE EXAMPLES / WHO IT'S FOR */}
        <section className="section">
          <div className="card">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                Who this is for
              </div>

              <div style={{ height: 12 }} />
              <h2 className="h2">Built for real business operations, not just pretty pages</h2>

              <p className="p" style={{ marginTop: 10, maxWidth: 920 }}>
                If you’re spending too much time texting customers, chasing invoices, copying data
                between tools, or manually tracking jobs, that’s exactly where I help.
              </p>

              <div className="grid2" style={{ marginTop: 14 }}>
                <div className="panel">
                  <div className="panelHeader">
                    <div style={{ fontWeight: 950 }}>Fast-start clients (quick wins)</div>
                    <div className="smallNote" style={{ marginTop: 4 }}>
                      Great if you need something live quickly
                    </div>
                  </div>
                  <div className="panelBody">
                    <MiniList
                      items={[
                        "Contractors / Handyman services",
                        "Cleaning services",
                        "Auto businesses / fleet services",
                        "Local delivery / courier services",
                        "Solo professionals needing booking + invoices",
                      ]}
                    />
                  </div>
                </div>

                <div className="panel">
                  <div className="panelHeader">
                    <div style={{ fontWeight: 950 }}>Longer-term clients (deeper systems)</div>
                    <div className="smallNote" style={{ marginTop: 4 }}>
                      Better fit for monthly support or phased builds
                    </div>
                  </div>
                  <div className="panelBody">
                    <MiniList
                      items={[
                        "Dental / medical offices (intake + reminders + billing handoff)",
                        "Law firms (client intake + status workflow)",
                        "Property managers (maintenance/job tracking)",
                        "E-commerce teams (orders, fulfillment, support flow)",
                        "Multi-location service businesses",
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div className="hint" style={{ marginTop: 14 }}>
                <strong style={{ color: "rgba(255,255,255,0.92)" }}>Examples of systems I can build:</strong>{" "}
                lead intake forms, quote pipelines, status dashboards, booking flows, invoice-trigger workflows,
                client update portals, internal admin panels, and service request tracking.
              </div>
            </div>
          </div>
        </section>

        {/* ENGAGEMENT MODEL */}
        <section className="section">
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                Engagement model
              </div>

              <div style={{ height: 12 }} />
              <h2 className="h2">Start with a project, grow into a retainer</h2>
              <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
                This is the easiest way to close clients faster while still building long-term
                revenue: solve one immediate problem first, then improve systems over time.
              </p>
            </div>

            <Link className="btn btnPrimary" href="/systems">
              Start Intake <span className="btnArrow">→</span>
            </Link>
          </div>

          <div className="grid2" style={{ marginTop: 18 }}>
            <div className="card cardHover">
              <div className="cardInner">
                <div className="badge badgeHot">Fast-start project</div>
                <div style={{ height: 10 }} />
                <div style={{ fontWeight: 950, fontSize: 20 }}>Workflow Sprint</div>
                <div className="pDark" style={{ marginTop: 6 }}>
                  Diagnose one bottleneck and build a fix (intake, quote flow, billing handoff,
                  CRM sync, admin tracking, etc.)
                </div>

                <ul className="tierList">
                  <li>Defined scope and timeline</li>
                  <li>Best for urgent ops pain</li>
                  <li>Good first project to build trust</li>
                </ul>

                <div className="tierCTA">
                  <Link className="btn btnPrimary" href="/systems">
                    Fix My Workflow
                  </Link>
                </div>
              </div>
            </div>

            <div className="card cardHover">
              <div className="cardInner">
                <div className="badge">Ongoing support</div>
                <div style={{ height: 10 }} />
                <div style={{ fontWeight: 950, fontSize: 20 }}>Systems + Website Partner</div>
                <div className="pDark" style={{ marginTop: 6 }}>
                  Monthly support to improve both customer-facing site experience and back-office
                  operations as the business grows.
                </div>

                <ul className="tierList">
                  <li>Continuous improvements</li>
                  <li>Prioritized updates + fixes</li>
                  <li>Best for growing teams</li>
                </ul>

                <div className="tierCTA">
                  <Link className="btn btnGhost" href="/portal">
                    Client Portal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WEBSITE TIERS (push lower like your mock) */}
        <section className="section">
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                Website pricing
              </div>

              <div style={{ height: 12 }} />
              <h2 className="h2">Choose the right build level</h2>

              <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
                Website projects use your System 2 pricing tiers. Workflow systems are quoted based
                on business complexity and can start as a fixed-scope sprint.
              </p>
            </div>

            <Link className="btn btnPrimary" href="/build">
              Get Website Quote <span className="btnArrow">→</span>
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
                <Step
                  n="1"
                  title="Choose your path"
                  desc="Start with Website Quote or Workflow Intake depending on your biggest need."
                />
                <Step
                  n="2"
                  title="Submit intake"
                  desc="Share business details, goals, and pain points so the scope matches your real needs."
                />
                <Step
                  n="3"
                  title="Get plan + recommendation"
                  desc="Receive a clear project direction, price range, and next step (call / deposit / assets)."
                />
                <Step
                  n="4"
                  title="Build + handoff"
                  desc="We build the system/site, track progress, and keep everything organized through your portal."
                />
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="sectionSm" style={{ paddingBottom: 34 }}>
          <div className="card cardHover">
            <div className="cardInner">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 950, fontSize: 22, letterSpacing: -0.4 }}>
                    Need customers, better systems, or both?
                  </div>
                  <div className="pDark" style={{ marginTop: 6, maxWidth: 760 }}>
                    Start with the path that solves your immediate problem first. We can expand from
                    there without rebuilding everything later.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href="/systems" className="btn btnPrimary">
                    Fix My Workflow
                  </Link>
                  <Link href="/build" className="btn btnGhost">
                    Get Website Quote
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function OfferCard({
  title,
  subtitle,
  bullets,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  badge,
  hot,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  badge: string;
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

          <div style={{ textAlign: "right" }}>
            <div className={`badge ${hot ? "badgeHot" : ""}`}>{badge}</div>
          </div>
        </div>

        <ul className="tierList">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="tierCTA">
          <Link className="btn btnPrimary" href={ctaHref}>
            {ctaLabel}
          </Link>
          <Link className="btn btnGhost" href={secondaryHref}>
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

function MiniList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9, color: "rgba(255,255,255,0.84)" }}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
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
            Get website quote
          </Link>
          <Link className="btn btnGhost" href="/pricing">
            Pricing
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
      <div
        className="cardInner"
        style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
      >
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