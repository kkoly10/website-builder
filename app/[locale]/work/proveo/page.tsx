import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import TrackLink from "@/components/site/TrackLink";
import ScrollReveal from "@/components/site/ScrollReveal";
import styles from "./proveo.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workProveo" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

const BADGE_CHECK_KEYS = ["guided", "raw", "timestampMin", "timestampMax", "sha256"] as const;
const OUTCOME_KEYS = ["detection", "proofState", "provenance", "badges", "multimodel", "audit"] as const;

export default async function ProveoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProveoContent />;
}

function ProveoContent() {
  const t = useTranslations("workProveo");

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
            <span className={styles.chip}>{t("chips.vision")}</span>
            <span className={styles.chip}>{t("chips.trust")}</span>
            <span className={styles.chip}>{t("chips.multimodel")}</span>
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
              <article className={styles.guardrailCard}>
                <p className={styles.guardrailNum}>{t("tier1Num")}</p>
                <p className={styles.guardrailTitle}>{t("tier1Title")}</p>
                <p className={styles.guardrailBody}>{t("tier1Body")}</p>
              </article>
              <article className={styles.guardrailCard}>
                <p className={styles.guardrailNum}>{t("tier2Num")}</p>
                <p className={styles.guardrailTitle}>{t("tier2Title")}</p>
                <p className={styles.guardrailBody}>{t("tier2Body")}</p>
              </article>
              <article className={styles.guardrailCard}>
                <p className={styles.guardrailNum}>{t("tier3Num")}</p>
                <p className={styles.guardrailTitle}>{t("tier3Title")}</p>
                <p className={styles.guardrailBody}>{t("tier3Body")}</p>
              </article>
            </div>
            <p className={`${styles.prose}`} style={{ marginTop: "1.2rem" }}>{t("s3Outro")}</p>
          </section>

          <section className={`${styles.section} fadeUp`}>
            <h2 className={styles.sectionTitle}>{t("s4Title")}</h2>
            <p className={styles.prose}>{t("s4Body")}</p>
          </section>

          <section className={`${styles.section} fadeUp`}>
            <h2 className={styles.sectionTitle}>{t("s5Title")}</h2>
            <p className={styles.prose}>{t("s5Intro")}</p>
            <div className={styles.scoreGrid}>
              {BADGE_CHECK_KEYS.map((k) => (
                <div key={k} className={styles.scoreCard}>
                  <p className={styles.scoreSignal}>{t(`check.${k}.label`)}</p>
                  <p className={styles.scoreDeduction}>{t(`check.${k}.value`)}</p>
                </div>
              ))}
            </div>
            <p className={`${styles.prose}`} style={{ marginTop: "1.2rem" }}>{t("s5Outro")}</p>
          </section>

          <section className={`${styles.section} fadeUp`}>
            <h2 className={styles.sectionTitle}>{t("s6Title")}</h2>
            <p className={styles.prose}>{t("s6Body")}</p>
          </section>

          <section className={`${styles.section} fadeUp`}>
            <h2 className={styles.sectionTitle}>{t("s7Title")}</h2>
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
              event="cta_proveo_case_study_contact"
              className="btn btnPrimary"
            >
              {t("closingCta")} <span className="btnArrow">-&gt;</span>
            </TrackLink>
            <TrackLink
              href="/process"
              event="cta_proveo_case_study_process"
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
