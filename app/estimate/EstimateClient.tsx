"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  intake: any;
  leadEmail: string;
  leadPhone: string;
};

function truthy(v: any) {
  return v === true || v === "true" || v === "Yes";
}

function toList(csvOrArr: any): string[] {
  if (Array.isArray(csvOrArr)) return csvOrArr.filter(Boolean);
  if (typeof csvOrArr === "string" && csvOrArr.trim()) {
    return csvOrArr.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export default function EstimateClient({ intake, leadEmail, leadPhone }: Props) {
  const [copied, setCopied] = useState<null | "email" | "phone">(null);

  const summary = useMemo(() => {
    const pages = intake?.pages || "4-5";
    const websiteType = intake?.websiteType || "Business";
    const design = intake?.design || "Modern";
    const timeline = intake?.timeline || "2-3 weeks";

    const features: string[] = [];
    if (truthy(intake?.booking)) features.push("Booking / appointments");
    if (truthy(intake?.payments)) features.push("Payments / checkout");
    if (truthy(intake?.blog)) features.push("Blog / articles");
    if (truthy(intake?.membership)) features.push("Membership / gated content");

    const integrations = toList(intake?.integrations);
    const automationTypes = toList(intake?.automationTypes);

    // Simple heuristic tiers (you can refine later)
    let tier: "Starter" | "Growth" | "Pro" = "Starter";
    if (pages === "6-8" || pages === "9+" || features.length >= 2) tier = "Growth";
    if (pages === "9+" || truthy(intake?.payments) || truthy(intake?.membership)) tier = "Pro";

    // Price hints (your estimate page can replace with your own pricing logic)
    const priceRange =
      tier === "Starter" ? "$450 – $750" : tier === "Growth" ? "$750 – $1,200" : "$1,200 – $1,800+";

    return {
      pages,
      websiteType,
      design,
      timeline,
      features,
      integrations,
      automationTypes,
      tier,
      priceRange,
      intent: intake?.intent || "",
      mode: intake?.mode || "",
      contentReady: intake?.contentReady || "",
      notes: intake?.notes || "",
    };
  }, [intake]);

  async function copy(text: string, kind: "email" | "phone") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <main className="container">
      <section className="reveal" style={{ marginBottom: 18 }}>
        <div className="glass" style={{ padding: 22, borderRadius: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 950, color: "rgba(255,255,255,0.85)" }}>Your Estimate</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                Based on your answers, here’s the recommended tier and ballpark range.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/build" className="btn btnGhost">
                Edit intake
              </Link>
              <Link href="/" className="btn btnGhost">
                Home
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 950, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                Recommended tier
              </div>
              <div style={{ fontWeight: 980, fontSize: 24, marginTop: 8 }}>
                {summary.tier}
              </div>
              <div style={{ color: "rgba(255,255,255,0.78)", marginTop: 6 }}>
                Range: <strong>{summary.priceRange}</strong>
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 950, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                Scope snapshot
              </div>
              <div style={{ marginTop: 10, color: "rgba(255,255,255,0.82)", lineHeight: 1.7 }}>
                <div><strong>{summary.websiteType}</strong> • <strong>{summary.pages}</strong> pages</div>
                <div>Design: <strong>{summary.design}</strong></div>
                <div>Timeline: <strong>{summary.timeline}</strong></div>
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 950, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                Next step
              </div>
              <div style={{ marginTop: 10, color: "rgba(255,255,255,0.78)", lineHeight: 1.7 }}>
                Book a quick call and we’ll confirm scope + exact price.
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a className="btn btnPrimary btnShimmer" href="mailto:couranr@couranauto.com">
                  Email to book →
                </a>
                <a className="btn btnGhost" href="tel:+17033819462">
                  Call →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILS GRID */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        <div className="card cardHover reveal" style={{ padding: 18, animationDelay: "0.08s" as any }}>
          <div style={{ fontWeight: 950, marginBottom: 10 }}>Features selected</div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9, color: "rgba(255,255,255,0.78)" }}>
            {(summary.features.length ? summary.features : ["None selected"]).map((f: string) => (
              <li key={f}>{f}</li>
            ))}
          </ul>

          {(summary.integrations.length || summary.automationTypes.length) ? (
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 950, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Integrations</div>
                <div style={{ marginTop: 6, color: "rgba(255,255,255,0.78)" }}>
                  {summary.integrations.length ? summary.integrations.join(", ") : "—"}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 950, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Automations</div>
                <div style={{ marginTop: 6, color: "rgba(255,255,255,0.78)" }}>
                  {summary.automationTypes.length ? summary.automationTypes.join(", ") : "—"}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="card cardHover reveal" style={{ padding: 18, animationDelay: "0.12s" as any }}>
          <div style={{ fontWeight: 950, marginBottom: 10 }}>Intake notes</div>
          <div style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.8 }}>
            <div><strong>Goal:</strong> {summary.intent || "—"}</div>
            <div><strong>Content readiness:</strong> {summary.contentReady || "—"}</div>
            <div style={{ marginTop: 10 }}>
              <strong>Notes:</strong>{" "}
              <span style={{ color: "rgba(255,255,255,0.72)" }}>{summary.notes || "—"}</span>
            </div>
          </div>
        </div>

        <div className="card cardHover reveal" style={{ padding: 18, animationDelay: "0.16s" as any }}>
          <div style={{ fontWeight: 950, marginBottom: 10 }}>Lead details (internal)</div>

          <div style={{ display: "grid", gap: 10, color: "rgba(255,255,255,0.78)" }}>
            <div className="card" style={{ padding: 12, background: "rgba(255,255,255,0.04)" }}>
              <div style={{ fontWeight: 950, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Email</div>
              <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <code style={{ color: "rgba(255,255,255,0.85)" }}>{leadEmail || "—"}</code>
                {leadEmail ? (
                  <button className="btn btnGhost" style={{ padding: "10px 12px" }} onClick={() => copy(leadEmail, "email")}>
                    {copied === "email" ? "Copied ✓" : "Copy"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="card" style={{ padding: 12, background: "rgba(255,255,255,0.04)" }}>
              <div style={{ fontWeight: 950, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Phone</div>
              <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <code style={{ color: "rgba(255,255,255,0.85)" }}>{leadPhone || "—"}</code>
                {leadPhone ? (
                  <button className="btn btnGhost" style={{ padding: "10px 12px" }} onClick={() => copy(leadPhone, "phone")}>
                    {copied === "phone" ? "Copied ✓" : "Copy"}
                  </button>
                ) : null}
              </div>
            </div>

            <div style={{ color: "rgba(255,255,255,0.66)", fontSize: 12, lineHeight: 1.6 }}>
              Tip: This section is for internal use. You can hide it for public-facing estimates later.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
