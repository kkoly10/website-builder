"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./workspace-story.module.css";

const STEP_IDS = [1, 2, 3, 4] as const;

export default function WorkspaceStory() {
  const t = useTranslations("workspaceStory");
  const [activeId, setActiveId] = useState<number>(3);

  const steps = STEP_IDS.map((id) => ({
    id,
    label: t(`step${id}.label`),
    detail: t(`step${id}.detail`),
  }));
  const active = useMemo(() => steps.find((s) => s.id === activeId) ?? steps[0], [activeId, steps]);

  return (
    <div className={styles.story}>
      <div className={styles.track}>
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            className={active.id === step.id ? styles.stepActive : styles.step}
            onClick={() => setActiveId(step.id)}
            aria-pressed={active.id === step.id}
          >
            <span className={styles.index}>{step.id}</span>
            <span>{step.label}</span>
          </button>
        ))}
      </div>

      <article className={styles.detail}>
        <p className={styles.kicker}>{t("kicker")}</p>
        <h3>{active.label}</h3>
        <p>{active.detail}</p>
      </article>
    </div>
  );
}
