"use client";

import { useMemo, useState } from "react";
import styles from "./workspace-story.module.css";

const STEPS = [
  {
    id: 1,
    label: "Intake",
    detail: "You submit scope details and priorities. We translate that into a clear execution path.",
  },
  {
    id: 2,
    label: "Estimate",
    detail: "You receive a scoped range with timeline, deliverables, and recommendation within 24 hours.",
  },
  {
    id: 3,
    label: "Workspace",
    detail: "Track progress, upload assets, approve milestones, and keep every decision in one place.",
  },
  {
    id: 4,
    label: "Launch",
    detail: "Final QA, handoff, and go-live support so the finished system performs from day one.",
  },
];

export default function WorkspaceStory() {
  const [activeId, setActiveId] = useState(3);
  const active = useMemo(() => STEPS.find((step) => step.id === activeId) ?? STEPS[0], [activeId]);

  return (
    <div className={styles.story}>
      <div className={styles.track}>
        {STEPS.map((step) => (
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
        <p className={styles.kicker}>Active milestone</p>
        <h3>{active.label}</h3>
        <p>{active.detail}</p>
      </article>
    </div>
  );
}
