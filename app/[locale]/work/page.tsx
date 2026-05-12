import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import TrackLink from "@/components/site/TrackLink";
import ScrollReveal from "@/components/site/ScrollReveal";
import styles from "./work.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "work" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

const VENTURE_KEYS = ["fleiko", "proveo", "techdesk"] as const;

const VENTURE_LIVE_URL: Record<(typeof VENTURE_KEYS)[number], string> = {
  fleiko: "https://fleiko.com",
  proveo: "https://proveohq.com",
  techdesk: "https://kocreit.com",
};

const VENTURE_CASE_STUDY_HREF: Partial<Record<(typeof VENTURE_KEYS)[number], string>> = {
  fleiko: "/work/fleiko",
  proveo: "/work/proveo",
  techdesk: "/work/techdesk",
};

export default async function WorkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WorkContent />;
}

function WorkContent() {
  const t = useTranslations("work");

  return (
    <main className={styles.page}>
      <ScrollReveal />

      <header className={`${styles.hero} heroFadeUp`}>
        <div className="container">
          <p className={styles.kicker}>{t("kicker")}</p>
          <h1 className={styles.title}>
            {t.rich("title", { em: (chunks) => <em>{chunks}</em> })}
          </h1>
          <p className={styles.subtitle}>{t("subtitle")}</p>
        </div>
      </header>

      <section className={`${styles.section} fadeUp`}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{t("venturesLabel")}</p>
            <p className={styles.sectionIntro}>{t("venturesIntro")}</p>
          </div>

          <div className={styles.grid}>
            {VENTURE_KEYS.map((key) => (
              <article key={key} className={styles.card}>
                <p className={styles.ventureBadge}>{t("ventureBadge")}</p>
                <h2 className={styles.ventureName}>{t(`ventures.${key}.name`)}</h2>
                <p className={styles.tagline}>{t(`ventures.${key}.tagline`)}</p>
                <p className={styles.summary}>{t(`ventures.${key}.summary`)}</p>
                <div className={styles.chips}>
                  <span className={styles.chip}>{t(`ventures.${key}.chip1`)}</span>
                  <span className={styles.chip}>{t(`ventures.${key}.chip2`)}</span>
                  <span className={styles.chip}>{t(`ventures.${key}.chip3`)}</span>
                  <span className={styles.chip}>{t(`ventures.${key}.chip4`)}</span>
                </div>
                <a
                  href={VENTURE_LIVE_URL[key]}
                  className={styles.ventureLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t(`ventures.${key}.linkLabel`)} <span aria-hidden>↗</span>
                </a>
                {VENTURE_CASE_STUDY_HREF[key] && (
                  <Link href={VENTURE_CASE_STUDY_HREF[key]!} className={styles.ventureLink}>
                    {t(`ventures.${key}.caseStudyLink`)} →
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} fadeUp`}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{t("clientLabel")}</p>
            <p className={styles.sectionIntro}>{t("clientIntro")}</p>
          </div>

          <div className={styles.grid}>
            <article className={`${styles.card} ${styles.cardPlaceholder}`}>
              <p className={styles.placeholder}>{t("comingSoon")}</p>
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.closing} fadeUp`}>
        <div className="container">
          <div className={styles.closingActions}>
            <TrackLink
              href="/build/intro"
              event="cta_work_closing_start"
              className="btn btnPrimary"
            >
              {t("ctaPrimary")} <span className="btnArrow">-&gt;</span>
            </TrackLink>
            <TrackLink
              href="/contact?type=web_app"
              event="cta_work_closing_custom_app"
              className="btn btnGhost"
            >
              {t("ctaSecondary")} <span className="btnArrow">-&gt;</span>
            </TrackLink>
          </div>
        </div>
      </section>
    </main>
  );
}
