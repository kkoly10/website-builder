import { useTranslations } from "next-intl";

/**
 * The dark product panel that fills the right half of the hero.
 *
 * It renders the client workspace — the studio's actual differentiator, and
 * the thing the page already talks about further down ("Your project lives in
 * a workspace"). Every string here comes from the existing `home.diff.*`
 * namespace, so it is already translated into all three locales and there are
 * no invented metrics: no "100+ projects", no fabricated star rating. The
 * journey states match the JOURNEY_KEYS the page renders below.
 *
 * aria-hidden on the decorative chrome only; the panel itself is labelled so a
 * screen reader gets "Workspace preview" rather than a wall of status text.
 */
export default function HeroPanel() {
  const t = useTranslations("home");

  const steps = [
    { key: "content", state: "done" },
    { key: "build", state: "done" },
    { key: "review", state: "active" },
    { key: "launch", state: "pending" },
  ] as const;

  return (
    <figure className="heroPanel" aria-label={t("diff.kicker")}>
      <div className="heroPanelBar">
        <span className="heroPanelDots" aria-hidden />
        <span className="heroPanelUrl">{t("diff.url")}</span>
      </div>

      <div className="heroPanelBody">
        <div className="heroPanelHead">
          <div>
            <p className="heroPanelEyebrow">{t("diff.eyebrow")}</p>
            <p className="heroPanelTitle">{t("diff.currentMilestoneValue")}</p>
          </div>
          {/* Status is never colour-only — the dot is paired with its label. */}
          <span className="heroPanelBadge">
            <span className="heroPanelBadgeDot" aria-hidden />
            {t("diff.launchTargetValue")}
          </span>
        </div>

        <ol className="heroPanelSteps">
          {steps.map((s) => (
            <li key={s.key} className={`heroPanelStep is-${s.state}`}>
              <span className="heroPanelStepMark" aria-hidden />
              <span className="heroPanelStepName">{t(`diff.journey.${s.key}`)}</span>
              {/* Only the active step is labelled. A completed step is carried
                  by its filled mark plus the visually-hidden state below —
                  the first pass reused the deposit string here and rendered
                  "Paid" against Content and Build, which is simply untrue. */}
              <span className="heroPanelStepState">
                {s.state === "active" ? t("diff.currentMilestone") : null}
              </span>
              <span className="srOnly">
                {s.state === "done"
                  ? t("diff.launchTargetValue")
                  : s.state === "active"
                    ? t("diff.currentMilestone")
                    : t("diff.launchTarget")}
              </span>
            </li>
          ))}
        </ol>

        <div className="heroPanelFoot">
          <span className="heroPanelFootKey">{t("diff.currentMilestone")}</span>
          <span className="heroPanelFootVal">{t("diff.currentMilestoneMeta")}</span>
        </div>
      </div>
    </figure>
  );
}
