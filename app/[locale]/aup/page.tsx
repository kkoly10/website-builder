import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import styles from "../marketing.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aup" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function AupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AupContent />;
}

function AupContent() {
  const t = useTranslations("aup");

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <p className={styles.label}>{t("label")}</p>
            <h1 className={styles.title}>{t("title")}</h1>
            <p className={styles.intro}>{t("intro")}</p>
            <p className={styles.legalMeta}>{t("lastUpdated")}</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.prose}>
            <div className={styles.proseInner}>

              <section className={styles.proseSection}>
                <h2>{t("wontBuildHeading")}</h2>
                <ul>
                  <li>{t("wontBuild1")}</li>
                  <li>{t("wontBuild2")}</li>
                  <li>{t("wontBuild3")}</li>
                  <li>{t("wontBuild4")}</li>
                  <li>{t("wontBuild5")}</li>
                  <li>{t("wontBuild6")}</li>
                  <li>{t("wontBuild7")}</li>
                  <li>{t("wontBuild8")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("declinesHeading")}</h2>
                <ul>
                  <li>{t("declines1")}</li>
                  <li>{t("declines2")}</li>
                  <li>{t("declines3")}</li>
                  <li>{t("declines4")}</li>
                  <li>{t("declines5")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("midProjectHeading")}</h2>
                <p>{t("midProjectBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("liabilityHeading")}</h2>
                <p>{t("liabilityBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("ourSystemsHeading")}</h2>
                <p>{t("ourSystemsBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("reportHeading")}</h2>
                <p>{t("reportBody")}</p>
              </section>

            </div>
          </div>

          <div className={styles.ctaRow}>
            <a href="mailto:hello@crecystudio.com" className="btn btnPrimary">
              {t("ctaContact")}
            </a>
            <Link href="/terms" className="btn">
              {t("ctaTerms")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
