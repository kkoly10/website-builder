"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics/client";

type QuizGoal = "more-leads" | "bookings" | "sell-online" | "show-work";
type QuizTimeline = "fast" | "standard" | "flexible";
type QuizPages = "1" | "1-3" | "4-5" | "6-8" | "9+";
type QuizContent = "ready" | "some" | "not-ready";
type QuizBudget = "under-2k" | "2k-5k" | "5k-10k" | "10k-plus" | "not-sure";

type QuizState = {
  goal: QuizGoal;
  pages: QuizPages;
  timeline: QuizTimeline;
  contentReady: QuizContent;
  budget: QuizBudget;
};

const GOALS: { value: QuizGoal; label: string; desc: string }[] = [
  { value: "more-leads", label: "Get more leads", desc: "More calls, form fills, and inquiries from your website" },
  { value: "bookings", label: "Book appointments", desc: "Let customers schedule directly from your site" },
  { value: "sell-online", label: "Sell online", desc: "Products or services with checkout and payments" },
  { value: "show-work", label: "Showcase work", desc: "Portfolio, case studies, and credibility building" },
];

const PAGE_OPTIONS: { value: QuizPages; label: string }[] = [
  { value: "1", label: "1 page" },
  { value: "1-3", label: "1–3 pages" },
  { value: "4-5", label: "4–5 pages" },
  { value: "6-8", label: "6–8 pages" },
  { value: "9+", label: "9+ pages" },
];

const TIMELINE_OPTIONS: { value: QuizTimeline; label: string; desc: string }[] = [
  { value: "fast", label: "ASAP", desc: "Under 14 days" },
  { value: "standard", label: "Standard", desc: "2–3 weeks" },
  { value: "flexible", label: "Flexible", desc: "4+ weeks" },
];

const CONTENT_OPTIONS: { value: QuizContent; label: string }[] = [
  { value: "ready", label: "Yes — copy and images are ready" },
  { value: "some", label: "Partially — I have some" },
  { value: "not-ready", label: "No — I'll need help" },
];

const BUDGET_OPTIONS: { value: QuizBudget; label: string }[] = [
  { value: "under-2k", label: "Under $2,000" },
  { value: "2k-5k", label: "$2,000 – $5,000" },
  { value: "5k-10k", label: "$5,000 – $10,000" },
  { value: "10k-plus", label: "$10,000+" },
  { value: "not-sure", label: "Not sure yet" },
];

function recommendationFromQuiz(quiz: QuizState) {
  if (quiz.goal === "sell-online") {
    return { intent: "Selling", websiteType: "Ecommerce", headline: "E-commerce conversion site", desc: "Product-ready architecture with secure checkout, conversion-focused product pages, and post-purchase flow." };
  }
  if (quiz.goal === "bookings") {
    return { intent: "Booking", websiteType: "Business", headline: "Booking-first service site", desc: "High-clarity service pages with integrated scheduling, follow-up automation, and mobile-optimized booking flow." };
  }
  if (quiz.goal === "show-work") {
    return { intent: "Content", websiteType: "Portfolio", headline: "Portfolio + authority site", desc: "Visual case study structure, SEO-friendly content blocks, and lead capture woven throughout your portfolio." };
  }
  return { intent: "Leads", websiteType: "Business", headline: "Lead generation website", desc: "Clear service positioning, strong CTAs, lead-capture forms, and fast mobile-first performance." };
}

export default function BuildIntroPage() {
  const [quiz, setQuiz] = useState<QuizState>({
    goal: "more-leads",
    pages: "1-3",
    timeline: "standard",
    contentReady: "some",
    budget: "not-sure",
  });

  const rec = useMemo(() => recommendationFromQuiz(quiz), [quiz]);

  const intakeHref = useMemo(() => {
    const contentMap: Record<QuizContent, string> = { ready: "Ready", some: "Some", "not-ready": "Not ready" };
    const params = new URLSearchParams({
      mode: "guided",
      intent: rec.intent,
      websiteType: rec.websiteType,
      pages: quiz.pages,
      timeline: quiz.timeline === "fast" ? "Under 14 days" : quiz.timeline === "standard" ? "2-3 weeks" : "4+ weeks",
      contentReady: contentMap[quiz.contentReady],
    });
    return `/build?${params.toString()}`;
  }, [quiz, rec]);

  return (
    <main className="container" style={{ maxWidth: 780, padding: "48px 0 80px" }}>

      {/* Hero */}
      <div className="portalStory heroFadeUp" style={{ paddingBottom: 28 }}>
        <div className="portalStoryKicker">
          <span className="portalStoryKickerDot" />
          Website estimate
        </div>
        <h1 className="portalStoryHeadline" style={{ fontSize: "clamp(28px, 5vw, 40px)" }}>
          Find the right website setup <em>in under 60 seconds</em>
        </h1>
        <p className="portalStoryBody">
          Answer five quick questions. We&apos;ll recommend the right type of
          build and send you straight into the full estimate flow.
        </p>
      </div>

      {/* Goal */}
      <div className="portalPanel fadeUp" style={{ marginBottom: 14 }}>
        <div className="portalPanelHeader">
          <h2 className="portalPanelTitle">What&apos;s the primary goal?</h2>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {GOALS.map((g) => {
            const active = quiz.goal === g.value;
            return (
              <button key={g.value} type="button" onClick={() => setQuiz((q) => ({ ...q, goal: g.value }))}
                style={{
                  display: "grid", gridTemplateColumns: "14px 1fr", gap: 14, alignItems: "center",
                  padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                  border: `1px solid ${active ? "rgba(201,168,76,0.3)" : "var(--stroke)"}`,
                  background: active ? "rgba(201,168,76,0.06)" : "transparent",
                  transition: "all 0.15s",
                }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: `2px solid ${active ? "#c9a84c" : "var(--stroke)"}`,
                  background: active ? "#c9a84c" : "transparent",
                  transition: "all 0.15s",
                }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>{g.label}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{g.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pages + Timeline */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">How many pages?</h2>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PAGE_OPTIONS.map((p) => {
              const active = quiz.pages === p.value;
              return (
                <button key={p.value} type="button" onClick={() => setQuiz((q) => ({ ...q, pages: p.value }))}
                  style={{
                    padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                    background: active ? "rgba(201,168,76,0.08)" : "transparent",
                    color: active ? "var(--accent)" : "var(--muted)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Timeline?</h2>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {TIMELINE_OPTIONS.map((t) => {
              const active = quiz.timeline === t.value;
              return (
                <button key={t.value} type="button" onClick={() => setQuiz((q) => ({ ...q, timeline: t.value }))}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                    border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                    background: active ? "rgba(201,168,76,0.06)" : "transparent",
                    transition: "all 0.15s",
                  }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: active ? "var(--accent)" : "var(--fg)" }}>{t.label}</span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content + Budget */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Content ready?</h2>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {CONTENT_OPTIONS.map((c) => {
              const active = quiz.contentReady === c.value;
              return (
                <button key={c.value} type="button" onClick={() => setQuiz((q) => ({ ...q, contentReady: c.value }))}
                  style={{
                    padding: "10px 14px", borderRadius: 10, fontSize: 13, textAlign: "left",
                    border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                    background: active ? "rgba(201,168,76,0.06)" : "transparent",
                    color: active ? "var(--fg)" : "var(--muted)",
                    fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                  }}>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Budget in mind?</h2>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {BUDGET_OPTIONS.map((b) => {
              const active = quiz.budget === b.value;
              return (
                <button key={b.value} type="button" onClick={() => setQuiz((q) => ({ ...q, budget: b.value }))}
                  style={{
                    padding: "10px 14px", borderRadius: 10, fontSize: 13, textAlign: "left",
                    border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                    background: active ? "rgba(201,168,76,0.06)" : "transparent",
                    color: active ? "var(--fg)" : "var(--muted)",
                    fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                  }}>
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="portalPanel fadeUp" style={{
        borderColor: "rgba(201,168,76,0.2)",
        background: "radial-gradient(600px 200px at 30% 20%, rgba(201,168,76,0.04), transparent 50%), var(--panel)",
      }}>
        <div className="portalPanelHeader">
          <h2 className="portalPanelTitle">Our recommendation</h2>
        </div>

        <div style={{
          padding: "16px 18px", borderRadius: 12,
          border: "1px solid rgba(201,168,76,0.15)",
          background: "rgba(201,168,76,0.04)",
          marginBottom: 16,
        }}>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22, fontWeight: 500, color: "var(--fg)",
            letterSpacing: "-0.02em",
          }}>
            {rec.headline}
          </div>
          <div style={{
            fontSize: 14, color: "var(--muted)", marginTop: 6, lineHeight: 1.55,
          }}>
            {rec.desc}
          </div>
        </div>

        {quiz.budget !== "not-sure" && (
          <div style={{
            fontSize: 13, color: "var(--muted)", marginBottom: 16,
            padding: "10px 14px", borderRadius: 10,
            border: "1px solid var(--stroke)", background: "var(--panel2)",
          }}>
            Budget noted: <strong style={{ color: "var(--fg)" }}>
              {BUDGET_OPTIONS.find((b) => b.value === quiz.budget)?.label}
            </strong> — we&apos;ll factor this into your estimate.
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={intakeHref} className="btn btnPrimary btnLg"
            onClick={() => trackEvent({
              event: "cta_build_intro_continue",
              metadata: { goal: quiz.goal, pages: quiz.pages, timeline: quiz.timeline, contentReady: quiz.contentReady, budget: quiz.budget },
            })}>
            Continue to full estimate <span className="btnArrow">→</span>
          </Link>
          <Link href="/systems" className="btn btnGhost">
            I need workflow automation instead
          </Link>
          <Link href="/ecommerce/intake" className="btn btnGhost">
            I need e-commerce help instead
          </Link>
        </div>
      </div>
    </main>
  );
}
