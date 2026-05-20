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
import styles from "./fleiko.module.css";

// Placeholder publication date for Article schema. Update if/when we have a
// real authored-on date per case study. Search engines need *a* date to
// surface Article rich results; the exact value matters less for ranking
// than its presence + dateModified showing the page isn't stale.
const FLEIKO_PUBLISHED_AT = "2025-01-01";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workFleiko" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

const GUARDRAIL_KEYS = ["1", "2", "3", "4"] as const;

const SCORE_SIGNALS = [
  { signal: "Expired document", deduction: "−5 pts each (cap −20)" },
  { signal: "Overdue maintenance", deduction: "−5 pts each (cap −20)" },
  { signal: "Urgent open repair", deduction: "−10 pts each (cap −20)" },
  { signal: "Vehicle out of service", deduction: "−5 pts each (cap −15)" },
  { signal: "Failed inspection", deduction: "−5 pts each (cap −15)" },
  { signal: "Expired driver license", deduction: "−5 pts each (cap −10)" },
] as const;

const OUTCOME_KEYS = ["injection", "dataloss", "approval", "readonly", "thinking"] as const;

export default async function FleikoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [tCommon, tNav, tCase] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "workFleiko" }),
  ]);

  // Locale-aware breadcrumb URLs so each language's SERPs link to its own
  // path (Google honors hreflang separately, but BreadcrumbList items
  // should point at the version actually being viewed).
  const localePrefix = locale === "en" ? "" : `/${locale}`;
  const caseUrl = `${localePrefix}/work/fleiko`;
  const graph = siteGraph([
    articleNode({
      url: caseUrl,
      headline: tCase("title"),
      description: tCase("metaDescription"),
      datePublished: FLEIKO_PUBLISHED_AT,
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
      <FleikoContent />
    </>
  );
}

function FleikoContent() {
  const t = useTranslations("workFleiko");

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
            <span className={styles.chip}>{t("chips.safety")}</span>
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
            <p className={styles.prose}>{t("s3Intro")}</p>
            <div className={styles.guardrails}>
              {GUARDRAIL_KEYS.map((k) => (
                <article key={k} className={styles.guardrailCard}>
                  <p className={styles.guardrailNum}>{t(`guardrail${k}Num`)}</p>
                  <p className={styles.guardrailTitle}>{t(`guardrail${k}Title`)}</p>
                  <p className={styles.guardrailBody}>{t(`guardrail${k}Body`)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={`${styles.section} fadeUp`}>
            <h2 className={styles.sectionTitle}>{t("s4Title")}</h2>
            <p className={styles.prose}>{t("s4Body")}</p>
          </section>

          <section className={`${styles.section} fadeUp`}>
            <h2 className={styles.sectionTitle}>{t("s5Title")}</h2>
            <p className={styles.prose}>{t("s5Intro")}</p>
            <div className={styles.scoreGrid}>
              {SCORE_SIGNALS.map((s) => (
                <div key={s.signal} className={styles.scoreCard}>
                  <p className={styles.scoreSignal}>{s.signal}</p>
                  <p className={styles.scoreDeduction}>{s.deduction}</p>
                </div>
              ))}
            </div>
            <p className={`${styles.prose}`} style={{ marginTop: "1.2rem" }}>{t("s5Outro")}</p>
          </section>

          <section className={`${styles.section} fadeUp`}>
            <h2 className={styles.sectionTitle}>{t("s6Title")}</h2>
            <ul className={styles.outcomeList}>
              {OUTCOME_KEYS.map((k) => (
                <li key={k}>{t(`outcome.${k}`)}</li>
              ))}
            </ul>
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
              event="cta_fleiko_case_study_contact"
              className="btn btnPrimary"
            >
              {t("closingCta")} <span className="btnArrow">-&gt;</span>
            </TrackLink>
            <TrackLink
              href="/process"
              event="cta_fleiko_case_study_process"
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
