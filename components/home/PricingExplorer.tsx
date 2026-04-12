"use client";

import { useState } from "react";
import styles from "./pricing-explorer.module.css";

type Tier = {
  key: string;
  title: string;
  price: string;
  body: string;
};

const TIERS: Tier[] = [
  {
    key: "starter",
    title: "Starter Site",
    price: "$1,500–$2,200",
    body: "For businesses needing a high-trust first impression quickly with focused conversion flow.",
  },
  {
    key: "growth",
    title: "Growth Site",
    price: "$2,300–$3,400",
    body: "Adds deeper structure, integrations, and message clarity for scaling lead quality and volume.",
  },
  {
    key: "premium",
    title: "Premium Build",
    price: "$3,500–$5,200+",
    body: "Complex scope with custom interactions, advanced integrations, and multi-page strategic architecture.",
  },
];

export default function PricingExplorer() {
  const [selected, setSelected] = useState("growth");
  const active = TIERS.find((item) => item.key === selected) ?? TIERS[1];

  return (
    <div className={styles.wrap}>
      <div className={styles.segmented} role="tablist" aria-label="Website pricing tiers">
        {TIERS.map((tier) => (
          <button
            key={tier.key}
            type="button"
            role="tab"
            aria-selected={active.key === tier.key}
            onClick={() => setSelected(tier.key)}
            className={active.key === tier.key ? styles.optionActive : styles.option}
          >
            {tier.title}
          </button>
        ))}
      </div>

      <div className={styles.card} role="tabpanel" aria-live="polite">
        <p className={styles.price}>{active.price}</p>
        <p className={styles.body}>{active.body}</p>
      </div>
    </div>
  );
}
