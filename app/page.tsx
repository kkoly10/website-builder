import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="container homePage">
      <div className="homeStarWash" aria-hidden="true" />

      {/* HERO */}
      <section className="hero">
        <div className="heroGrid">
          <div className="card cardHover heroCopy">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                CrecyStudio • Web + Business Systems
              </div>

              <div style={{ height: 14 }} />

              <h1 className="h1">
                Websites and workflow systems,{" "}
                <span className="underline">priced clearly</span> — built fast.
              </h1>

              <p className="p" style={{ maxWidth: 760, marginTop: 14 }}>
                We help businesses look professional online and run smoother behind the scenes —
                from conversion-focused websites to billing, CRM, and workflow automation systems.
              </p>

              <div style={{ marginTop: 12, color: "rgba(255,255,255,0.78)", fontSize: 14 }}>
                <strong>Business Systems Developer (Web + Automation)</strong> • CRM / Invoice / Billing Workflow Setup
              </div>

              <div className="heroActions">
                <Link href="/build" className="btn btnPrimary">
                  Get a Website Quote <span className="btnArrow">→</span>
                </Link>
                <Link href="/systems" className="btn btnGhost">
                  Fix My Workflow
                </Link>
              </div>

              <div className="pills">
                <span className="pill">Custom websites</span>
                <span className="pill">CRM + intake workflows</span>
                <span className="pill">Invoice reminders</span>
                <span className="pill">Dashboards + automation</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="statRow">
              <div className="stat">
                <div className="statNum">$550+</div>
                <div className="statLab">Web projects</div>
              </div>
              <div className="stat">
                <div className="statNum">$500+</div>
                <div className="statLab">Ops setup</div>
              </div>
            </div>

            <div className="cardInner">
              <div style={{ fontWeight: 950, marginBottom: 10 }}>What you can hire us for</div>

              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, color: "rgba(255,255,255,0.84)" }}>
                <li>Custom websites + lead capture</li>
                <li>CRM / intake workflow setup</li>
                <li>Invoice + billing reminder automation</li>
                <li>Simple internal dashboards and portals</li>
              </ul>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="badge badgeHot">Most clients start with a quick setup</span>
                <span className="badge">Scope-first pricing</span>
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                <Link className="btn btnPrimary" href="/systems">
                  Start Workflow Review <span className="btnArrow">→</span>
                </Link>
                <Link className="btn btnGhost" href="/estimate">
                  Website Estimate
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHOOSE PATH */}
      <section className="section">
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Choose your path
            </div>

            <div style={{ height: 12 }} />
            <h2 className="h2">What do you need help with right now?</h2>

            <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
              Start with the offer that solves your immediate problem. You can always bundle both later.
            </p>
          </div>
        </div>

        <div className="tierGrid" style={{ marginTop: 18 }}>
          <ServiceCard
            title="Custom Websites"
            subtitle="Best for launching or upgrading your online presence"
            bullets={[
              "Professional website design and build",
              "Lead capture and booking flow",
              "Wix / Squarespace / Custom (Next.js)",
              "Clear scope + revision structure",
            ]}
            ctaLabel="Get Website Quote"
            ctaHref="/build"
            secondaryLabel="See Web Pricing"
            secondaryHref="/estimate"
          />

          <ServiceCard
            title="Workflow Automation"
            subtitle="Best for fixing invoicing, CRM, and back-office systems"
            hot
            bullets={[
              "Lead intake and job/request tracking",
              "Invoice reminders and payment follow-ups",
              "CRM / QuickBooks workflow setup",
              "Dashboards + process visibility",
            ]}
            ctaLabel="Start Workflow Review"
            ctaHref="/systems"
            secondaryLabel="See Ops Packages"
            secondaryHref="#ops-packages"
          />
        </div>
      </section>

      {/* WEB PRICING TIERS */}
      <section className="section">
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Web Services • System 2
            </div>

            <div style={{ height: 12 }} />
            <h2 className="h2">Website builds with clear pricing and scope</h2>

            <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
              Keep your current website estimate flow. Start with the questionnaire and get a real estimate based on your scope.
            </p>
          </div>

          <Link className="btn btnPrimary" href="/build">
            Get a Website Quote <span className="btnArrow">→</span>
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

      {/* OPS PACKAGES */}
      <section id="ops-packages" className="section">
        <div className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              CrecyStudio Ops • Workflow Automation
            </div>

            <div style={{ height: 12 }} />
            <h2 className="h2">Contractor and small-business workflow systems</h2>

            <p className="p" style={{ marginTop: 10, maxWidth: 900 }}>
              We build simple business systems that reduce admin chaos: lead intake, request tracking, invoicing, payment reminders,
              CRM handoff, and basic dashboards. Great for plumbing, electrical, HVAC, cleaning, and growing service businesses.
            </p>

            <div className="tierGrid" style={{ marginTop: 18 }}>
              <OpsCard
                title="Quick Win Setup"
                price="$500–$1,200"
                badge="Fastest start"
                bullets={[
                  "1–2 workflow fixes (intake + reminders)",
                  "Basic request/job tracking",
                  "Invoice reminder setup",
                  "7–10 day setup window",
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
                  "Integrations (QuickBooks, Stripe, etc.)",
                  "Custom internal tools",
                ]}
              />
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn btnPrimary" href="/systems">
                Start Workflow Review <span className="btnArrow">→</span>
              </Link>
              <Link className="btn btnGhost" href="/book?service=ops">
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
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Professional process
            </div>

            <div style={{ height: 12 }} />
            <h2 className="h2">How it works</h2>

            <div style={{ height: 14 }} />

            <div style={{ display: "grid", gap: 12 }}>
              <Step n="1" title="Pick your path" desc="Website build, workflow automation, or a bundled growth setup." />
              <Step n="2" title="Questionnaire / review" desc="Answer a few targeted questions so scope stays clean." />
              <Step n="3" title="Estimate + scope snapshot" desc="Clear pricing, deliverables, exclusions, revisions, and timeline." />
              <Step n="4" title="Build + support" desc="Launch fast, then improve with structured updates and support." />
            </div>
          </div>
        </div>
      </section>
    </main>
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

          <div style={{ textAlign: "right" }}>
            <div className={`badge ${hot ? "badgeHot" : ""}`}>{hot ? "Recommended" : "Service"}</div>
          </div>
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
            <div className={`badge ${hot ? "badgeHot" : ""}`} style={{ marginTop: 10 }}>
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