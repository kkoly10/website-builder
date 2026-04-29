"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./problem-switcher.module.css";

const KEYS = ["website", "ops", "ecom"] as const;
type ProblemKey = (typeof KEYS)[number];

const HREFS: Record<ProblemKey, { cta: string; learn: string }> = {
  website: { cta: "/build/intro", learn: "/websites" },
  ops: { cta: "/ops-intake", learn: "/systems" },
  ecom: { cta: "/ecommerce/intake", learn: "/ecommerce" },
};

export default function ProblemSwitcher() {
  const t = useTranslations("problemSwitcher");
  const [activeKey, setActiveKey] = useState<ProblemKey>("website");

  const problems = KEYS.map((key) => ({
    key,
    prompt: t(`${key}.prompt`),
    impact: t(`${key}.impact`),
    cta: { label: t(`${key}.ctaLabel`), href: HREFS[key].cta },
    learn: { label: t(`${key}.learnLabel`), href: HREFS[key].learn },
  }));
  const active = problems.find((p) => p.key === activeKey) ?? problems[0];

  return (
    <section className={styles.switcher} aria-label={t("ariaLabel")}>
      <div className={styles.tabs} role="tablist" aria-label={t("tabsLabel")}>
        {problems.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active.key === item.key}
            className={active.key === item.key ? styles.tabActive : styles.tab}
            onClick={() => setActiveKey(item.key)}
          >
            {item.prompt}
          </button>
        ))}
      </div>

      <div className={styles.panel} role="tabpanel" aria-live="polite">
        <p className={styles.impact}>{active.impact}</p>
        <div className={styles.actions}>
          <Link href={active.cta.href} className="btn btnPrimary">
            {active.cta.label} <span className="btnArrow">→</span>
          </Link>
          <Link href={active.learn.href} className="btn btnGhost">
            {active.learn.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
