"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";

type Props = {
  leadEmail: string;
  leadPhone: string;
  intake: any;
};

type Breakdown = {
  base: number;
  pages: number;
  features: number;
  complexity: number;
  rush: number;
  total: number;
  notes: string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function estimateBreakdown(intake: any): Breakdown {
  // Goal: keep base in your target range ($450–$600) for typical small sites
  // Add costs only when scope grows.

  const notes: string[] = [];

  // base by type (kept modest)
  let base = 350;
  if (intake.websiteType === "Business") base = 380;
  if (intake.websiteType === "Portfolio") base = 360;
  if (intake.websiteType === "Landing") base = 320;
  if (intake.websiteType === "Ecommerce") base = 480;

  // pages add-on
  let pages = 0;
  if (intake.pages === "1-3") pages = 0;
  if (intake.pages === "4-5") pages = 70;
  if (intake.pages === "6-8") pages = 140;
  if (intake.pages === "9+") pages = 240;

  // feature add-on (light)
  let features = 0;
  if (intake.booking) features += 70;
  if (intake.payments) features += 110;
  if (intake.blog) features += 50;
  if (intake.membership) features += 160;

  // complexity signals (automation/integrations/stakeholders/content readiness)
  let complexity = 0;

  const automations = (intake.automationTypes?.length || 0) + (intake.wantsAutomation === "Yes" ? 1 : 0);
  if (automations > 0) {
    complexity += 80;
    notes.push("Automation requested (advanced scope).");
  }

  const integrations = (intake.integrations?.length || 0) + (intake.integrationOther ? 1 : 0);
  if (integrations > 0) {
    complexity += 60;
    notes.push("Integrations requested (advanced scope).");
  }

  if (intake.stakeholdersCount === "2-3") complexity += 40;
  if (intake.stakeholdersCount === "4+") complexity += 80;

  if (intake.contentReady === "Not ready") {
    complexity += 60;
    notes.push("Content not ready — may require copy help or extra iteration.");
  }

  // Rush fee (kept simple)
  let rush = 0;
  const subtotal = base + pages + features + complexity;

  if (intake.timeline === "Under 14 days") {
    rush = Math.round(subtotal * 0.2);
    notes.push("Rush timeline selected.");
  } else if (intake.timeline === "2-3 weeks") {
    rush = Math.round(subtotal * 0.1);
  }

  let total = subtotal + rush;

  // Keep small-business quotes in a comfortable range when scope is normal
  // but allow it to rise when scope is advanced.
  total = Math.round(total);

  return { base, pages, features, complexity, rush, total, notes };
}

function recommendedTier(total: number, intake: any) {
  // If they selected advanced signals, recommend higher tier even if total is modest.
  const advancedSignals =
    intake.wantsAutomation === "Yes" ||
    (intake.automationTypes?.length || 0) > 0 ||
    (intake.integrations?.length || 0) > 0 ||
    intake.integrationOther ||
    intake.membership ||
    intake.websiteType === "Ecommerce" ||
    intake.pages === "9+" ||
    intake.pages === "6-8";

  if (advancedSignals && total >= 900) return "Advanced";
  if (advancedSignals) return "Professional";

  if (total <= 650) return "Standard";
  if (total <= 1100) return "Professional";
  return "Advanced";
}

export default function EstimateClient({ intake, leadEmail, leadPhone }: Props) {
  const breakdown = useMemo(() => estimateBreakdown(intake), [intake]);
  const tier = useMemo(() => recommendedTier(breakdown.total, intake), [breakdown.total, intake]);

  const sentRef = useRef(false);

  // Auto-submit to Supabase + Resend alert once
  useEffect(() => {
    if (sentRef.current) return;
    if (!leadEmail) return;

    sentRef.current = true;

    fetch("/api/submit-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadEmail,
        leadPhone,
        intake,
        clientEstimate: breakdown.total,
      }),
    }).catch(() => {
      // ignore client errors; server will still work on next submission
    });
  }, [leadEmail, leadPhone, intake, breakdown.total]);

  return (
    <main style={container}>
      <header style={{ marginBottom: 26 }}>
        <h1 style={title}>Your Personalized Estimate</h1>
        <p style={subtitle}>
          This estimate is generated from your answers so you get a realistic starting point.
          Final pricing is confirmed during your consultation.
        </p>
      </header>

      {/* Personalized estimate card */}
      <section style={heroCard}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={pill}>Recommended: {tier}</div>
            <h2 style={{ margin: "10px 0 6px", fontSize: 28 }}>Estimated Total: ${breakdown.total}</h2>
            <div style={{ color: "#555", lineHeight: 1.7 }}>
              Based on: <strong>{intake.websiteType}</strong> · <strong>{intake.pages}</strong> pages ·{" "}
              <strong>
                {[
                  intake.booking && "Booking",
                  intake.payments && "Payments",
                  intake.blog && "Blog",
                  intake.membership && "Membership",
                ].filter(Boolean).join(", ") || "No major features"}
              </strong>
            </div>
          </div>

          <div style={ctaStack}>
            <a
              href="#tiers"
              style={btnPrimary}
            >
              See Packages →
            </a>

            {/* Replace with your Calendly later */}
            <a
              href="/"
              style={btnGhost}
              title="Swap this with your Calendly link when ready"
            >
              Book Free Consultation (coming next)
            </a>
          </div>
        </div>

        <div style={breakGrid}>
          <BreakLine label="Base" value={breakdown.base} />
          <BreakLine label="Pages" value={breakdown.pages} />
          <BreakLine label="Features" value={breakdown.features} />
          <BreakLine label="Complexity" value={breakdown.complexity} />
          <BreakLine label="Rush" value={breakdown.rush} />
        </div>

        {breakdown.notes.length > 0 && (
          <div style={noteBox}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>What increased the scope</div>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, color: "#444" }}>
              {breakdown.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: 14, color: "#666", fontSize: 13, lineHeight: 1.6 }}>
          You entered: <strong>{leadEmail}</strong>
          {leadPhone ? <> · <strong>{leadPhone}</strong></> : null}. We’ll follow up with next steps.
        </div>
      </section>

      {/* Pricing tiers as alternative paths */}
      <section id="tiers" style={{ marginTop: 38 }}>
        <h2 style={{ fontSize: 26, marginBottom: 10 }}>Packages (Optional)</h2>
        <p style={{ color: "#555", marginBottom: 22, maxWidth: 800, lineHeight: 1.7 }}>
          If your personalized estimate is higher than you expected, choose a package below as a simpler scope.
          We’ll confirm exact scope and pricing on the call.
        </p>

        <div style={grid}>
          <PricingCard
            title="Standard Website"
            price="$450 – $600"
            badge="Best for small businesses"
            highlight={tier === "Standard"}
            features={[
              "3–6 pages",
              "Mobile-responsive design",
              "Contact form or booking form",
              "Basic SEO structure",
              "Email notifications",
            ]}
            revisions="2 revisions (50% & 90%)"
            automation="No automation"
            cta="Select Standard →"
          />

          <PricingCard
            title="Professional Website"
            price="$750 – $1,000"
            badge="⭐ Most Popular"
            highlight={tier === "Professional"}
            features={[
              "Up to 8 pages",
              "Booking + contact forms",
              "SEO titles & meta setup",
              "Email automation",
              "Priority build queue",
            ]}
            revisions="2–4 revisions (based on scope)"
            automation="Email automation included"
            cta="Select Professional →"
          />

          <PricingCard
            title="Advanced / Growth Website"
            price="$1,500+"
            badge="For scaling businesses"
            highlight={tier === "Advanced"}
            features={[
              "10+ pages",
              "Advanced SEO & analytics",
              "Integrations & APIs",
              "Marketing setup",
              "Upgrade paths supported",
            ]}
            revisions="2–4 revisions (scope-defined) or more with retainer"
            automation="Email automation + optional SMS add-on"
            cta="Request Advanced Build →"
          />
        </div>

        <section style={disclaimer}>
          <p>
            Third-party tools, APIs, analytics platforms, and SMS services may require separate accounts and usage fees.
            SMS automation is available only as an optional add-on for Advanced projects.
          </p>
        </section>

        <div style={{ marginTop: 26 }}>
          <Link href="/" style={{ color: "#666", textDecoration: "none" }}>
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}

function BreakLine({ label, value }: { label: string; value: number }) {
  return (
    <div style={breakItem}>
      <div style={{ fontSize: 13, color: "#666", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900 }}>${value}</div>
    </div>
  );
}

function PricingCard({
  title,
  price,
  features,
  revisions,
  automation,
  cta,
  badge,
  highlight,
}: any) {
  return (
    <div
      style={{
        ...card,
        border: highlight ? "2px solid #000" : "1px solid #e5e5e5",
        boxShadow: highlight ? "0 18px 50px rgba(0,0,0,.08)" : "none",
      }}
    >
      {badge && <div style={badgeStyle}>{badge}</div>}

      <h3 style={{ marginBottom: 8, fontSize: 20 }}>{title}</h3>
      <div style={priceStyle}>{price}</div>

      <ul style={list}>
        {features.map((f: string) => (
          <li key={f}>✔ {f}</li>
        ))}
      </ul>

      <p style={meta}>
        <strong>Revisions:</strong> {revisions}
      </p>
      <p style={meta}>
        <strong>Automation:</strong> {automation}
      </p>

      <button style={primaryBtn} type="button">
        {cta}
      </button>

      <div style={{ marginTop: 10, fontSize: 12, color: "#777", lineHeight: 1.5 }}>
        * Scope is finalized after consultation. Revision limits prevent disputes.
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */

const container: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "80px 24px",
};

const title: React.CSSProperties = {
  fontSize: 42,
  fontWeight: 900,
  marginBottom: 10,
};

const subtitle: React.CSSProperties = {
  fontSize: 16,
  color: "#555",
  maxWidth: 820,
  lineHeight: 1.7,
};

const heroCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eaeaea",
  borderRadius: 22,
  padding: 26,
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid #e5e5e5",
  fontWeight: 800,
  fontSize: 12,
  background: "#fafafa",
};

const ctaStack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  minWidth: 260,
};

const btnPrimary: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 14px",
  background: "#000",
  color: "#fff",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 900,
  textAlign: "center",
};

const btnGhost: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 14px",
  background: "#fff",
  color: "#000",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 900,
  border: "1px solid #ddd",
  textAlign: "center",
};

const breakGrid: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
};

const breakItem: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 14,
  background: "#fafafa",
};

const noteBox: React.CSSProperties = {
  marginTop: 16,
  border: "1px solid #eee",
  background: "#fafafa",
  padding: 16,
  borderRadius: 16,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 24,
};

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  padding: 26,
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#000",
  color: "#fff",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 12,
};

const priceStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  marginBottom: 14,
};

const list: React.CSSProperties = {
  lineHeight: 1.9,
  paddingLeft: 0,
  listStyle: "none",
  color: "#333",
};

const meta: React.CSSProperties = {
  fontSize: 14,
  color: "#555",
  marginTop: 10,
};

const primaryBtn: React.CSSProperties = {
  marginTop: 16,
  padding: "14px 18px",
  background: "#000",
  color: "#fff",
  borderRadius: 12,
  border: "none",
  fontWeight: 900,
  cursor: "pointer",
};

const disclaimer: React.CSSProperties = {
  marginTop: 28,
  fontSize: 14,
  color: "#555",
  background: "#f9f9f9",
  padding: 20,
  borderRadius: 12,
};