import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import styles from "./about.module.css";

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

const CAPABILITY_KEYS = ["websites", "saas", "ai", "systems"] as const;
const PROJECTS = ["Korent", "Couranr", "Couranr Market", "Fleiko"] as const;

function AboutContent() {
  const t = useTranslations("about");
  const tHome = useTranslations("home");

  const proofItems = [
    { value: "4", label: t("proof.saas") },
    { value: "5+", label: t("proof.systems") },
    { value: "1", label: t("proof.practitioner") },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <p className={styles.marker}>{t("kicker")}</p>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>{t("heroTitle")}</h1>
              <p className={styles.heroIntro}>{t("heroIntro")}</p>
            </div>
          </div>
          <div className={styles.proofGrid}>
            {proofItems.map((item) => (
              <article key={item.label} className={styles.proofItem}>
                <p className={styles.proofValue}>{item.value}</p>
                <p className={styles.proofLabel}>{item.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.capabilities}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.marker}>{t("capabilitiesLabel")}</p>
            <h2 className={styles.sectionTitle}>{t("capabilitiesTitle")}</h2>
          </div>
          <div className={styles.capabilityRows}>
            {CAPABILITY_KEYS.map((key, index) => (
              <article key={key} className={styles.capabilityRow}>
                <span className={styles.rowIndex}>0{index + 1}</span>
                <h3>{t(`capabilities.${key}.title`)}</h3>
                <p>{t(`capabilities.${key}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className={styles.evidence}>
        <div className="container">
          <div className={styles.evidenceGrid}>
            <div>
              <p className={styles.darkMarker}>{t("evidenceLabel")}</p>
              <h2 className={styles.evidenceTitle}>{t("evidenceTitle")}</h2>
              <p className={styles.evidenceBody}>{t("evidenceBody")}</p>
              <Link href="/work" className={styles.evidenceLink}>
                {t("evidenceCta")}
              </Link>
            </div>
            <div className={styles.projectList}>
              {PROJECTS.map((project, index) => (
                <div key={project} className={styles.projectRow}>
                  <span>0{index + 1}</span>
                  <strong>{project}</strong>
                  <span>{t("evidenceLabel")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.founder}>
        <div className="container">
          <div className={styles.founderGrid}>
            <div className={styles.founderPhotoWrap}>
              <Image
                src="/about/komlan.jpg"
                alt="Komlan Kouhiko, founder of CrecyStudio"
                width={280}
                height={280}
                className={styles.founderImg}
              />
            </div>
            <div className={styles.founderCopy}>
              <p className={styles.marker}>{t("founderLabel")}</p>
              <h2 className={styles.sectionTitle}>{t("founderTitle")}</h2>
              <p className={styles.founderIntro}>{t("founderIntro")}</p>
              <div className={styles.founderIdentity}>
                <strong>{tHome("founder.name")}</strong>
                <span>{tHome("founder.role")}</span>
              </div>
              <p className={styles.founderNote}>{tHome("founder.bio3")}</p>
              <a
                href={tHome("founder.linkedinHref")}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.textLink}
              >
                {tHome("founder.linkedin")}
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className={styles.fit}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.marker}>{t("wontTake.label")}</p>
            <h2 className={styles.sectionTitle}>{t("wontTake.title")}</h2>
            <p className={styles.fitIntro}>{t("wontTake.intro")}</p>
          </div>
          <div className={styles.fitRows}>
            {(["0", "1", "2", "3", "4"] as const).map((key, index) => (
              <div key={key} className={styles.fitRow}>
                <span>0{index + 1}</span>
                <p>{t(`wontTake.${key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.closing}>
        <div className="container">
          <div className={styles.closingGrid}>
            <div>
              <p className={styles.closingMarker}>{t("ctaLabel")}</p>
              <h2>{t("closingTitle")}</h2>
            </div>
            <div className={styles.closingActions}>
              <Link href="/build/intro" className={styles.closingButton}>
                {t("ctaLowTicket")}
              </Link>
              <Link href="/contact" className={styles.closingButton}>
                {t("ctaHighTicket")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
