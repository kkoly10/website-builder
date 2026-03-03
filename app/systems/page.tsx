// app/systems/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SystemsPage() {
  return (
    <main className="container" style={{ paddingBottom: 80 }}>

      {/* HERO */}
      <section className="section" style={{ padding: "80px 0 60px", textAlign: "center", maxWidth: 860, margin: "0 auto" }}>
        <div className="kicker" style={{ marginBottom: 24 }}>Business Systems & Automation</div>
        <h1 className="h1">Scale your operations without scaling your headcount.</h1>
        <p className="p" style={{ marginTop: 24, fontSize: 20 }}>
          I build practical, custom workflow systems for local businesses. Stop losing hours to manual data entry, disconnected software, and messy client onboarding.
        </p>
        <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <Link href="/ops-intake" className="btn btnPrimary" style={{ padding: "16px 28px", fontSize: 16 }}>
            Start Workflow Audit <span className="btnArrow">→</span>
          </Link>
        </div>
        <div className="pills" style={{ justifyContent: "center", marginTop: 24 }}>
          <span className="pill">Quick wins + retainers</span>
          <span className="pill">CRM Cleanup</span>
          <span className="pill">Intake & Billing Automation</span>
        </div>
      </section>

      {/* AGITATION */}
      <section className="section" style={{ borderTop: "1px solid var(--stroke)", paddingTop: 60 }}>
        <div className="grid2" style={{ alignItems: "center", gap: 40 }}>
          <div>
            <h2 className="h2">The signs your systems are breaking:</h2>
            <ul style={{ margin: "20px 0 0", paddingLeft: 20, color: "var(--muted)", lineHeight: 1.9, fontSize: 18 }}>
              <li><strong style={{ color: "var(--fg)" }}>Data Entry:</strong> You manually type the same client info into 3 different tools.</li>
              <li><strong style={{ color: "var(--fg)" }}>Lost Revenue:</strong> Leads come in, but follow-ups and invoices fall through the cracks.</li>
              <li><strong style={{ color: "var(--fg)" }}>Client Friction:</strong> Onboarding requires endless back-and-forth emails and messy PDFs.</li>
              <li><strong style={{ color: "var(--fg)" }}>Software Soup:</strong> You pay for 8 different SaaS tools, but none of them talk to each other.</li>
            </ul>
          </div>
          <div className="card">
            <div className="cardInner" style={{ padding: 40 }}>
              <div style={{ fontWeight: 800, fontSize: 22, color: "var(--fg)", marginBottom: 12 }}>The Solution is Connection.</div>
              <p className="pDark">
                You don&apos;t need more software. You need your current software (QuickBooks, HubSpot, Stripe, Google Workspace) wired together properly. I build the bridges and client-facing portals that make your business run on autopilot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING NOTE */}
      <section className="section" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div style={{ background: "var(--panel2)", border: "1px solid var(--stroke)", borderRadius: 14, padding: "20px 28px", maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <p className="pDark" style={{ margin: 0, fontSize: 15 }}>
            <strong style={{ color: "var(--fg)" }}>Transparent pricing.</strong>{" "}
            All projects start with a free workflow audit. Final scope and price confirmed before any work begins. 50% deposit to start, 50% on completion.
          </p>
        </div>
      </section>

      {/* SERVICE TIERS */}
      <section className="section">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="kicker">Service Levels</div>
          <h2 className="h2" style={{ marginTop: 12 }}>Built for quick fixes and long-term scaling</h2>
          <p className="pDark" style={{ marginTop: 12 }}>Prices shown are typical project ranges. Your exact quote is generated after the free audit.</p>
        </div>
        <div className="tierGrid">
          <ServiceCard
            title="Quick Workflow Fix"
            subtitle="Fast-start sprint"
            price="$1,000 – $1,800"
            priceNote="Single workflow or integration"
            bullets={[
              "Fix a broken intake / booking flow",
              "Clean up lead handoff to email/CRM",
              "Improve quote or invoice process",
              "Small automation setup (Zapier/Make)",
            ]}
            ctaHref="/ops-intake"
            ctaLabel="Start Intake"
          />
          <ServiceCard
            title="Ops System Build"
            subtitle="Most common engagement"
            price="$2,000 – $4,000"
            priceNote="Full system buildout"
            hot
            bullets={[
              "Custom intake + booking + status flow",
              "Client-facing portal/dashboard setup",
              "Back-office admin tracking + reporting",
              "Complex integrations between your tools",
            ]}
            ctaHref="/ops-intake"
            ctaLabel="Start Full Audit"
          />
          <ServiceCard
            title="Ongoing Systems Partner"
            subtitle="Monthly Retainer"
            price="$500 – $1,500/mo"
            priceNote="After initial build"
            bullets={[
              "Continuous improvements & maintenance",
              "Workflow updates as your team grows",
              "New forms, automations, and reports",
              "Priority support for issues and changes",
            ]}
            ctaHref="/ops-intake"
            ctaLabel="Request a Plan"
          />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" style={{ borderTop: "1px solid var(--stroke)", paddingTop: 60 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="kicker">Results</div>
          <h2 className="h2" style={{ marginTop: 12 }}>What clients say</h2>
        </div>
        <div className="grid2" style={{ gap: 16 }}>
          <div className="card">
            <div className="cardInner" style={{ padding: 32 }}>
              <p className="pDark" style={{ fontSize: 16, lineHeight: 1.7, fontStyle: "italic" }}>
                "Before working with CrecyStudio, our intake process was a mess of spreadsheets and missed follow-ups. Now everything runs automatically and we haven't lost a lead in months."
              </p>
              <div style={{ marginTop: 20, fontWeight: 700, color: "var(--fg)" }}>Sarah M.</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Owner, boutique law firm</div>
            </div>
          </div>
          <div className="card">
            <div className="cardInner" style={{ padding: 32 }}>
              <p className="pDark" style={{ fontSize: 16, lineHeight: 1.7, fontStyle: "italic" }}>
                "We were paying for five tools that didn't talk to each other. CrecyStudio connected everything in two weeks. It paid for itself in the first month."
              </p>
              <div style={{ marginTop: 20, fontWeight: 700, color: "var(--fg)" }}>Marcus T.</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Operations Manager, HVAC company</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section">
        <div className="card">
          <div className="cardInner" style={{ padding: 40 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h2 className="h2">The path to a smoother business</h2>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <Step n="1" title="Submit the Workflow Audit" desc="Tell me what's breaking, what tools you currently pay for, and what your ideal outcome is." />
              <Step n="2" title="AI & Expert Analysis" desc="I run your data through my PIE framework to identify risks, scope options, and generate a projected investment range." />
              <Step n="3" title="Strategy Call & Build" desc="We review the plan. If it makes sense, I build the automation, test it, and train your team on how to use it." />
            </div>
            <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
              <Link href="/ops-intake" className="btn btnPrimary" style={{ padding: "16px 32px" }}>
                Start Workflow Audit <span className="btnArrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="kicker">FAQ</div>
          <h2 className="h2" style={{ marginTop: 12 }}>Common questions</h2>
        </div>
        <div style={{ display: "grid", gap: 12, maxWidth: 720, margin: "0 auto" }}>
          {[
            {
              q: "How long does a typical build take?",
              a: "Quick Workflow Fix projects usually take 1–2 weeks. Full Ops System Builds take 2–4 weeks depending on complexity and how quickly we get access to your tools.",
            },
            {
              q: "What if I don't like the result?",
              a: "Every project includes a revision round before final delivery. We don't mark a project complete until you're satisfied. The audit call before we start ensures we're fully aligned on the goal.",
            },
            {
              q: "Do I need to switch any of my current software?",
              a: "Almost never. The whole point is to make your existing tools work together better. We build the bridges, not replace the foundation.",
            },
            {
              q: "What does the free audit actually involve?",
              a: "You fill out the intake form, we analyze it with our PIE system, then we get on a 20-minute call to walk through a tailored plan. No pressure, no pitch — just a clear picture of what's broken and what it would cost to fix it.",
            },
            {
              q: "Can I start small and expand later?",
              a: "Yes — that's actually the recommended path. Start with a Quick Workflow Fix on your biggest pain point, then move to a full system build once you've seen the results.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="card" style={{ background: "var(--panel2)" }}>
              <div className="cardInner" style={{ padding: 24 }}>
                <div style={{ fontWeight: 800, color: "var(--fg)", marginBottom: 8 }}>{q}</div>
                <p className="pDark" style={{ margin: 0, fontSize: 15 }}>{a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}

function ServiceCard({
  title, subtitle, price, priceNote, bullets, ctaHref, ctaLabel, hot,
}: {
  title: string; subtitle: string; price: string; priceNote: string;
  bullets: string[]; ctaHref: string; ctaLabel: string; hot?: boolean;
}) {
  return (
    <div className="card cardHover" style={{ display: "flex", flexDirection: "column" }}>
      <div className="cardInner" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div className="tierHead">
          <div>
            <div className="tierName">{title}</div>
            <div className="tierSub">{subtitle}</div>
          </div>
          <span className={`badge ${hot ? "badgeHot" : ""}`}>{hot ? "Recommended" : "Service"}</span>
        </div>
        <div style={{ marginTop: 20, paddingBottom: 20, borderBottom: "1px solid var(--stroke)" }}>
          <div style={{ fontSize: 28, fontWeight: 950, color: "var(--fg)", letterSpacing: "-0.5px" }}>{price}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{priceNote}</div>
        </div>
        <ul className="tierList" style={{ flexGrow: 1, margin: "20px 0" }}>
          {bullets.map((b) => <li key={b} style={{ marginBottom: 8 }}>{b}</li>)}
        </ul>
        <div className="tierCTA" style={{ marginTop: "auto" }}>
          <Link className="btn btnPrimary" href={ctaHref} style={{ width: "100%" }}>
            {ctaLabel} <span className="btnArrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="card" style={{ background: "var(--panel2)" }}>
      <div className="cardInner" style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18, background: "var(--accentSoft)", border: "1px solid var(--accentStroke)", color: "var(--accent)", flex: "0 0 auto" }}>
          {n}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "var(--fg)" }}>{title}</div>
          <div className="p" style={{ marginTop: 6, fontSize: 15 }}>{desc}</div>
        </div>
      </div>
    </div>
  );
}
