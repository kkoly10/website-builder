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
  const t = await getTranslations({ locale, namespace: "terms" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TermsContent />;
}

function TermsContent() {
  const t = useTranslations("terms");

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
                <h2>{t("scopeHeading")}</h2>
                <p>{t("scopeBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("paymentsHeading")}</h2>
                <ul>
                  <li>{t("payments1")}</li>
                  <li>{t("payments2")}</li>
                  <li>{t("payments3")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("ownershipHeading")}</h2>
                <p>{t("ownershipBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("supportHeading")}</h2>
                <p>{t("supportBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("questionsHeading")}</h2>
                <p>
                  {t("questionsBody1")}{" "}
                  <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>{" "}
                  {t("questionsBody2")}{" "}
                  <Link href="/privacy">{t("questionsLink")}</Link>{" "}
                  {t("questionsBody3")}
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
