import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import ScrollReveal from "@/components/site/ScrollReveal";
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
  const t = useTranslations("home");

  return (
    <main>
      <ScrollReveal />

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
              <p className={styles.sectionLabel}>{t("founder.label")}</p>
              <h1 className={styles.founderName}>{t("founder.name")}</h1>
              <p className={styles.founderRole}>{t("founder.role")}</p>
              <p className={styles.founderBio}>{t("founder.bio1")}</p>
              <p className={styles.founderBio}>{t("founder.bio2")}</p>
              <p className={styles.founderBio}>{t("founder.bio3")}</p>
              <a
                href={t("founder.linkedinHref")}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.founderLinkedIn}
              >
                {t("founder.linkedin")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "3.5rem 0" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <Link href="/build/intro" className="btn btnPrimary">
            {t("ctaStart")} <span className="btnArrow">-&gt;</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
