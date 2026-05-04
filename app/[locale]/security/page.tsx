import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import styles from "../marketing.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "security" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SecurityContent />;
}

function SecurityContent() {
  const t = useTranslations("security");

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
                <h2>{t("infraHeading")}</h2>
                <ul>
                  <li>{t("infra1")}</li>
                  <li>{t("infra2")}</li>
                  <li>{t("infra3")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("encryptionHeading")}</h2>
                <ul>
                  <li>{t("encryption1")}</li>
                  <li>{t("encryption2")}</li>
                  <li>{t("encryption3")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("workspaceHeading")}</h2>
                <ul>
                  <li>{t("workspace1")}</li>
                  <li>{t("workspace2")}</li>
                  <li>{t("workspace3")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("isolationHeading")}</h2>
                <ul>
                  <li>{t("isolation1")}</li>
                  <li>{t("isolation2")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("backupsHeading")}</h2>
                <ul>
                  <li>{t("backups1")}</li>
                  <li>{t("backups2")}</li>
                  <li>{t("backups3")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("subprocessorsHeading")}</h2>
                <p>{t("subprocessorsNote")}</p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.6fr 1fr",
                    gap: "0",
                    border: "1px solid var(--rule)",
                    borderRadius: "2px",
                    overflow: "hidden",
                    fontSize: ".88rem",
                  }}
                >
                  {(["1", "2", "3", "4"] as const).map((n) => (
                    <div key={n} style={{ display: "contents" }}>
                      <div style={{ padding: ".6rem .85rem", borderBottom: n !== "4" ? "1px solid var(--rule)" : undefined, background: "var(--paper)", fontWeight: 500 }}>{t(`sp${n}Name`)}</div>
                      <div style={{ padding: ".6rem .85rem", borderBottom: n !== "4" ? "1px solid var(--rule)" : undefined, borderLeft: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink-2)" }}>{t(`sp${n}Role`)}</div>
                      <div style={{ padding: ".6rem .85rem", borderBottom: n !== "4" ? "1px solid var(--rule)" : undefined, borderLeft: "1px solid var(--rule)", background: "var(--paper)", color: "var(--muted)", font: "500 11px/1.5 var(--font-mono)", textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center" }}>{t(`sp${n}Region`)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("wontDoHeading")}</h2>
                <ul>
                  <li>{t("wontDo1")}</li>
                  <li>{t("wontDo2")}</li>
                  <li>{t("wontDo3")}</li>
                  <li>{t("wontDo4")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("yourRespHeading")}</h2>
                <ul>
                  <li>{t("yourResp1")}</li>
                  <li>{t("yourResp2")}</li>
                  <li>{t("yourResp3")}</li>
                  <li>{t("yourResp4")}</li>
                </ul>
              </section>

              <section className={styles.proseSection}>
                <h2>{t("disclosureHeading")}</h2>
                <p>{t("disclosureBody")}</p>
              </section>

            </div>
          </div>

          <div className={styles.ctaRow}>
            <a href="mailto:hello@crecystudio.com" className="btn btnPrimary">
              {t("ctaContact")}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
