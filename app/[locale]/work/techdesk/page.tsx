import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import TrackLink from "@/components/site/TrackLink";
import ScrollReveal from "@/components/site/ScrollReveal";
import styles from "./techdesk.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workTechdesk" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

const GATE_KEYS = ["1", "2", "3", "4", "5", "6"] as const;
const SENTINEL_KEYS = ["url", "sla", "volume"] as const;
const OUTCOME_KEYS = ["autoResolve", "ghost", "flywheel", "sentinel", "triage", "audit"] as const;

export default async function TechDeskPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TechDeskContent />;
}

function TechDeskContent() {
  const t = useTranslations("workTechdesk");

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
              {GATE_KEYS.map((k) => (
                <article key={k} className={styles.guardrailCard}>
                  <p className={styles.guardrailNum}>{t(`gate${k}Num`)}</p>
                  <p className={styles.guardrailTitle}>{t(`gate${k}Title`)}</p>
                  <p className={styles.guardrailBody}>{t(`gate${k}Body`)}</p>
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
            <div className={styles.sentinelGrid}>
              {SENTINEL_KEYS.map((k) => (
                <article key={k} className={styles.guardrailCard}>
                  <p className={styles.guardrailNum}>{t(`sentinel.${k}.label`)}</p>
                  <p className={styles.guardrailBody}>{t(`sentinel.${k}.body`)}</p>
                </article>
              ))}
            </div>
            <p className={styles.prose} style={{ marginTop: "1.2rem" }}>{t("s5Outro")}</p>
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
              event="cta_techdesk_case_study_contact"
              className="btn btnPrimary"
            >
              {t("closingCta")} <span className="btnArrow">-&gt;</span>
            </TrackLink>
            <TrackLink
              href="/process"
              event="cta_techdesk_case_study_process"
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
