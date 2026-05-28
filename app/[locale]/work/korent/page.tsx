import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import TrackLink from "@/components/site/TrackLink";
import ScrollReveal from "@/components/site/ScrollReveal";
import StructuredData from "@/components/seo/StructuredData";
import {
  articleNode,
  breadcrumbListNode,
  siteGraph,
} from "@/lib/seo/structuredData";
import styles from "./korent.module.css";

// Placeholder publication date for Article schema. Mirrors the pattern
// from the Fleiko / Proveo / Kocre IT case studies — Google needs *a*
// date for Article rich results. Korent launched in 2025; using mid-year
// as a defensible date.
const KORENT_PUBLISHED_AT = "2025-08-01";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workKorent" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function KorentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [tCommon, tNav, tCase] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "workKorent" }),
  ]);

  // Locale-aware breadcrumb URLs so each language's SERPs link to its
  // own path (Google honors hreflang separately, but BreadcrumbList
  // items should point at the version actually being viewed).
  const localePrefix = locale === "en" ? "" : `/${locale}`;
  const caseUrl = `${localePrefix}/work/korent`;
  const graph = siteGraph([
    articleNode({
      url: caseUrl,
      headline: tCase("title"),
      description: tCase("metaDescription"),
      datePublished: KORENT_PUBLISHED_AT,
      inLanguage: locale,
    }),
    breadcrumbListNode([
      { name: tCommon("home"), url: localePrefix || "/" },
      { name: tNav("work"), url: `${localePrefix}/work` },
      { name: tCase("title"), url: caseUrl },
    ]),
  ]);

  return (
    <>
      <StructuredData graph={graph} />
      <KorentContent />
    </>
  );
}

function KorentContent() {
  const t = useTranslations("workKorent");

  return (
    <main className={styles.page}>
      <ScrollReveal />

      <div className="container">
        <Link href="/work" className={styles.backLink}>
          ← {t("back")}
        </Link>
      </div>

      <header className={`${styles.hero} heroFadeUp`}>
        <div className="container">
          <p className={styles.kicker}>{t("kicker")}</p>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.subtitle}>{t("subtitle")}</p>
          <div className={styles.chips}>
            <span className={styles.chip}>{t("chips.stack")}</span>
            <span className={styles.chip}>{t("chips.ai")}</span>
            <span className={styles.chip}>{t("chips.pattern")}</span>
            <span className={styles.chip}>{t("chips.market")}</span>
          </div>
        </div>
      </header>

      <div className="container">
        <div className={styles.body}>

          <section className={`${styles.section} fadeUp`}>
            <h2 className={styles.sectionTitle}>{t("s1Title")}</h2>
            <p className={styles.prose}>{t("s1Body")}</p>
          </section>

          <section className={`${styles.section} fadeUp`}>
            <h2 className={styles.sectionTitle}>{t("s2Title")}</h2>
            <p className={styles.prose}>{t("s2Body")}</p>
          </section>

          <section className={`${styles.section} fadeUp`}>
            <h2 className={styles.sectionTitle}>{t("s3Title")}</h2>
            <p className={styles.prose}>{t("s3Body")}</p>
          </section>

          <section className={`${styles.section} fadeUp`}>
            <h2 className={styles.sectionTitle}>{t("s4Title")}</h2>
            <p className={styles.prose}>{t("s4Body")}</p>
            <blockquote className={styles.callout}>{t("callout")}</blockquote>
          </section>

        </div>
      </div>

      <section className={`${styles.closing} fadeUp`}>
        <div className="container">
          <h2 className={styles.closingTitle}>{t("closingTitle")}</h2>
          <p className={styles.closingBody}>{t("closingBody")}</p>
          <div className={styles.closingActions}>
            <TrackLink
              href="/contact?type=web_app"
              event="cta_korent_case_study_contact"
              className="btn btnPrimary"
            >
              {t("closingCta")} <span className="btnArrow">-&gt;</span>
            </TrackLink>
            <TrackLink
              href="/process"
              event="cta_korent_case_study_process"
              className="btn"
            >
              {t("closingCtaSecondary")} <span className="btnArrow">-&gt;</span>
            </TrackLink>
          </div>
        </div>
      </section>
    </main>
  );
}
