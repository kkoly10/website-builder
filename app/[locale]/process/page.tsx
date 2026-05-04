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
  const t = await getTranslations({ locale, namespace: "process" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

const STEP_KEYS = ["step1", "step2", "step3", "step4"] as const;
const NOTE_KEYS = ["websites", "ecommerce", "systems"] as const;

export default async function ProcessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProcessContent />;
}

function ProcessContent() {
  const t = useTranslations("process");

  const steps = STEP_KEYS.map((key) => ({
    key,
    step: t(`${key}.step`),
    title: t(`${key}.title`),
    body: t(`${key}.body`),
  }));

  const notes = NOTE_KEYS.map((key) => ({
    key,
    title: t(`${key}.title`),
    body: t(`${key}.body`),
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

      <section className={styles.darkBand}>
        <div className="container">
          <p className={styles.darkLead}>{t("lead")}</p>

          <div className={styles.darkGrid}>
            {steps.map((step) => (
              <article key={step.key} className={styles.darkCard}>
                <p className={styles.darkStep}>{step.step}</p>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "2.5rem 0", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
        <div className="container">
          <p className={styles.sectionLabel}>{t("founderNoteLabel")}</p>
          <p className={styles.sectionNote} style={{ maxWidth: 640, marginTop: "0.5rem" }}>{t("founderNote")}</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{t("byLaneLabel")}</p>
            <h2 className={styles.sectionTitle}>{t("byLaneTitle")}</h2>
          </div>

          <div className={styles.gridThree}>
            {notes.map((note) => (
              <article key={note.key} className={styles.card}>
                <p className={styles.cardKicker}>{t("byLaneKicker")}</p>
                <h3>{note.title}</h3>
                <p>{note.body}</p>
              </article>
            ))}
          </div>

          <div className={styles.ctaRow}>
            <Link href="/build/intro" className="btn btnPrimary">
              {t("ctaPrimary")}
            </Link>
            <Link href="/pricing" className="btn btnGhost">
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
