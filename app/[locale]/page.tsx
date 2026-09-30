import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import TrackLink from "@/components/site/TrackLink";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
    twitter: {
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

const PROJECTS = [
  {
    key: "fleiko",
    number: "01",
    href: "https://fleiko.com",
    image: "/work-in-view/fleiko-dashboard.png",
    width: 1280,
    height: 545,
    className: "projectFleiko",
  },
  {
    key: "proveo",
    number: "02",
    href: "https://proveohq.com",
    image: "/work-in-view/proveo-demo.png",
    width: 1280,
    height: 900,
    className: "projectProveo",
  },
  {
    key: "kocre",
    number: "03",
    href: "https://kocreit.com",
    image: "/work-in-view/kocre-site.png",
    width: 1280,
    height: 900,
    className: "projectKocre",
  },
  {
    key: "crecyos",
    number: "04",
    href: "https://crecyos.com",
    image: "/work-in-view/crecyos-top.png",
    width: 1280,
    height: 900,
    className: "projectCrecyos",
  },
] as const;

const CAPABILITIES = [
  { key: "websites", href: "/websites", event: "cta_home_capability_websites" },
  { key: "saas", href: "/saas", event: "cta_home_capability_saas" },
  { key: "ai", href: "/ai-integration", event: "cta_home_capability_ai" },
  { key: "systems", href: "/custom-web-apps", event: "cta_home_capability_systems" },
] as const;

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("home");

  return (
    <div
      className={["workInViewHome", styles.workInViewPage].join(" ")}
    >
      <header className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>{t("workInView.hero.label")}</p>
            <h1 className={styles.heroTitle}>
              <span>{t("workInView.hero.line1")}</span>
              <span className={styles.heroAccent}>{t("workInView.hero.line2")}</span>
            </h1>
            <p className={styles.heroLead}>{t("workInView.hero.body")}</p>
            <div className={styles.heroActions}>
              <a className={[styles.action, styles.actionAccent].join(" ")} href="#work">
                <span>{t("workInView.hero.workCta")}</span>
                <span aria-hidden>↓</span>
              </a>
              <TrackLink
                href="/build/intro"
                event="cta_home_work_in_view_start"
                className={styles.action}
              >
                <span>{t("workInView.hero.projectCta")}</span>
                <span aria-hidden>↗</span>
              </TrackLink>
            </div>
          </div>

          <aside className={styles.heroIndex} aria-label={t("workInView.index.aria")}>
            <div className={styles.indexHead}>
              <span>{t("workInView.index.label")}</span>
              <span>2024—26</span>
            </div>
            {PROJECTS.map((project) => (
              <a
                key={project.key}
                href={"#" + project.key}
                className={styles.indexRow}
              >
                <span className={styles.indexNum}>{project.number}</span>
                <Image
                  className={styles.indexThumb}
                  src={project.image}
                  alt=""
                  width={74}
                  height={48}
                  sizes="74px"
                />
                <span className={styles.indexCopy}>
                  <span className={styles.indexName}>
                    {t("workInView.projects." + project.key + ".name")}
                  </span>
                  <span className={styles.indexDesc}>
                    {t("workInView.projects." + project.key + ".short")}
                  </span>
                </span>
                <span className={styles.indexStatus}>
                  {t("workInView.index.live")} <span aria-hidden>↗</span>
                </span>
              </a>
            ))}
          </aside>
        </div>

        <div className={styles.evidenceStrip}>
          {(["software", "web", "ai", "workspace"] as const).map((key) => (
            <div key={key} className={styles.evidence}>
              <strong>{t("workInView.evidence." + key + ".title")}</strong>
              <span>{t("workInView.evidence." + key + ".body")}</span>
            </div>
          ))}
        </div>
      </header>

      <section id="work" className={styles.workIntro}>
        <p className={styles.sectionMarker}>{t("workInView.work.label")}</p>
        <div className={styles.workIntroCopy}>
          <h2>{t("workInView.work.title")}</h2>
          <p className={styles.workIntroBody}>{t("workInView.work.body")}</p>
          <p className={styles.disclosure}>{t("workInView.work.disclosure")}</p>
        </div>
      </section>

      {PROJECTS.map((project) => (
        <section
          id={project.key}
          key={project.key}
          className={[styles.project, styles[project.className]].join(" ")}
        >
          <div className={styles.projectInner}>
            <div className={styles.projectCaption}>
              <span className={styles.projectNumber}>{project.number}</span>
              <h2>{t("workInView.projects." + project.key + ".name")}</h2>
              <p className={styles.projectBody}>
                {t("workInView.projects." + project.key + ".body")}
              </p>
              <div className={styles.projectBottom}>
                <p className={styles.ownership}>
                  {t("workInView.projects." + project.key + ".ownership")}
                </p>
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.projectLink}
                >
                  {t("workInView.projects.open")} <span aria-hidden>↗</span>
                </a>
              </div>
            </div>

            <figure className={styles.projectVisual}>
              <figcaption>
                {t("workInView.projects." + project.key + ".visualLabel")}
              </figcaption>
              <Image
                src={project.image}
                alt={t("workInView.projects." + project.key + ".imageAlt")}
                width={project.width}
                height={project.height}
                sizes="(max-width: 760px) 100vw, (max-width: 1200px) 68vw, 900px"
                className={styles.projectImage}
              />
            </figure>
          </div>
        </section>
      ))}

      <section id="capabilities" className={styles.capabilities}>
        <div className={styles.capabilitiesHead}>
          <p className={styles.sectionMarker}>{t("workInView.capabilities.label")}</p>
          <h2>{t("workInView.capabilities.title")}</h2>
        </div>

        <div className={styles.capabilityRows}>
          {CAPABILITIES.map((item) => (
            <TrackLink
              key={item.key}
              href={item.href}
              event={item.event}
              className={styles.capabilityRow}
            >
              <span className={styles.capabilityTitle}>
                {t("workInView.capabilities." + item.key + ".title")}
              </span>
              <span className={styles.capabilityBody}>
                {t("workInView.capabilities." + item.key + ".body")}
              </span>
              <span className={styles.capabilityProof}>
                {t("workInView.capabilities." + item.key + ".proof")}
              </span>
              <span className={styles.capabilityArrow} aria-hidden>
                ↗
              </span>
            </TrackLink>
          ))}
        </div>
      </section>

      <section className={styles.workspace}>
        <div className={styles.workspaceCopy}>
          <p className={styles.darkMarker}>{t("workInView.workspace.label")}</p>
          <h2>{t("workInView.workspace.title")}</h2>
          <p>{t("workInView.workspace.body")}</p>
          <TrackLink
            href="/process"
            event="cta_home_work_in_view_workspace"
            className={styles.darkLink}
          >
            {t("workInView.workspace.cta")} <span aria-hidden>↗</span>
          </TrackLink>
        </div>
        <figure className={styles.workspaceVisual}>
          <figcaption>{t("workInView.workspace.visualLabel")}</figcaption>
          <Image
            src="/work-in-view/workspace-public.png"
            alt={t("workInView.workspace.imageAlt")}
            width={1280}
            height={730}
            sizes="(max-width: 760px) 100vw, 62vw"
            className={styles.workspaceImage}
          />
        </figure>
      </section>

      <section id="process" className={styles.process}>
        <p className={styles.sectionMarker}>{t("workInView.process.label")}</p>
        <div className={styles.steps}>
          {(["define", "build", "ship"] as const).map((key, index) => (
            <article key={key} className={styles.step}>
              <span className={styles.stepNumber}>0{index + 1}</span>
              <h2>{t("workInView.process." + key + ".title")}</h2>
              <p>{t("workInView.process." + key + ".body")}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.studioNote}>
        <p className={styles.sectionMarker}>{t("workInView.studio.label")}</p>
        <div>
          <h2>{t("workInView.studio.title")}</h2>
          <p>{t("workInView.studio.body")}</p>
          <Link href="/about" className={styles.studioLink}>
            {t("workInView.studio.cta")} <span aria-hidden>↗</span>
          </Link>
        </div>
      </section>

      <section className={styles.closing}>
        <h2>{t("workInView.closing.title")}</h2>
        <TrackLink
          href="/build/intro"
          event="cta_home_work_in_view_closing"
          className={styles.closingCta}
        >
          {t("workInView.closing.cta")} <span aria-hidden>↗</span>
        </TrackLink>
      </section>
    </div>
  );
}
