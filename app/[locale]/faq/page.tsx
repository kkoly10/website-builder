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
  const t = await getTranslations({ locale, namespace: "faq" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

const FAQ_KEYS = [
  "estimate",
  "scope",
  "ownership",
  "portal",
  "ongoing",
  "fit",
] as const;

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FaqContent />;
}

function FaqContent() {
  const t = useTranslations("faq");

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

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{t("sectionLabel")}</p>
            <h2 className={styles.sectionTitle}>{t("sectionTitle")}</h2>
          </div>

          <div className={styles.faqGrid}>
            {FAQ_KEYS.map((key) => (
              <article key={key} className={styles.faqCard}>
                <h3>{t(`items.${key}.q`)}</h3>
                <p>{t(`items.${key}.a`)}</p>
              </article>
            ))}
          </div>

          <div className={styles.ctaRow}>
            <Link href="/websites" className="btn btnGhost">
              {t("ctaSecondary")}
            </Link>
            <Link href="/contact" className="btn btnPrimary">
              {t("ctaPrimary")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
