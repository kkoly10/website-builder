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

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PricingContent />;
}

const FEATURED = {
  websites:   "growth",
  webApps:    "standard",
  automation: "opsSystem",
  ecommerce:  "run",
  rescue:     "sprint",
  care:       "carePlus",
} as const;

function PricingContent() {
  const t = useTranslations("pricing");

  return (
    <main className={styles.page}>
      <ScrollReveal />

      {/* Hero */}
      <section className={`${styles.hero} heroFadeUp`}>
        <div className="container">
          <div className={styles.heroInner}>
            <p className={styles.label}>{t("label")}</p>
            <h1 className={styles.title}>{t("title")}</h1>
            <p className={styles.intro}>{t("intro")}</p>
          </div>
        </div>
      </section>

      {/* Anchor nav */}
      <nav className={styles.pricingNav} aria-label={t("nav.aria")}>
        <div className="container">
          <div className={styles.pricingNavInner}>
            <a href="#websites" className={styles.pricingNavLink}>
              {t("nav.websites")}
            </a>
            <a href="#web-apps" className={styles.pricingNavLink}>
              {t("nav.webApps")}
            </a>
            <a href="#automation" className={styles.pricingNavLink}>
              {t("nav.automation")}
            </a>
            <a href="#ecommerce" className={styles.pricingNavLink}>
              {t("nav.ecommerce")}
            </a>
            <a href="#rescue" className={styles.pricingNavLink}>
              {t("nav.rescue")}
            </a>
            <a href="#care" className={styles.pricingNavLink}>
              {t("nav.care")}
            </a>
          </div>
        </div>
      </nav>

      {/* Websites */}
      <section
        id="websites"
        className={`${styles.section} ${styles.pricingWrap}`}
        style={{ scrollMarginTop: "132px" }}
      >
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>
              {t("websitesSection.sectionLabel")}
            </p>
            <h2 className={styles.sectionTitle}>
              {t("websitesSection.sectionTitle")}
            </h2>
          </div>

          <div className={styles.pricingGrid}>
            {(["starter", "growth", "premium"] as const).map((key) => {
              const featured = key === FEATURED.websites;
              return (
                <article key={key} className={`${styles.pricingCard}${featured ? ` ${styles.pricingCardFeatured}` : ""}`}>
                  {featured && <span className={styles.pricingCardBadge}>{t("mostPopular")}</span>}
                  <p className={styles.cardKicker}>{t(`websitesSection.${key}.label`)}</p>
                  <p className={styles.pricingValue}>{t(`websitesSection.${key}.value`)}</p>
                  <p>{t(`websitesSection.${key}.detail`)}</p>
                  <div className={styles.pricingMeta}>{t(`websitesSection.${key}.meta`)}</div>
                </article>
              );
            })}
          </div>

          <div className={styles.ctaRow}>
            <Link
              href="/build/intro?projectType=website"
              className="btn btnPrimary"
            >
              {t("websitesSection.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Web Apps */}
      <section
        id="web-apps"
        className={styles.section}
        style={{ scrollMarginTop: "132px" }}
      >
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>
              {t("webAppsSection.sectionLabel")}
            </p>
            <h2 className={styles.sectionTitle}>
              {t("webAppsSection.sectionTitle")}
            </h2>
          </div>

          <p className={styles.sectionNote}>{t("webAppsSection.note")}</p>

          <div className={styles.gridTwo}>
            {(["discovery", "mvp", "standard", "custom"] as const).map((key) => {
              const featured = key === FEATURED.webApps;
              return (
                <article key={key} className={`${styles.pricingCard}${featured ? ` ${styles.pricingCardFeatured}` : ""}`}>
                  {featured && <span className={styles.pricingCardBadge}>{t("mostPopular")}</span>}
                  <p className={styles.cardKicker}>{t(`webAppsSection.${key}.label`)}</p>
                  <p className={styles.pricingValue}>{t(`webAppsSection.${key}.value`)}</p>
                  <p>{t(`webAppsSection.${key}.detail`)}</p>
                  <div className={styles.pricingMeta}>{t(`webAppsSection.${key}.meta`)}</div>
                </article>
              );
            })}
          </div>

          <div className={styles.ctaRow}>
            <Link href="/contact?type=web_app" className="btn btnPrimary">
              {t("webAppsSection.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Automation */}
      <section
        id="automation"
        className={`${styles.section} ${styles.pricingWrap}`}
        style={{ scrollMarginTop: "132px" }}
      >
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>
              {t("automationSection.sectionLabel")}
            </p>
            <h2 className={styles.sectionTitle}>
              {t("automationSection.sectionTitle")}
            </h2>
          </div>

          <div className={styles.pricingGrid}>
            {(["quickFix", "opsSystem", "systemsPartner"] as const).map((key) => {
              const featured = key === FEATURED.automation;
              return (
                <article key={key} className={`${styles.pricingCard}${featured ? ` ${styles.pricingCardFeatured}` : ""}`}>
                  {featured && <span className={styles.pricingCardBadge}>{t("mostPopular")}</span>}
                  <p className={styles.cardKicker}>{t(`automationSection.${key}.label`)}</p>
                  <p className={styles.pricingValue}>{t(`automationSection.${key}.value`)}</p>
                  <p>{t(`automationSection.${key}.detail`)}</p>
                  <div className={styles.pricingMeta}>{t(`automationSection.${key}.meta`)}</div>
                </article>
              );
            })}
          </div>

          <div className={styles.ctaRow}>
            <Link href="/ops-intake" className="btn btnPrimary">
              {t("automationSection.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* E-commerce */}
      <section
        id="ecommerce"
        className={styles.section}
        style={{ scrollMarginTop: "132px" }}
      >
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>
              {t("ecommerceSection.sectionLabel")}
            </p>
            <h2 className={styles.sectionTitle}>
              {t("ecommerceSection.sectionTitle")}
            </h2>
          </div>

          <div className={styles.pricingGrid}>
            {(["build", "run", "fix"] as const).map((key) => {
              const featured = key === FEATURED.ecommerce;
              return (
                <article key={key} className={`${styles.pricingCard}${featured ? ` ${styles.pricingCardFeatured}` : ""}`}>
                  {featured && <span className={styles.pricingCardBadge}>{t("mostPopular")}</span>}
                  <p className={styles.cardKicker}>{t(`ecommerceSection.${key}.label`)}</p>
                  <p className={styles.pricingValue}>{t(`ecommerceSection.${key}.value`)}</p>
                  <p>{t(`ecommerceSection.${key}.detail`)}</p>
                  <div className={styles.pricingMeta}>{t(`ecommerceSection.${key}.meta`)}</div>
                </article>
              );
            })}
          </div>

          <div className={styles.ctaRow}>
            <Link href="/ecommerce/intake" className="btn btnPrimary">
              {t("ecommerceSection.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Rescue */}
      <section
        id="rescue"
        className={`${styles.section} ${styles.pricingWrap}`}
        style={{ scrollMarginTop: "132px" }}
      >
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>
              {t("rescueSection.sectionLabel")}
            </p>
            <h2 className={styles.sectionTitle}>
              {t("rescueSection.sectionTitle")}
            </h2>
          </div>

          <div className={styles.gridTwo}>
            {(["audit", "sprint"] as const).map((key) => {
              const featured = key === FEATURED.rescue;
              return (
                <article key={key} className={`${styles.pricingCard}${featured ? ` ${styles.pricingCardFeatured}` : ""}`}>
                  {featured && <span className={styles.pricingCardBadge}>{t("mostPopular")}</span>}
                  <p className={styles.cardKicker}>{t(`rescueSection.${key}.label`)}</p>
                  <p className={styles.pricingValue}>{t(`rescueSection.${key}.value`)}</p>
                  <p>{t(`rescueSection.${key}.detail`)}</p>
                  <div className={styles.pricingMeta}>{t(`rescueSection.${key}.meta`)}</div>
                </article>
              );
            })}
          </div>

          <div className={styles.ctaRow}>
            <Link
              href="/build/intro?projectType=rescue"
              className="btn btnPrimary"
            >
              {t("rescueSection.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Care plans */}
      <section
        id="care"
        className={styles.section}
        style={{ scrollMarginTop: "132px" }}
      >
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>
              {t("careSection.sectionLabel")}
            </p>
            <h2 className={styles.sectionTitle}>
              {t("careSection.sectionTitle")}
            </h2>
          </div>

          <p className={styles.sectionNote}>{t("careSection.note")}</p>

          <div className={styles.pricingGrid}>
            {(["care", "carePlus", "carePro"] as const).map((key) => {
              const featured = key === FEATURED.care;
              return (
                <article key={key} className={`${styles.pricingCard}${featured ? ` ${styles.pricingCardFeatured}` : ""}`}>
                  {featured && <span className={styles.pricingCardBadge}>{t("mostPopular")}</span>}
                  <p className={styles.cardKicker}>{t(`careSection.${key}.label`)}</p>
                  <p className={styles.pricingValue}>{t(`careSection.${key}.value`)}</p>
                  <p>{t(`careSection.${key}.detail`)}</p>
                  <div className={styles.pricingMeta}>{t(`careSection.${key}.meta`)}</div>
                </article>
              );
            })}
          </div>

          <div className={styles.ctaRow}>
            <Link href="/contact" className="btn btnPrimary">
              {t("careSection.cta")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
