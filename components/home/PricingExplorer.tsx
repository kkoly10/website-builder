"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./pricing-explorer.module.css";

const TIER_KEYS = ["starter", "growth", "premium"] as const;
type TierKey = (typeof TIER_KEYS)[number];

export default function PricingExplorer() {
  const t = useTranslations("pricingExplorer");
  const [selected, setSelected] = useState<TierKey>("growth");

  const tiers = TIER_KEYS.map((key) => ({
    key,
    title: t(`${key}.title`),
    price: t(`${key}.price`),
    body: t(`${key}.body`),
  }));
  const active = tiers.find((tier) => tier.key === selected) ?? tiers[1];

  return (
    <div className={styles.wrap}>
      <div className={styles.segmented} role="tablist" aria-label={t("ariaLabel")}>
        {tiers.map((tier) => (
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
