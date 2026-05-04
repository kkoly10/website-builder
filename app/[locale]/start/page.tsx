import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import StartClient from "./StartClient";
import styles from "../marketing.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "start" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function StartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StartContent />;
}

function StartContent() {
  const t = useTranslations("start");

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <Image
              src="/about/komlan.jpg"
              alt="Komlan Kouhiko"
              width={72}
              height={72}
              priority
              style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
            <p className={styles.sectionLabel} style={{ margin: 0 }}>{t("heroLabel")}</p>
          </div>
          <h1 className={styles.title}>{t("heroTitle")}</h1>
          <p className={styles.intro}>{t("heroSub")}</p>
        </div>
      </section>

      {/* What happens next */}
      <section className={styles.section}>
        <div className="container">
          <p className={styles.sectionLabel}>{t("stepsLabel")}</p>
          <div className={styles.gridThree} style={{ marginTop: "1.5rem" }}>
            {([1, 2, 3] as const).map((n) => (
              <article key={n} className={styles.card}>
                <p style={{ margin: "0 0 0.75rem", font: "600 11px/1 var(--font-mono)", letterSpacing: "0.08em", color: "var(--muted)" }}>
                  0{n}
                </p>
                <h3 style={{ margin: "0 0 0.6rem", fontSize: "1rem", fontWeight: 600 }}>
                  {t(`step${n}Title` as any)}
                </h3>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.6 }}>
                  {t(`step${n}Body` as any)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Price anchors + risk reversal */}
      <section className={styles.darkBand}>
        <div className="container">
          <p className={styles.sectionLabel} style={{ color: "inherit", opacity: 0.6 }}>{t("anchorsLabel")}</p>
          <div className={styles.darkGrid} style={{ marginTop: "1.5rem", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {([1, 2, 3] as const).map((n) => (
              <article key={n} className={styles.darkCard}>
                <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
                  {t(`anchor${n}Value` as any)}
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.7, lineHeight: 1.5 }}>
                  {t(`anchor${n}Label` as any)}
                </p>
              </article>
            ))}
          </div>
          <p style={{ marginTop: "1.75rem", fontSize: "0.9rem", opacity: 0.65, lineHeight: 1.65, maxWidth: 560 }}>
            {t("riskReversal")}
          </p>
        </div>
      </section>

      {/* Booking form */}
      <section className={styles.section}>
        <div className="container">
          <p className={styles.sectionLabel}>{t("formLabel")}</p>
          <div style={{ marginTop: "1.5rem" }}>
            <StartClient />
          </div>
        </div>
      </section>
    </div>
  );
}
