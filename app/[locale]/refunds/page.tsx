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
  const t = await getTranslations({ locale, namespace: "refund" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function RefundsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RefundContent />;
}

function RefundContent() {
  const t = useTranslations("refund");

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
                <h2>{t("depositsHeading")}</h2>
                <p>{t("depositsBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("milestonesHeading")}</h2>
                <p>{t("milestonesBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("cancellationHeading")}</h2>
                <ul>
                  <li>{t("cancellation1")}</li>
                  <li>{t("cancellation2")}</li>
                  <li>{t("cancellation3")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("thirdPartyHeading")}</h2>
                <p>{t("thirdPartyBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("neverHeading")}</h2>
                <ul>
                  <li>{t("never1")}</li>
                  <li>{t("never2")}</li>
                  <li>{t("never3")}</li>
                  <li>{t("never4")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("disputesHeading")}</h2>
                <p>{t("disputesBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("processHeading")}</h2>
                <p>{t("processBody")}</p>
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
