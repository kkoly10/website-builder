import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import styles from "../home.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AboutContent />;
}

function AboutContent() {
  const tHome = useTranslations("home");
  const tAbout = useTranslations("about");

  const proofItems = [
    { value: "2",  label: tAbout("proof.saas") },
    { value: "5+", label: tAbout("proof.systems") },
    { value: "1",  label: tAbout("proof.practitioner") },
  ];

  return (
    <main>
      <section className={styles.founder}>
        <div className="container">
          <div className={styles.founderInner}>
            <div className={styles.founderPhotoWrap}>
              <Image
                src="/about/komlan.jpg"
                alt="Komlan Kouhiko, founder of CrecyStudio"
                width={220}
                height={220}
                className={styles.founderImg}
                priority
              />
            </div>
            <div className={styles.founderContent}>
              <p className={styles.sectionLabel}>{tHome("founder.label")}</p>
              <h1 className={styles.founderName}>{tHome("founder.name")}</h1>
              <p className={styles.founderRole}>{tHome("founder.role")}</p>
              <p className={styles.founderBio}>{tHome("founder.bio1")}</p>
              <p className={styles.founderBio}>{tHome("founder.bio2")}</p>
              <p className={styles.founderBio}>{tHome("founder.bio3")}</p>
              <a
                href={tHome("founder.linkedinHref")}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.founderLinkedIn}
              >
                {tHome("founder.linkedin")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.proof}>
        <div
          className={`container ${styles.proofGrid}`}
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          {proofItems.map((item) => (
            <article key={item.label} className={styles.proofItem}>
              <p className={styles.proofValue}>{item.value}</p>
              <p className={styles.proofLabel}>{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.ventures}>
        <div className="container">
          <p className={styles.venturesLabel}>{tHome("ventures.label")}</p>
          <h2 className={styles.venturesTitle}>{tHome("ventures.title")}</h2>
          <p className={styles.venturesIntro}>{tHome("ventures.intro")}</p>
          <div className={styles.venturesGrid}>
            <article className={styles.ventureCard}>
              <p className={styles.ventureName}>{tHome("ventures.korent.name")}</p>
              <p className={styles.ventureTagline}>{tHome("ventures.korent.tagline")}</p>
              <p className={styles.ventureDetail}>{tHome("ventures.korent.detail")}</p>
              <div className={styles.ventureChips}>
                <span className={styles.ventureChip}>{tHome("ventures.korent.chip1")}</span>
                <span className={styles.ventureChip}>{tHome("ventures.korent.chip2")}</span>
              </div>
            </article>
            <article className={styles.ventureCard}>
              <p className={styles.ventureName}>{tHome("ventures.proveo.name")}</p>
              <p className={styles.ventureTagline}>{tHome("ventures.proveo.tagline")}</p>
              <p className={styles.ventureDetail}>{tHome("ventures.proveo.detail")}</p>
              <div className={styles.ventureChips}>
                <span className={styles.ventureChip}>{tHome("ventures.proveo.chip1")}</span>
                <span className={styles.ventureChip}>{tHome("ventures.proveo.chip2")}</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section style={{ padding: "3rem 0", borderTop: "1px solid var(--rule)" }}>
        <div className="container">
          <p className={styles.sectionLabel}>{tAbout("wontTake.label")}</p>
          <h2 className={styles.venturesTitle}>{tAbout("wontTake.title")}</h2>
          <p className={styles.founderBio} style={{ marginBottom: "1.25rem" }}>{tAbout("wontTake.intro")}</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: ".6rem" }}>
            {(["0","1","2","3","4"] as const).map((i) => (
              <li key={i} style={{ display: "flex", gap: ".75rem", alignItems: "baseline" }}>
                <span style={{ font: "500 11px/1 var(--font-mono)", color: "var(--muted)", flexShrink: 0 }}>✕</span>
                <span style={{ fontSize: ".95rem", color: "var(--ink)", lineHeight: 1.65 }}>{tAbout(`wontTake.${i}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section style={{ padding: "3.5rem 0", borderTop: "1px solid var(--rule)" }}>
        <div className="container">
          <p className={styles.sectionLabel}>{tAbout("ctaLabel")}</p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
            <Link href="/build/intro" className="btn btnPrimary">
              {tAbout("ctaLowTicket")} <span className="btnArrow">→</span>
            </Link>
            <Link href="/contact" className="btn">
              {tAbout("ctaHighTicket")} <span className="btnArrow">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
