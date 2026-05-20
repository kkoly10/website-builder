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
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyContent />;
}

function PrivacyContent() {
  const t = useTranslations("privacy");

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
                <h2>{t("collectHeading")}</h2>
                <ul>
                  <li>{t("collect1")}</li>
                  <li>{t("collect2")}</li>
                  <li>{t("collect3")}</li>
                  <li>{t("collect4")}</li>
                  <li>{t("collect5")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("useHeading")}</h2>
                <ul>
                  <li>{t("use1")}</li>
                  <li>{t("use2")}</li>
                  <li>{t("use3")}</li>
                  <li>{t("use4")}</li>
                  <li>{t("use5")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("subprocessorsHeading")}</h2>
                <p>{t("subprocessorsBody")}</p>
                <ul>
                  <li>{t("sp1")}</li>
                  <li>{t("sp2")}</li>
                  <li>{t("sp3")}</li>
                  <li>{t("sp4")}</li>
                  <li>{t("sp5")}</li>
                  <li>{t("sp6")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("selfServiceHeading")}</h2>
                <p>{t("selfServiceBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("retentionHeading")}</h2>
                <ul>
                  <li>{t("retention1")}</li>
                  <li>{t("retention2")}</li>
                  <li>{t("retention3")}</li>
                  <li>{t("retention4")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("cookiesHeading")}</h2>
                <p>{t("cookiesBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("rightsHeading")}</h2>
                <p>
                  {t("rightsBody")}{" "}
                  <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>.
                </p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("ccpaHeading")}</h2>
                <p>{t("ccpaBody")}</p>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("contactHeading")}</h2>
                <p>
                  {t("contactBody")}{" "}
                  <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>.
                </p>
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
