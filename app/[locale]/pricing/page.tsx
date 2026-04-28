import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import ScrollReveal from "@/components/site/ScrollReveal";
import styles from "../marketing.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

const TIER_KEYS = ["starter", "growth", "premium"] as const;
const OTHER_KEYS = [
  { id: "ecommerce", anchor: "ecommerce" },
  { id: "systems", anchor: "systems" },
] as const;

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PricingContent />;
}

function PricingContent() {
  const t = useTranslations("pricing");

  const tiers = TIER_KEYS.map((key) => ({
    key,
    label: t(`${key}.label`),
    value: t(`${key}.value`),
    detail: t(`${key}.detail`),
    meta: t(`${key}.meta`),
  }));

  return (
    <main className={styles.page}>
      <ScrollReveal />

      <section className={`${styles.hero} heroFadeUp`}>
        <div className="container">
          <div className={styles.heroInner}>
            <p className={styles.label}>{t("label")}</p>
            <h1 className={styles.title}>{t("title")}</h1>
            <p className={styles.intro}>{t("intro")}</p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.pricingWrap}`}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{t("tiersLabel")}</p>
            <h2 className={styles.sectionTitle}>{t("tiersTitle")}</h2>
          </div>

          <div className={styles.pricingGrid}>
            {tiers.map((tier) => (
              <article key={tier.key} className={styles.pricingCard}>
                <p className={styles.cardKicker}>{tier.label}</p>
                <p className={styles.pricingValue}>{tier.value}</p>
                <p>{tier.detail}</p>
                <div className={styles.pricingMeta}>{tier.meta}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{t("otherLabel")}</p>
            <h2 className={styles.sectionTitle}>{t("otherTitle")}</h2>
          </div>

          <div className={styles.gridTwo}>
            {OTHER_KEYS.map((item) => (
              <article
                id={item.anchor}
                key={item.id}
                className={styles.card}
                style={{ scrollMarginTop: 96 }}
              >
                <p className={styles.cardKicker}>{t("otherKicker")}</p>
                <h3>{t(`${item.id}.title`)}</h3>
                <p>{t(`${item.id}.body`)}</p>
              </article>
            ))}
          </div>

          <div className={styles.ctaRow}>
            <Link href="/build/intro" className="btn btnPrimary">
              {t("ctaPrimary")}
            </Link>
            <Link href="/process" className="btn btnGhost">
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
