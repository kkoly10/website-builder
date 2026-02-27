"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type QuizGoal = "more-leads" | "bookings" | "sell-online" | "show-work";
type QuizTimeline = "fast" | "standard" | "flexible";
type QuizPages = "1" | "1-3" | "4-5" | "6-8" | "9+";

type QuizState = {
  goal: QuizGoal;
  pages: QuizPages;
  timeline: QuizTimeline;
};

function recommendationFromQuiz(quiz: QuizState) {
  if (quiz.goal === "sell-online") {
    return {
      intent: "Selling",
      websiteType: "Ecommerce",
      headline: "Ecommerce Conversion Stack",
      bullets: ["Product-ready architecture", "Secure checkout setup", "Conversion-focused product pages"],
    };
  }

  if (quiz.goal === "bookings") {
    return {
      intent: "Booking",
      websiteType: "Business",
      headline: "Booking-First Service Site",
      bullets: ["High-clarity service pages", "Booking funnel integration", "Follow-up automation options"],
    };
  }

  if (quiz.goal === "show-work") {
    return {
      intent: "Content",
      websiteType: "Portfolio",
      headline: "Portfolio + Authority Site",
      bullets: ["Visual case-study structure", "SEO-friendly content blocks", "Lead capture across portfolio pages"],
    };
  }

  return {
    intent: "Leads",
    websiteType: "Business",
    headline: "Lead Generation Website",
    bullets: ["Clear service positioning", "Lead-capture forms & CTAs", "Fast, mobile-first performance"],
  };
}

export default function BuildIntroPage() {
  const [quiz, setQuiz] = useState<QuizState>({
    goal: "more-leads",
    pages: "1-3",
    timeline: "standard",
  });

  const recommendation = useMemo(() => recommendationFromQuiz(quiz), [quiz]);

  const intakeHref = useMemo(() => {
    const params = new URLSearchParams({
      mode: "guided",
      intent: recommendation.intent,
      websiteType: recommendation.websiteType,
      pages: quiz.pages,
      timeline: quiz.timeline === "fast" ? "Under 14 days" : quiz.timeline === "standard" ? "2-3 weeks" : "4+ weeks",
    });

    return `/build?${params.toString()}`;
  }, [quiz.pages, quiz.timeline, recommendation.intent, recommendation.websiteType]);

  return (
    <main className="container" style={{ maxWidth: 860, padding: "64px 0 96px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Website Planning Portal
      </div>

      <h1 className="h1" style={{ marginTop: 16 }}>Find your best website setup in under 60 seconds.</h1>
      <p className="p" style={{ marginTop: 12 }}>
        Answer a few quick questions and we&apos;ll guide you to the right build plan before you enter the full estimate flow.
      </p>

      <section className="panel" style={{ marginTop: 28 }}>
        <div className="panelHeader">
          <h2 className="h2" style={{ fontSize: 24 }}>Quick Qualification</h2>
          <p className="pDark" style={{ marginTop: 8 }}>This helps us recommend the right website type, scope, and timeline.</p>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 16 }}>
          <div>
            <div className="fieldLabel">What is your primary goal?</div>
            <select className="select" value={quiz.goal} onChange={(e) => setQuiz((q) => ({ ...q, goal: e.target.value as QuizGoal }))}>
              <option value="more-leads">Get more qualified leads</option>
              <option value="bookings">Book appointments automatically</option>
              <option value="sell-online">Sell services/products online</option>
              <option value="show-work">Showcase work and build credibility</option>
            </select>
          </div>

          <div className="grid2">
            <div>
              <div className="fieldLabel">How many pages do you expect?</div>
              <select className="select" value={quiz.pages} onChange={(e) => setQuiz((q) => ({ ...q, pages: e.target.value as QuizPages }))}>
                <option value="1">1 (single-page)</option>
                <option value="1-3">1-3</option>
                <option value="4-5">4-5</option>
                <option value="6-8">6-8</option>
                <option value="9+">9+</option>
              </select>
            </div>

            <div>
              <div className="fieldLabel">How fast do you want to launch?</div>
              <select className="select" value={quiz.timeline} onChange={(e) => setQuiz((q) => ({ ...q, timeline: e.target.value as QuizTimeline }))}>
                <option value="fast">ASAP (under 14 days)</option>
                <option value="standard">Standard (2-3 weeks)</option>
                <option value="flexible">Flexible (4+ weeks)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panelHeader">
          <h2 className="h2" style={{ fontSize: 24 }}>Recommended Direction</h2>
        </div>
        <div className="panelBody">
          <p className="p" style={{ marginBottom: 10 }}><strong style={{ color: "var(--fg)" }}>{recommendation.headline}</strong></p>
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.8 }}>
            {recommendation.bullets.map((bullet) => (<li key={bullet}>{bullet}</li>))}
          </ul>

          <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
            <Link href={intakeHref} className="btn btnPrimary">
              Continue to Full Estimate <span className="btnArrow">→</span>
            </Link>
            <Link href="/systems" className="btn btnGhost">I need workflow systems instead</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
