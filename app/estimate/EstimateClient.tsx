"use client";

import { useMemo, useState } from "react";

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(sp: SearchParams, key: string) {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function toBool(v: string) {
  return v === "true" || v === "1" || v.toLowerCase() === "yes";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function EstimateClient({ searchParams }: { searchParams: SearchParams }) {
  const [copied, setCopied] = useState(false);

  const data = useMemo(() => {
    const websiteType = getParam(searchParams, "websiteType") || "Business";
    const pages = getParam(searchParams, "pages") || "4-5";
    const design = getParam(searchParams, "design") || "Modern";
    const timeline = getParam(searchParams, "timeline") || "2-3 weeks";

    const booking = toBool(getParam(searchParams, "booking"));
    const payments = toBool(getParam(searchParams, "payments"));
    const blog = toBool(getParam(searchParams, "blog"));
    const membership = toBool(getParam(searchParams, "membership"));

    const wantsAutomation = getParam(searchParams, "wantsAutomation") || "No";
    const automationTypes = (getParam(searchParams, "automationTypes") || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const integrations = (getParam(searchParams, "integrations") || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const contentReady = getParam(searchParams, "contentReady") || "Some";
    const hasLogo = getParam(searchParams, "hasLogo") || "Yes";
    const stakeholdersCount = getParam(searchParams, "stakeholdersCount") || "1";
    const notes = getParam(searchParams, "notes") || "";

    // Complexity scoring (simple + stable)
    let score = 0;

    // pages
    const pagePoints: Record<string, number> = { "1-3": 1, "4-5": 2, "6-8": 3, "9+": 5 };
    score += pagePoints[pages] ?? 2;

    // features
    if (booking) score += 2;
    if (payments) score += 3;
    if (blog) score += 1;
    if (membership) score += 4;

    // integrations/automation
    score += Math.min(integrations.length, 4); // cap
    if (wantsAutomation.toLowerCase() === "yes") score += 2;
    score += Math.min(automationTypes.length, 3);

    // readiness + stakeholders + timeline pressure
    if (contentReady === "Not ready") score += 2;
    if (hasLogo === "No") score += 1;
    if (stakeholdersCount === "4+") score += 2;
    if (timeline === "Under 14 days") score += 3;

    score = clamp(score, 1, 18);

    // Recommend tier
    const tier =
      score <= 6 ? "Starter" : score <= 12 ? "Pro" : "Premium";

    return {
      websiteType,
      pages,
      design,
      timeline,
      booking,
      payments,
      blog,
      membership,
      wantsAutomation,
      automationTypes,
      integrations,
      contentReady,
      hasLogo,
      stakeholdersCount,
      notes,
      score,
      tier,
    };
  }, [searchParams]);

  const tiers = useMemo(() => {
    // Price ranges: tweak later to your business model
    const base = {
      Starter: { from: 350, to: 650, delivery: "2–3 weeks" },
      Pro: { from: 650, to: 1200, delivery: "2–4 weeks" },
      Premium: { from: 1200, to: 2500, delivery: "3–6 weeks" },
    } as const;

    const all = [
      {
        name: "Starter",
        bestFor: "Simple sites that look premium and convert.",
        bullets: [
          "Modern landing / business site",
          "Basic sections + mobile optimization",
          "Contact form",
          "1 round of revisions",
        ],
        price: base.Starter,
      },
      {
        name: "Pro",
        bestFor: "Businesses that need features + integrations.",
        bullets: [
          "Everything in Starter",
          "Booking or advanced forms",
          "Payments OR blog (as needed)",
          "Integrations setup (GA4, Pixel, Maps, etc.)",
          "2 rounds of revisions",
        ],
        price: base.Pro,
      },
      {
        name: "Premium",
        bestFor: "Complex builds: membership, automation, or fast delivery.",
        bullets: [
          "Everything in Pro",
          "Automation flows (email/SMS/CRM routing)",
          "Membership/gated content or multi-step flows",
          "Priority delivery + QA checklist",
          "3 rounds of revisions",
        ],
        price: base.Premium,
      },
    ];

    return all;
  }, []);

  const summaryText = useMemo(() => {
    const features = [
      data.booking && "Booking",
      data.payments && "Payments",
      data.blog && "Blog",
      data.membership && "Membership",
    ]
      .filter(Boolean)
      .join(", ") || "None";

    const ints = data.integrations.length ? data.integrations.join(", ") : "None";
    const autos = data.automationTypes.length ? data.automationTypes.join(", ") : "None";

    return [
      `Website type: ${data.websiteType}`,
      `Pages: ${data.pages}`,
      `Design: ${data.design}`,
      `Timeline: ${data.timeline}`,
      `Features: ${features}`,
      `Integrations: ${ints}`,
      `Automation: ${data.wantsAutomation} (${autos})`,
      `Content readiness: ${data.contentReady}`,
      `Has logo: ${data.hasLogo}`,
      `Stakeholders: ${data.stakeholdersCount}`,
      `Complexity score: ${data.score}/18`,
      `Recommended tier: ${data.tier}`,
      data.notes ? `Notes: ${data.notes}` : "",
    ].filter(Boolean).join("\n");
  }, [data]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "36px auto", padding: "0 18px 40px" }}>
      <section style={hero}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={badge}>Estimate</div>
          <h1 style={h1}>Here are your options</h1>
          <p style={sub}>
            We generated these tiers from your scope. You can adjust anything by going back to{" "}
            <a href="/build" style={link}>Build</a>.
          </p>

          <div style={meterWrap}>
            <div style={meterTop}>
              <span style={{ fontWeight: 900 }}>Complexity</span>
              <span style={{ color: "#6B7280", fontWeight: 800 }}>{data.score}/18</span>
            </div>
            <div style={meterTrack}>
              <div style={{ ...meterFill, width: `${(data.score / 18) * 100}%` }} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <span style={pill}>Type: {data.websiteType}</span>
              <span style={pill}>Pages: {data.pages}</span>
              <span style={pill}>Design: {data.design}</span>
              <span style={pill}>Timeline: {data.timeline}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={copy} style={secondaryBtn}>
              {copied ? "Copied ✅" : "Copy scope summary"}
            </button>
            <a href="/build" style={ghostBtn}>Adjust scope</a>
            <a href="/dashboard" style={ghostBtn}>Go to dashboard</a>
          </div>
        </div>

        <div style={summaryCard}>
          <div style={{ fontWeight: 950, marginBottom: 10 }}>Your inputs</div>
          <div style={kvGrid}>
            <KV k="Features" v={
              ([data.booking && "Booking", data.payments && "Payments", data.blog && "Blog", data.membership && "Membership"]
                .filter(Boolean)
                .join(", ")) || "None"
            } />
            <KV k="Integrations" v={data.integrations.length ? data.integrations.join(", ") : "None"} />
            <KV k="Automation" v={data.wantsAutomation === "Yes" ? (data.automationTypes.join(", ") || "Yes") : "No"} />
            <KV k="Readiness" v={`${data.contentReady} content · Logo: ${data.hasLogo}`} />
          </div>

          {data.notes ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 12, color: "#111827" }}>Notes</div>
              <div style={{ color: "#374151", lineHeight: 1.6, marginTop: 6 }}>
                {data.notes}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <div style={grid3}>
          {tiers.map((t) => {
            const recommended = t.name === data.tier;
            return (
              <div
                key={t.name}
                style={{
                  ...tierCard,
                  border: recommended ? "2px solid #0B1220" : "1px solid rgba(229,231,235,0.9)",
                  transform: recommended ? "translateY(-2px)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>{t.name}</div>
                    <div style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>
                      {t.bestFor}
                    </div>
                  </div>
                  {recommended ? <div style={recBadge}>Recommended</div> : null}
                </div>

                <div style={priceBlock}>
                  <div style={{ fontWeight: 950, fontSize: 28, letterSpacing: -0.6 }}>
                    ${t.price.from}–${t.price.to}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: 13, fontWeight: 800 }}>
                    Typical delivery: {t.price.delivery}
                  </div>
                </div>

                <ul style={ul}>
                  {t.bullets.map((b) => (
                    <li key={b} style={li}>
                      <span style={dot} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                  <a href="/build" style={ghostBtn}>
                    Edit scope
                  </a>
                  <a href="/dashboard" style={primaryBtn}>
                    Choose {t.name} →
                  </a>
                </div>

                <div style={finePrint}>
                  Final price depends on confirmed scope + content readiness.
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 950, color: "#111827" }}>{k}</div>
      <div style={{ color: "#374151", lineHeight: 1.6 }}>{v}</div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const hero: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr",
  gap: 14,
  alignItems: "start",
};

const badge: React.CSSProperties = {
  display: "inline-flex",
  alignSelf: "start",
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid rgba(229,231,235,0.9)",
  background: "#fff",
  fontWeight: 950,
  fontSize: 12,
  width: "fit-content",
};

const h1: React.CSSProperties = {
  margin: 0,
  fontSize: 44,
  letterSpacing: -1.0,
  lineHeight: 1.05,
};

const sub: React.CSSProperties = {
  margin: 0,
  color: "#374151",
  fontSize: 15,
  lineHeight: 1.7,
  maxWidth: 620,
};

const link: React.CSSProperties = {
  color: "#0B1220",
  fontWeight: 950,
  textDecoration: "underline",
};

const meterWrap: React.CSSProperties = {
  marginTop: 8,
  background: "#fff",
  borderRadius: 18,
  border: "1px solid rgba(229,231,235,0.9)",
  padding: 14,
};

const meterTop: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 10,
};

const meterTrack: React.CSSProperties = {
  height: 10,
  borderRadius: 999,
  background: "rgba(229,231,235,0.9)",
  overflow: "hidden",
};

const meterFill: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "#0B1220",
};

const pill: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid rgba(229,231,235,0.9)",
  background: "#F9FAFB",
  fontSize: 12,
  fontWeight: 900,
  color: "#111827",
};

const summaryCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  border: "1px solid rgba(229,231,235,0.9)",
  padding: 16,
};

const kvGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const grid3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 14,
};

const tierCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 1px 0 rgba(15,23,42,0.04)",
  transition: "transform 120ms ease",
};

const recBadge: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  background: "#0B1220",
  color: "#fff",
  fontWeight: 950,
  fontSize: 12,
  height: "fit-content",
};

const priceBlock: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(229,231,235,0.9)",
  background: "#F9FAFB",
};

const ul: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: "14px 0 0",
  display: "grid",
  gap: 10,
};

const li: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  color: "#111827",
  lineHeight: 1.6,
  fontWeight: 700,
  fontSize: 13,
};

const dot: React.CSSProperties = {
  width: 8,
  height: 8,
  marginTop: 6,
  borderRadius: 999,
  background: "#0B1220",
  flex: "0 0 auto",
};

const finePrint: React.CSSProperties = {
  marginTop: 12,
  color: "#6B7280",
  fontSize: 12,
  lineHeight: 1.5,
};

const primaryBtn: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  background: "#0B1220",
  color: "#fff",
  fontWeight: 950,
  textDecoration: "none",
  border: "1px solid #0B1220",
};

const secondaryBtn: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  background: "#fff",
  color: "#0B1220",
  fontWeight: 950,
  border: "1px solid rgba(229,231,235,0.9)",
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.7)",
  color: "#0B1220",
  fontWeight: 950,
  textDecoration: "none",
  border: "1px solid rgba(229,231,235,0.9)",
};
