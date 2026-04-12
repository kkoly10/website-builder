"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./problem-switcher.module.css";

type Problem = {
  key: string;
  prompt: string;
  impact: string;
  cta: { label: string; href: string };
  learn: { label: string; href: string };
};

const PROBLEMS: Problem[] = [
  {
    key: "website",
    prompt: "My website makes my business look smaller than it is.",
    impact: "Most clients judge trust in seconds. We redesign your first impression to convert more qualified leads.",
    cta: { label: "Start website estimate", href: "/build/intro" },
    learn: { label: "Explore websites", href: "/websites" },
  },
  {
    key: "ops",
    prompt: "My team is stuck in repetitive manual handoffs.",
    impact: "We map bottlenecks, automate routing, and create cleaner operational systems that save hours each week.",
    cta: { label: "Start workflow audit", href: "/ops-intake" },
    learn: { label: "Explore systems", href: "/systems" },
  },
  {
    key: "ecom",
    prompt: "Our checkout and store flow are leaking revenue.",
    impact: "We diagnose conversion friction and fix the purchase journey from product pages to fulfillment.",
    cta: { label: "Start e-commerce intake", href: "/ecommerce/intake" },
    learn: { label: "Explore e-commerce", href: "/ecommerce" },
  },
];

export default function ProblemSwitcher() {
  const [activeKey, setActiveKey] = useState<string>("website");
  const active = PROBLEMS.find((item) => item.key === activeKey) ?? PROBLEMS[0];

  return (
    <section className={styles.switcher} aria-label="Problem selector">
      <div className={styles.tabs} role="tablist" aria-label="Select your biggest bottleneck">
        {PROBLEMS.map((item) => (
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
