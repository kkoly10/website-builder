"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

type Intake = {
  platform: "wix" | "squarespace" | "custom";
  pages: "1-3" | "4-6" | "7-10" | "10+";
  design: "clean" | "bold" | "premium";
  timeline: "2-4w" | "1w" | "rush";
  contentReady: "yes" | "some" | "no";
  hasBrand: "yes" | "no";
  domainHosting: "yes" | "no";

  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;

  wantsAutomation: "no" | "yes";
  budget: "under-500" | "500-1000" | "1000-2000" | "2000+" | "3500+";

  competitorUrl: string;
  notes: string;

  leadEmail: string;
  leadPhone: string;
};

type Props = { searchParams?: SearchParams };

function pick(params: SearchParams | undefined, key: string) {
  const v = params?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}
function asBool(v: string) {
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

type TierKey = "essential" | "growth" | "premium";

const TIERS: Record<
  TierKey,
  {
    name: string;
    publicRange: string;
    range: [number, number];
    label: string;
    bullets: string[];
    revisionLabel: string;
    exclusions: string[];
  }
> = {
  essential: {
    name: "Essential Launch",
    publicRange: "$550–$850",
    range: [550, 850],
    label: "Best for simple launches",
    bullets: [
      "Up to ~5 pages/sections",
      "Clean layout + mobile responsive",
      "Contact form + basic SEO",
      "Fast launch path",
    ],
    revisionLabel: "1 revision round (structured)",
    exclusions: ["Custom app logic", "Complex automations", "Membership/payments (usually add scope)"],
  },
  growth: {
    name: "Growth Build",
    publicRange: "$900–$1,500",
    range: [900, 1500],
    label: "Most chosen",
    bullets: [
      "5–8 pages/sections + stronger UX",
      "Booking + lead capture improvements",
      "SEO structure + analytics",
      "More polish + conversion flow",
    ],
    revisionLabel: "2 revision rounds (structured)",
    exclusions: ["Complex membership systems", "Multi-role portals (usually Premium)"],
  },
  premium: {
    name: "Premium Platform",
    publicRange: "$1,700–$3,500+",
    range: [1700, 3500],
    label: "Best for scale",
    bullets: [
      "Custom features + integrations",
      "Advanced UI + performance focus",
      "Payments/membership/automation options",
      "More complex workflows",
    ],
    revisionLabel: "2–3 revision rounds (by scope)",
    exclusions: ["Enterprise SSO", "Very large content migrations (handled separately)"],
  },
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

const STEPS = [
  { key: "platform", title: "Platform" },
  { key: "size", title: "Site size" },
  { key: "features", title: "Features" },
  { key: "readiness", title: "Readiness" },
  { key: "timeline", title: "Timeline" },
  { key: "contact", title: "Contact" },
] as const;

export default function EstimateClient({ searchParams }: Props) {
  const [step, setStep] = useState(0);

  const [intake, setIntake] = useState<Intake>(() => {
    // defaults (System 2 aligned)
    const sp = searchParams || {};
    const platform = (pick(sp, "platform") || "custom") as Intake["platform"];
    const pages = (pick(sp, "pages") || "1-3") as Intake["pages"];

    return {
      platform: ["wix", "squarespace", "custom"].includes(platform) ? platform : "custom",
      pages: ["1-3", "4-6", "7-10", "10+"].includes(pages) ? pages : "1-3",
      design: (pick(sp, "design") as any) || "clean",
      timeline: (pick(sp, "timeline") as any) || "2-4w",
      contentReady: (pick(sp, "contentReady") as any) || "some",
      hasBrand: (pick(sp, "hasBrand") as any) || "no",
      domainHosting: (pick(sp, "domainHosting") as any) || "no",

      booking: asBool(pick(sp, "booking")),
      payments: asBool(pick(sp, "payments")),
      blog: asBool(pick(sp, "blog")),
      membership: asBool(pick(sp, "membership")),

      wantsAutomation: (pick(sp, "wantsAutomation") as any) || "no",
      budget: (pick(sp, "budget") as any) || "500-1000",

      competitorUrl: pick(sp, "competitorUrl") || "",
      notes: pick(sp, "notes") || "",

      leadEmail: pick(sp, "leadEmail") || "",
      leadPhone: pick(sp, "leadPhone") || "",
    };
  });

  // If they land on /estimate?something=... we want to reflect it.
  useEffect(() => {
    if (!searchParams) return;
    // minimal sync: only fill empty fields from URL so we don't fight user changes
    setIntake((prev) => ({
      ...prev,
      leadEmail: prev.leadEmail || pick(searchParams, "leadEmail") || "",
      leadPhone: prev.leadPhone || pick(searchParams, "leadPhone") || "",
    }));
  }, [searchParams]);

  const result = useMemo(() => {
    let score = 0;
    let price = 550;
    const drivers: string[] = [];

    // platform (Wix/Squarespace slightly less dev overhead, Custom has more)
    if (intake.platform === "custom") {
      score += 1;
      price += 120;
      drivers.push("Custom build (Next.js)");
    } else {
      drivers.push(intake.platform === "wix" ? "Wix build" : "Squarespace build");
    }

    // pages
    if (intake.pages === "4-6") { score += 1; price += 220; drivers.push("More pages/sections"); }
    if (intake.pages === "7-10") { score += 2; price += 520; drivers.push("Larger site size"); }
    if (intake.pages === "10+") { score += 3; price += 900; drivers.push("High page count"); }

    // design polish
    if (intake.design === "bold") { score += 1; price += 120; drivers.push("Bold design direction"); }
    if (intake.design === "premium") { score += 2; price += 240; drivers.push("Premium polish"); }

    // features
    if (intake.booking) { score += 1; price += 180; drivers.push("Booking / scheduling"); }
    if (intake.payments) { score += 2; price += 320; drivers.push("Payments"); }
    if (intake.membership) { score += 2; price += 520; drivers.push("Membership"); }
    if (intake.blog) { score += 1; price += 140; drivers.push("Blog / CMS"); }

    // automation
    if (intake.wantsAutomation === "yes") { score += 1; price += 220; drivers.push("Automation/integrations"); }

    // readiness
    if (intake.contentReady === "no") { score += 1; price += 180; drivers.push("Content not ready"); }
    if (intake.hasBrand === "no") { score += 1; price += 160; drivers.push("Needs branding polish"); }
    if (intake.domainHosting === "no") { score += 1; price += 120; drivers.push("Domain/hosting setup"); }

    // timeline
    if (intake.timeline === "1w") { score += 1; price += 220; drivers.push("Tight timeline"); }
    if (intake.timeline === "rush") { score += 2; price += 360; drivers.push("Rush timeline"); }

    // tier recommendation
    let tier: TierKey = "essential";
    if (score >= 5) tier = "premium";
    else if (score >= 2) tier = "growth";

    // clamp to sensible
    const hardMax = tier === "premium" ? 5000 : 3500;
    price = clamp(price, 450, hardMax);

    // display inside tier band but allow premium overflow
    const [softMin, softMax] = TIERS[tier].range;
    const displayed = clamp(price, softMin, tier === "premium" ? hardMax : softMax);

    const low = Math.round(displayed * 0.92);
    const high = Math.round(displayed * 1.18);

    const budgetTight = intake.budget === "under-500" || intake.budget === "500-1000";
    const note = budgetTight
      ? "If budget is tight, we can reduce scope (fewer pages/features) or apply an admin-only discount (10–25%) after review."
      : "We’ll confirm scope and lock the final quote after review.";

    return {
      tier,
      displayed,
      low,
      high,
      score,
      drivers: drivers.slice(0, 4),
      note,
    };
  }, [intake]);

  const scopeSnapshot = useMemo(() => {
    const features = [
      intake.booking ? "Booking" : null,
      intake.payments ? "Payments" : null,
      intake.blog ? "Blog/CMS" : null,
      intake.membership ? "Membership" : null,
      intake.wantsAutomation === "yes" ? "Automation" : null,
    ].filter(Boolean) as string[];

    const platformLabel =
      intake.platform === "custom" ? "Custom (Next.js)" : intake.platform === "wix" ? "Wix" : "Squarespace";

    const timelineLabel =
      intake.timeline === "rush" ? "Rush (priority)" : intake.timeline === "1w" ? "1 week" : "2–4 weeks";

    const contentLabel =
      intake.contentReady === "yes" ? "Ready" : intake.contentReady === "some" ? "Partially ready" : "Not ready";

    const exclusions = TIERS[result.tier].exclusions;

    return {
      platformLabel,
      timelineLabel,
      contentLabel,
      pages: intake.pages,
      features: features.length ? features : ["None selected"],
      exclusions,
    };
  }, [intake, result.tier]);

  function next() { setStep((s) => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  return (
    <main className="container" style={{ padding: "44px 0 86px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <h1 className="h1" style={{ marginTop: 14 }}>
        Get a quick estimate — <span className="underline">then we lock scope</span>
      </h1>

      <p className="p" style={{ maxWidth: 920, marginTop: 12 }}>
        Answer a few questions. You’ll get a recommended tier, a price range, and a Scope Snapshot preview (deliverables + exclusions).
      </p>

      <div style={{ height: 18 }} />

      {/* Stepper header */}
      <div className="stepper">
        {STEPS.map((s, i) => (
          <div key={s.key} className={`stepperItem ${i === step ? "active" : i < step ? "done" : ""}`}>
            <div className="stepperDot">{i + 1}</div>
            <div className="stepperLabel">{s.title}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 14 }} />

      <div className="estimateGrid">
        {/* LEFT: questionnaire + estimate */}
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Your estimate</h2>
            <p className="p" style={{ marginTop: 8 }}>
              Recommended: <strong style={{ color: "rgba(255,255,255,.92)" }}>{TIERS[result.tier].name}</strong>
            </p>
          </div>

          <div className="panelBody">
            <div className="bigPrice">${result.displayed.toLocaleString()}</div>
            <div className="rangeLine">
              Typical range: ${result.low.toLocaleString()} – ${result.high.toLocaleString()}
            </div>

            <div className="drivers">
              <div className="driversTitle">Top complexity drivers</div>
              <div className="driversRow">
                {result.drivers.map((d) => (
                  <span className="driverPill" key={d}>
                    <span className="driverDot" aria-hidden="true" />
                    {d}
                  </span>
                ))}
              </div>
              <div className="helpText">{result.note}</div>
            </div>

            <div className="hr" />

            {/* Questionnaire step content */}
            <div className="qWrap">
              {step === 0 && (
                <div className="qBlock">
                  <div className="qTitle">Which platform do you want?</div>
                  <div className="qSub">
                    (Not sure? Choose Custom — we can still build on Wix/Squarespace if needed.)
                  </div>

                  <div className="qGrid">
                    <button
                      className={`choice ${intake.platform === "custom" ? "choiceActive" : ""}`}
                      onClick={() => setIntake((p) => ({ ...p, platform: "custom" }))}
                      type="button"
                    >
                      <div className="choiceTitle">Custom (Next.js)</div>
                      <div className="choiceDesc">Best performance + flexibility</div>
                    </button>

                    <button
                      className={`choice ${intake.platform === "wix" ? "choiceActive" : ""}`}
                      onClick={() => setIntake((p) => ({ ...p, platform: "wix" }))}
                      type="button"
                    >
                      <div className="choiceTitle">Wix</div>
                      <div className="choiceDesc">Fast launch, easy edits</div>
                    </button>

                    <button
                      className={`choice ${intake.platform === "squarespace" ? "choiceActive" : ""}`}
                      onClick={() => setIntake((p) => ({ ...p, platform: "squarespace" }))}
                      type="button"
                    >
                      <div className="choiceTitle">Squarespace</div>
                      <div className="choiceDesc">Clean templates, quick setup</div>
                    </button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="qBlock">
                  <div className="qTitle">How many pages/sections?</div>
                  <div className="qSub">(This is one of the biggest price drivers.)</div>

                  <div className="qGrid">
                    {(["1-3", "4-6", "7-10", "10+"] as const).map((v) => (
                      <button
                        key={v}
                        className={`choice ${intake.pages === v ? "choiceActive" : ""}`}
                        onClick={() => setIntake((p) => ({ ...p, pages: v }))}
                        type="button"
                      >
                        <div className="choiceTitle">{v}</div>
                        <div className="choiceDesc">
                          {v === "1-3"
                            ? "Simple site"
                            : v === "4-6"
                            ? "Standard business site"
                            : v === "7-10"
                            ? "Bigger structure"
                            : "Large build"}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div className="fieldLabel">Design style</div>
                    <select
                      className="input"
                      value={intake.design}
                      onChange={(e) => setIntake((p) => ({ ...p, design: e.target.value as Intake["design"] }))}
                    >
                      <option value="clean">Clean / modern</option>
                      <option value="bold">Bold / high-contrast</option>
                      <option value="premium">Premium / luxury polish</option>
                    </select>
                    <div className="helpText">(Premium polish adds more design time.)</div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="qBlock">
                  <div className="qTitle">Which features do you need?</div>
                  <div className="qSub">(Pick what you actually need for launch.)</div>

                  <div className="checkGrid">
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={intake.booking}
                        onChange={(e) => setIntake((p) => ({ ...p, booking: e.target.checked }))}
                      />
                      Booking / scheduling
                    </label>

                    <label className="check">
                      <input
                        type="checkbox"
                        checked={intake.payments}
                        onChange={(e) => setIntake((p) => ({ ...p, payments: e.target.checked }))}
                      />
                      Payments
                    </label>

                    <label className="check">
                      <input
                        type="checkbox"
                        checked={intake.blog}
                        onChange={(e) => setIntake((p) => ({ ...p, blog: e.target.checked }))}
                      />
                      Blog / CMS
                    </label>

                    <label className="check">
                      <input
                        type="checkbox"
                        checked={intake.membership}
                        onChange={(e) => setIntake((p) => ({ ...p, membership: e.target.checked }))}
                      />
                      Membership
                    </label>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div className="fieldLabel">Automation / integrations?</div>
                    <select
                      className="input"
                      value={intake.wantsAutomation}
                      onChange={(e) =>
                        setIntake((p) => ({ ...p, wantsAutomation: e.target.value as Intake["wantsAutomation"] }))
                      }
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                    <div className="helpText">(Examples: Zapier, forms → CRM, email workflows.)</div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="qBlock">
                  <div className="qTitle">How ready are you?</div>
                  <div className="qSub">(Readiness affects speed + cost.)</div>

                  <div className="qGrid">
                    <button
                      className={`choice ${intake.contentReady === "yes" ? "choiceActive" : ""}`}
                      onClick={() => setIntake((p) => ({ ...p, contentReady: "yes" }))}
                      type="button"
                    >
                      <div className="choiceTitle">Content ready</div>
                      <div className="choiceDesc">Text/images are prepared</div>
                    </button>

                    <button
                      className={`choice ${intake.contentReady === "some" ? "choiceActive" : ""}`}
                      onClick={() => setIntake((p) => ({ ...p, contentReady: "some" }))}
                      type="button"
                    >
                      <div className="choiceTitle">Some content</div>
                      <div className="choiceDesc">We’ll help structure it</div>
                    </button>

                    <button
                      className={`choice ${intake.contentReady === "no" ? "choiceActive" : ""}`}
                      onClick={() => setIntake((p) => ({ ...p, contentReady: "no" }))}
                      type="button"
                    >
                      <div className="choiceTitle">Not ready</div>
                      <div className="choiceDesc">Needs content support</div>
                    </button>
                  </div>

                  <div className="twoCol" style={{ marginTop: 12 }}>
                    <div>
                      <div className="fieldLabel">Do you have a brand/logo?</div>
                      <select
                        className="input"
                        value={intake.hasBrand}
                        onChange={(e) => setIntake((p) => ({ ...p, hasBrand: e.target.value as Intake["hasBrand"] }))}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                      <div className="helpText">(If not, we’ll still make it look professional.)</div>
                    </div>

                    <div>
                      <div className="fieldLabel">Domain & hosting set up?</div>
                      <select
                        className="input"
                        value={intake.domainHosting}
                        onChange={(e) =>
                          setIntake((p) => ({ ...p, domainHosting: e.target.value as Intake["domainHosting"] }))
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                      <div className="helpText">(We can handle this if needed.)</div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="qBlock">
                  <div className="qTitle">Timeline + budget</div>
                  <div className="qSub">(Rush work costs more. Budget helps us recommend scope.)</div>

                  <div className="twoCol">
                    <div>
                      <div className="fieldLabel">Timeline</div>
                      <select
                        className="input"
                        value={intake.timeline}
                        onChange={(e) =>
                          setIntake((p) => ({ ...p, timeline: e.target.value as Intake["timeline"] }))
                        }
                      >
                        <option value="2-4w">2–4 weeks</option>
                        <option value="1w">1 week</option>
                        <option value="rush">Rush (priority)</option>
                      </select>
                      <div className="helpText">(Rush = priority scheduling.)</div>
                    </div>

                    <div>
                      <div className="fieldLabel">Budget</div>
                      <select
                        className="input"
                        value={intake.budget}
                        onChange={(e) =>
                          setIntake((p) => ({ ...p, budget: e.target.value as Intake["budget"] }))
                        }
                      >
                        <option value="under-500">Under $500</option>
                        <option value="500-1000">$500–$1,000</option>
                        <option value="1000-2000">$1,000–$2,000</option>
                        <option value="2000+">$2,000+</option>
                        <option value="3500+">$3,500+</option>
                      </select>
                      <div className="helpText">(We start at $550, but scope trade-offs help.)</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div className="fieldLabel">Competitor URL (optional)</div>
                    <input
                      className="input"
                      value={intake.competitorUrl}
                      onChange={(e) => setIntake((p) => ({ ...p, competitorUrl: e.target.value }))}
                      placeholder="https://example.com"
                    />
                    <div className="helpText">(If you have a reference site you like.)</div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div className="fieldLabel">Notes (optional)</div>
                    <textarea
                      className="input"
                      style={{ minHeight: 110, resize: "vertical" }}
                      value={intake.notes}
                      onChange={(e) => setIntake((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Anything special you want?"
                    />
                    <div className="helpText">(This helps us scope correctly.)</div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="qBlock">
                  <div className="qTitle">Where should we send your scope snapshot?</div>
                  <div className="qSub">(You’ll get the tier + range + deliverables/exclusions.)</div>

                  <div className="twoCol">
                    <div>
                      <div className="fieldLabel">Email</div>
                      <input
                        className="input"
                        value={intake.leadEmail}
                        onChange={(e) => setIntake((p) => ({ ...p, leadEmail: e.target.value }))}
                        placeholder="you@domain.com"
                      />
                      <div className="helpText">(Required to save your quote later.)</div>
                    </div>

                    <div>
                      <div className="fieldLabel">Phone (optional)</div>
                      <input
                        className="input"
                        value={intake.leadPhone}
                        onChange={(e) => setIntake((p) => ({ ...p, leadPhone: e.target.value }))}
                        placeholder="(555) 555-5555"
                      />
                      <div className="helpText">(Optional — only if you want a quick call.)</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 14 }} className="row">
                    <Link className="btn btnPrimary" href="/build">
                      Start Custom Build <span className="btnArrow">→</span>
                    </Link>
                    <Link className="btn btnGhost" href="/">
                      Back home
                    </Link>
                  </div>

                  <div className="pTiny" style={{ marginTop: 10 }}>
                    Next: we’ll connect this to Supabase so submissions are saved and PIE can generate a consultant-grade recommendation.
                  </div>
                </div>
              )}

              <div className="qNav">
                <button className="btn btnGhost" type="button" onClick={back} disabled={step === 0}>
                  Back
                </button>

                <div style={{ flex: 1 }} />

                {step < STEPS.length - 1 ? (
                  <button className="btn btnPrimary" type="button" onClick={next}>
                    Next <span className="btnArrow">→</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: tiers + scope snapshot */}
        <aside className="tierStack">
          <TierMini tierKey="essential" active={result.tier === "essential"} hot={false} />
          <TierMini tierKey="growth" active={result.tier === "growth"} hot />
          <TierMini tierKey="premium" active={result.tier === "premium"} hot={false} />

          <div className="miniInfo">
            <div className="miniInfoTitle">Scope Snapshot (preview)</div>
            <div className="miniInfoText" style={{ marginTop: 10 }}>
              <strong style={{ color: "rgba(255,255,255,.92)" }}>Platform:</strong> {scopeSnapshot.platformLabel}
              <br />
              <strong style={{ color: "rgba(255,255,255,.92)" }}>Pages:</strong> {scopeSnapshot.pages}
              <br />
              <strong style={{ color: "rgba(255,255,255,.92)" }}>Timeline:</strong> {scopeSnapshot.timelineLabel}
              <br />
              <strong style={{ color: "rgba(255,255,255,.92)" }}>Content:</strong> {scopeSnapshot.contentLabel}
            </div>

            <div className="miniInfoText" style={{ marginTop: 12 }}>
              <strong style={{ color: "rgba(255,255,255,.92)" }}>Features:</strong>
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {scopeSnapshot.features.map((f) => (
                  <span className="badge" key={f}>
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="miniInfoText" style={{ marginTop: 12 }}>
              <strong style={{ color: "rgba(255,255,255,.92)" }}>Exclusions (to prevent arguments):</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.7, color: "rgba(255,255,255,.74)" }}>
                {scopeSnapshot.exclusions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="miniInfoText" style={{ marginTop: 12 }}>
              <strong style={{ color: "rgba(255,255,255,.92)" }}>Revision policy:</strong> {TIERS[result.tier].revisionLabel}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function TierMini({
  tierKey,
  active,
  hot,
}: {
  tierKey: TierKey;
  active?: boolean;
  hot?: boolean;
}) {
  const t = TIERS[tierKey];
  return (
    <div className={`card cardHover tierMini ${active ? "tierActive" : ""}`}>
      <div className="cardInner">
        <div className="tierMiniHead">
          <div>
            <div className="tierName">{t.name}</div>
            <div className="tierSub">{t.label}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="tierPrice">{t.publicRange}</div>
            <div className={`badge ${hot ? "badgeHot" : ""}`} style={{ marginTop: 10 }}>
              {active ? "Your match" : hot ? "Most chosen" : "Tier"}
            </div>
          </div>
        </div>

        <ul className="tierList" style={{ marginTop: 10 }}>
          {t.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}