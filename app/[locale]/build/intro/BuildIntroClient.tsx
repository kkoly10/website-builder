"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics/client";
import ScrollReveal from "@/components/site/ScrollReveal";

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

const GOAL_KEYS: QuizGoal[] = ["more-leads", "bookings", "sell-online", "show-work"];
const PAGE_KEYS: QuizPages[] = ["1", "1-3", "4-5", "6-8", "9+"];
const TIMELINE_KEYS: QuizTimeline[] = ["fast", "standard", "flexible"];
const CONTENT_KEYS: QuizContent[] = ["ready", "some", "not-ready"];
const BUDGET_KEYS: QuizBudget[] = ["under-2k", "2k-5k", "5k-10k", "10k-plus", "not-sure"];

// Maps quiz goal to a recommendation key in the dictionary. The recommendation
// also drives the URL params handed to the full estimate flow, so the
// machine-facing "intent" / "websiteType" stay English regardless of locale.
type RecommendationKey = "ecommerce" | "booking" | "portfolio" | "leads";

const RECOMMENDATION_FROM_GOAL: Record<QuizGoal, {
  key: RecommendationKey;
  intent: string;
  websiteType: string;
}> = {
  "sell-online": { key: "ecommerce", intent: "Selling", websiteType: "Ecommerce" },
  "bookings": { key: "booking", intent: "Booking", websiteType: "Business" },
  "show-work": { key: "portfolio", intent: "Content", websiteType: "Portfolio" },
  "more-leads": { key: "leads", intent: "Leads", websiteType: "Business" },
};

export default function BuildIntroClient() {
  const t = useTranslations("buildIntro");

  const [quiz, setQuiz] = useState<QuizState>({
    goal: "more-leads",
    pages: "1-3",
    timeline: "standard",
    contentReady: "some",
    budget: "not-sure",
  });

  const rec = useMemo(() => RECOMMENDATION_FROM_GOAL[quiz.goal], [quiz.goal]);

  const intakeHref = useMemo(() => {
    // The full estimate flow expects English machine values for these params.
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
      <ScrollReveal />

      {/* Hero */}
      <div className="portalStory heroFadeUp" style={{ paddingBottom: 28 }}>
        <div className="portalStoryKicker">
          <span className="portalStoryKickerDot" />
          {t("kicker")}
        </div>
        <h1 className="portalStoryHeadline" style={{ fontSize: "clamp(28px, 5vw, 40px)" }}>
          {t.rich("title", { em: (chunks) => <em>{chunks}</em> })}
        </h1>
        <p className="portalStoryBody">{t("subtitle")}</p>
      </div>

      {/* Goal */}
      <div className="portalPanel fadeUp" style={{ marginBottom: 14 }}>
        <div className="portalPanelHeader">
          <h2 className="portalPanelTitle">{t("goalQuestion")}</h2>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {GOAL_KEYS.map((g) => {
            const active = quiz.goal === g;
            return (
              <button key={g} type="button" onClick={() => setQuiz((q) => ({ ...q, goal: g }))}
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
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>{t(`goals.${g}.label`)}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{t(`goals.${g}.desc`)}</div>
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
            <h2 className="portalPanelTitle">{t("pagesQuestion")}</h2>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PAGE_KEYS.map((p) => {
              const active = quiz.pages === p;
              return (
                <button key={p} type="button" onClick={() => setQuiz((q) => ({ ...q, pages: p }))}
                  style={{
                    padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                    background: active ? "rgba(201,168,76,0.08)" : "transparent",
                    color: active ? "var(--accent)" : "var(--muted)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                  {t(`pages.${p}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{t("timelineQuestion")}</h2>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {TIMELINE_KEYS.map((tl) => {
              const active = quiz.timeline === tl;
              return (
                <button key={tl} type="button" onClick={() => setQuiz((q) => ({ ...q, timeline: tl }))}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                    border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                    background: active ? "rgba(201,168,76,0.06)" : "transparent",
                    transition: "all 0.15s",
                  }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: active ? "var(--accent)" : "var(--fg)" }}>{t(`timelines.${tl}.label`)}</span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{t(`timelines.${tl}.desc`)}</span>
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
            <h2 className="portalPanelTitle">{t("contentQuestion")}</h2>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {CONTENT_KEYS.map((c) => {
              const active = quiz.contentReady === c;
              return (
                <button key={c} type="button" onClick={() => setQuiz((q) => ({ ...q, contentReady: c }))}
                  style={{
                    padding: "10px 14px", borderRadius: 10, fontSize: 13, textAlign: "left",
                    border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                    background: active ? "rgba(201,168,76,0.06)" : "transparent",
                    color: active ? "var(--fg)" : "var(--muted)",
                    fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                  }}>
                  {t(`content.${c}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{t("budgetQuestion")}</h2>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {BUDGET_KEYS.map((b) => {
              const active = quiz.budget === b;
              return (
                <button key={b} type="button" onClick={() => setQuiz((q) => ({ ...q, budget: b }))}
                  style={{
                    padding: "10px 14px", borderRadius: 10, fontSize: 13, textAlign: "left",
                    border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                    background: active ? "rgba(201,168,76,0.06)" : "transparent",
                    color: active ? "var(--fg)" : "var(--muted)",
                    fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                  }}>
                  {t(`budgets.${b}`)}
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
          <h2 className="portalPanelTitle">{t("recommendationLabel")}</h2>
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
            {t(`recommendations.${rec.key}.headline`)}
          </div>
          <div style={{
            fontSize: 14, color: "var(--muted)", marginTop: 6, lineHeight: 1.55,
          }}>
            {t(`recommendations.${rec.key}.desc`)}
          </div>
        </div>

        {quiz.budget !== "not-sure" && (
          <div style={{
            fontSize: 13, color: "var(--muted)", marginBottom: 16,
            padding: "10px 14px", borderRadius: 10,
            border: "1px solid var(--stroke)", background: "var(--panel2)",
          }}>
            {t("budgetNotedPrefix")} <strong style={{ color: "var(--fg)" }}>
              {t(`budgets.${quiz.budget}`)}
            </strong> {t("budgetNotedSuffix")}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={intakeHref} className="btn btnPrimary btnLg"
            onClick={() => trackEvent({
              event: "cta_build_intro_continue",
              metadata: { goal: quiz.goal, pages: quiz.pages, timeline: quiz.timeline, contentReady: quiz.contentReady, budget: quiz.budget },
            })}>
            {t("continueCta")} <span className="btnArrow">→</span>
          </Link>
          <Link href="/systems" className="btn btnGhost">
            {t("altSystemsCta")}
          </Link>
          <Link href="/ecommerce/intake" className="btn btnGhost">
            {t("altEcomCta")}
          </Link>
        </div>
      </div>
    </main>
  );
}
