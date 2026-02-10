"use client";

import { useMemo } from "react";
import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

/** Accept either the new style (searchParams) OR legacy style (intake/leadEmail/leadPhone). */
type Props =
  | { searchParams: SearchParams }
  | { intake: any; leadEmail?: string; leadPhone?: string };

function pick(sp: SearchParams, key: string): string {
  const v = sp?.[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function truthy(v: string) {
  return v === "true" || v === "1" || v === "Yes";
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function money(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function EstimateClient(props: Props) {
  const normalized = useMemo(() => {
    // If page.tsx passes searchParams, reconstruct intake from query
    if ("searchParams" in props) {
      const sp = props.searchParams ?? {};
      const intake = {
        mode: pick(sp, "mode") || "known",
        intent: pick(sp, "intent") || "Marketing",
        intentOther: pick(sp, "intentOther") || "",
        websiteType: pick(sp, "websiteType") || "Business",
        pages: pick(sp, "pages") || "4-5",
        booking: truthy(pick(sp, "booking")),
        payments: truthy(pick(sp, "payments")),
        blog: truthy(pick(sp, "blog")),
        membership: truthy(pick(sp, "membership")),
        wantsAutomation: pick(sp, "wantsAutomation") || "No",
        automationTypes: (pick(sp, "automationTypes") || "").split(",").map(s => s.trim()).filter(Boolean),
        integrations: (pick(sp, "integrations") || "").split(",").map(s => s.trim()).filter(Boolean),
        integrationOther: pick(sp, "integrationOther") || "",
        hasLogo: pick(sp, "hasLogo") || "Yes",
        hasBrandGuide: pick(sp, "hasBrandGuide") || "No",
        contentReady: pick(sp, "contentReady") || "Some",
        assetsSource: pick(sp, "assetsSource") || "Client provides",
        referenceWebsite: pick(sp, "referenceWebsite") || "",
        decisionMaker: pick(sp, "decisionMaker") || "Yes",
        stakeholdersCount: pick(sp, "stakeholdersCount") || "1",
        design: pick(sp, "design") || "Modern",
        timeline: pick(sp, "timeline") || "2-3 weeks",
        notes: pick(sp, "notes") || "",
      };

      const leadEmail = pick(sp, "leadEmail") || pick(sp, "email") || "";
      const leadPhone = pick(sp, "leadPhone") || pick(sp, "phone") || "";

      return { intake, leadEmail, leadPhone };
    }

    // Legacy props
    return {
      intake: props.intake ?? {},
      leadEmail: props.leadEmail ?? "",
      leadPhone: props.leadPhone ?? "",
    };
  }, [props]);

  const intake = normalized.intake;

  const score = useMemo(() => {
    // A simple “effort score” used for ranges.
    const pages = String(intake.pages || "4-5");
    let s = 0;

    if (pages === "1-3") s += 1;
    else if (pages === "4-5") s += 2;
    else if (pages === "6-8") s += 3;
    else s += 4;

    if (intake.booking) s += 1;
    if (intake.payments) s += 2;
    if (intake.blog) s += 1;
    if (intake.membership) s += 2;

    if (String(intake.wantsAutomation || "No") === "Yes") s += 2;
    if ((intake.integrations || []).length >= 3) s += 1;

    if (String(intake.contentReady) === "Not ready") s += 1;
    if (String(intake.hasBrandGuide) === "No") s += 1;

    if (String(intake.timeline) === "Under 14 days") s += 2;

    return clamp(s, 1, 12);
  }, [intake]);

  const tiers = useMemo(() => {
    // Convert score to pricing bands
    const base = 300 + score * 65;
    const mid = 450 + score * 95;
    const pro = 650 + score * 140;

    return [
      {
        name: "Starter",
        tag: "Fast + clean launch",
        priceFrom: Math.round(base),
        includes: [
          "Modern single-page or small site",
          "Mobile-first layout",
          "Basic SEO setup",
          "1 revision round",
        ],
        bestFor: "Simple marketing sites",
      },
      {
        name: "Growth",
        tag: "Most popular",
        priceFrom: Math.round(mid),
        highlight: true,
        includes: [
          "Multi-page build",
          "Conversion sections + CTA flow",
          "Forms / booking options",
          "2 revision rounds",
        ],
        bestFor: "Businesses needing leads + trust",
      },
      {
        name: "Pro",
        tag: "Advanced features",
        priceFrom: Math.round(pro),
        includes: [
          "Payments / membership ready",
          "Automation + integrations support",
          "Performance + analytics setup",
          "Priority delivery options",
        ],
        bestFor: "High-intent businesses",
      },
    ];
  }, [score]);

  const featureBadges = useMemo(() => {
    const badges: string[] = [];
    if (intake.booking) badges.push("Booking");
    if (intake.payments) badges.push("Payments");
    if (intake.blog) badges.push("Blog");
    if (intake.membership) badges.push("Membership");
    if (String(intake.wantsAutomation) === "Yes") badges.push("Automations");
    if ((intake.integrations || []).length) badges.push("Integrations");
    return badges.length ? badges : ["Core site"];
  }, [intake]);

  return (
    <main style={{ padding: "8px 0 0" }}>
      <section className="glass" style={{ padding: 22, marginBottom: 18 }}>
        <div className="kicker">Instant Estimate</div>
        <div className="h1" style={{ marginTop: 10 }}>
          Premium pricing, without the guessing.
        </div>
        <div className="p" style={{ maxWidth: 860 }}>
          Based on your intake, here are the best-fit options. You’ll also see exactly
          what drives complexity so there are no surprises.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          {featureBadges.map((b) => (
            <span
              key={b}
              style={{
                padding: "8px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                fontWeight: 900,
                fontSize: 12,
                color: "rgba(255,255,255,0.80)",
              }}
            >
              {b}
            </span>
          ))}
        </div>

        {(normalized.leadEmail || normalized.leadPhone) ? (
          <div className="small" style={{ marginTop: 10 }}>
            Saved for follow-up:{" "}
            <strong>{normalized.leadEmail || "—"}</strong>{" "}
            {normalized.leadPhone ? <>· <strong>{normalized.leadPhone}</strong></> : null}
          </div>
        ) : (
          <div className="small" style={{ marginTop: 10 }}>
            Tip: add your email/phone in the form so we can follow up.
          </div>
        )}
      </section>

      <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {tiers.map((t) => (
          <div
            key={t.name}
            className={t.highlight ? "card" : "glass"}
            style={{
              padding: 18,
              border: t.highlight ? "1px solid rgba(124,58,237,0.35)" : undefined,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {t.highlight ? (
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  padding: "8px 10px",
                  borderRadius: 999,
                  background: "rgba(124,58,237,0.20)",
                  border: "1px solid rgba(124,58,237,0.35)",
                  fontWeight: 950,
                  fontSize: 12,
                }}
              >
                ★ Recommended
              </div>
            ) : null}

            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div className="h2">{t.name}</div>
                <div className="small">{t.tag}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 950, fontSize: 22 }}>
                  ${money(t.priceFrom)}+
                </div>
                <div className="small">starting</div>
              </div>
            </div>

            <div className="hr" />

            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, color: "rgba(255,255,255,0.80)" }}>
              {t.includes.map((x) => (
                <li key={x}><strong>✓</strong> {x}</li>
              ))}
            </ul>

            <div className="small" style={{ marginTop: 12 }}>
              <strong>Best for:</strong> {t.bestFor}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <a className={"btn " + (t.highlight ? "btnPrimary" : "btnGhost")} href="/build">
                Book / Request quote →
              </a>
              <Link className="btn btnGhost" href="/build">
                Refine scope
              </Link>
            </div>
          </div>
        ))}
      </section>

      <section className="glass" style={{ padding: 18, marginTop: 14 }}>
        <div className="h2">What drove this estimate</div>
        <div className="grid2" style={{ marginTop: 10 }}>
          <div>
            <div className="label">Website type</div>
            <div className="p">{String(intake.websiteType || "—")}</div>
          </div>
          <div>
            <div className="label">Pages</div>
            <div className="p">{String(intake.pages || "—")}</div>
          </div>
          <div>
            <div className="label">Timeline</div>
            <div className="p">{String(intake.timeline || "—")}</div>
          </div>
          <div>
            <div className="label">Design direction</div>
            <div className="p">{String(intake.design || "—")}</div>
          </div>
        </div>

        <div className="hr" />

        <div className="small">
          Final pricing is confirmed after a quick scope check (usually 5–10 minutes). We keep it transparent:
          if scope changes, the price changes — and you’ll see why.
        </div>
      </section>
    </main>
  );
}
