import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import TrackLink from "@/components/site/TrackLink";
import ScrollReveal from "@/components/site/ScrollReveal";
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

const JOURNEY_KEYS = [
  ["intake", "done"],
  ["agreement", "done"],
  ["deposit", "done"],
  ["content", "done"],
  ["build", "done"],
  ["review", "active"],
  ["launch", "pending"],
] as const;

const WHAT_WE_BUILD_CARDS = [
  { key: "webApps",    href: "/custom-web-apps",  event: "cta_home_card_web_apps"   },
  { key: "portals",    href: "/client-portals",   event: "cta_home_card_portals"    },
  { key: "automation", href: "/systems",           event: "cta_home_card_automation" },
  { key: "websites",   href: "/websites",          event: "cta_home_card_websites"   },
  { key: "ecommerce",  href: "/ecommerce",         event: "cta_home_card_ecommerce"  },
  { key: "rescue",     href: "/website-rescue",    event: "cta_home_card_rescue"     },
] as const;

const LOW_TICKET_KEYS = new Set(["websites", "ecommerce", "rescue"]);

const START_HERE_CARDS = [
  { key: "website",   href: "/websites"        },
  { key: "app",       href: "/custom-web-apps" },
  { key: "portal",    href: "/client-portals"  },
  { key: "rescue",    href: "/website-rescue"  },
  { key: "ecommerce", href: "/ecommerce"       },
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

  const proofItems = [
    { value: t("proof.deliveryValue"), label: t("proof.delivery") },
    { value: t("proof.ownershipValue"), label: t("proof.ownership") },
    { value: t("proof.noUpfrontValue"), label: t("proof.noUpfront") },
    { value: t("proof.workspaceValue"), label: t("proof.workspace") },
  ];

  const howSteps = [
    { phase: t("how.step1Phase"), title: t("how.step1Title"), body: t("how.step1Body") },
    { phase: t("how.step2Phase"), title: t("how.step2Title"), body: t("how.step2Body") },
    { phase: t("how.step3Phase"), title: t("how.step3Title"), body: t("how.step3Body") },
  ];

  return (
    <main className={styles.page}>
      <ScrollReveal />

      <header className={`${styles.hero} heroFadeUp`}>
        <div className="container">
          <p className={styles.heroLabel}>{t("heroLabel")}</p>
          <h1 className={styles.heroTitle}>
            {t.rich("heroTitle", { em: (chunks) => <span>{chunks}</span> })}
          </h1>
          <p className={styles.heroSub}>{t("heroSub")}</p>

          <div className={styles.heroActions}>
            <TrackLink href="/build/intro" event="cta_home_hero_quote" className="btn btnPrimary">
              {t("ctaStart")} <span className="btnArrow">-&gt;</span>
            </TrackLink>
            <TrackLink href="/work" event="cta_home_hero_work" className={styles.heroSecondaryCta}>
              {t("ctaProcess")}
            </TrackLink>
          </div>
          <p className={styles.heroScarcity}>{t("ctaScarcity")}</p>
        </div>
      </header>

      <section className={styles.proof}>
        <div className={`container ${styles.proofGrid}`}>
          {proofItems.map((item) => (
            <article key={item.label} className={styles.proofItem}>
              <p className={styles.proofValue}>{item.value}</p>
              <p className={styles.proofLabel}>{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.startHere}>
        <div className="container">
          <p className={styles.sectionLabel}>{t("startHere.label")}</p>
          <div className={styles.startHereGrid}>
            {START_HERE_CARDS.map((card) => (
              <Link key={card.key} href={card.href} className={styles.startHereCard}>
                <p className={styles.startHereSituation}>{t(`startHere.${card.key}.situation`)}</p>
                <p className={styles.startHereService}>{t(`startHere.${card.key}.service`)}</p>
                <span className={styles.startHereArrow} aria-hidden>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="what-we-build" className={`${styles.whatWeBuild} fadeUp`}>
        <div className="container">
          <div className={styles.whatWeBuildHead}>
            <p className={styles.sectionLabel}>{t("whatWeBuild.label")}</p>
            <h2 className={styles.sectionTitle}>{t("whatWeBuild.title")}</h2>
          </div>
          <div className={styles.whatWeBuildGrid}>
            {WHAT_WE_BUILD_CARDS.map((card) => (
              <TrackLink
                key={card.key}
                href={card.href}
                event={card.event}
                className={styles.wbCard}
              >
                <h3 className={styles.wbCardTitle}>{t(`whatWeBuild.cards.${card.key}.title`)}</h3>
                <p className={styles.wbCardBody}>{t(`whatWeBuild.cards.${card.key}.body`)}</p>
                {LOW_TICKET_KEYS.has(card.key) && (
                  <span className={styles.wbCardBadge}>{t(`whatWeBuild.cards.${card.key}.badge`)}</span>
                )}
                <span className={styles.wbCardArrow} aria-hidden>-&gt;</span>
              </TrackLink>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.ventures} fadeUp`}>
        <div className="container">
          <div className={styles.venturesHead}>
            <p className={styles.venturesLabel}>{t("ventures.label")}</p>
            <h2 className={styles.venturesTitle}>{t("ventures.title")}</h2>
            <p className={styles.venturesIntro}>{t("ventures.intro")}</p>
          </div>
          <div className={styles.venturesGrid}>
            <article className={styles.ventureCard}>
              <p className={styles.ventureName}>{t("ventures.fleiko.name")}</p>
              <p className={styles.ventureTagline}>{t("ventures.fleiko.tagline")}</p>
              <p className={styles.ventureDetail}>{t("ventures.fleiko.detail")}</p>
              <div className={styles.ventureChips}>
                <span className={styles.ventureChip}>{t("ventures.fleiko.chip1")}</span>
                <span className={styles.ventureChip}>{t("ventures.fleiko.chip2")}</span>
              </div>
              <a
                href={t("ventures.fleiko.url")}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ventureLink}
              >
                {t("ventures.fleiko.link")} -&gt;
              </a>
            </article>
            <article className={styles.ventureCard}>
              <p className={styles.ventureName}>{t("ventures.proveo.name")}</p>
              <p className={styles.ventureTagline}>{t("ventures.proveo.tagline")}</p>
              <p className={styles.ventureDetail}>{t("ventures.proveo.detail")}</p>
              <div className={styles.ventureChips}>
                <span className={styles.ventureChip}>{t("ventures.proveo.chip1")}</span>
                <span className={styles.ventureChip}>{t("ventures.proveo.chip2")}</span>
              </div>
              <a
                href={t("ventures.proveo.url")}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ventureLink}
              >
                {t("ventures.proveo.link")} -&gt;
              </a>
            </article>
          </div>
          <p className={styles.venturesCta}>
            <TrackLink href="/work" event="cta_home_ventures_work" className={styles.venturesCtaLink}>
              {t("ventures.cta")} -&gt;
            </TrackLink>
          </p>
        </div>
      </section>

      <section className={`${styles.diff} fadeUp`}>
        <div className="container">
          <div className={styles.diffHead}>
            <div>
              <p className={styles.sectionLabel}>{t("diff.label")}</p>
              <h2 className={styles.sectionTitle}>{t("diff.title")}</h2>
            </div>
            <p className={styles.diffLede}>{t("diff.lede")}</p>
          </div>

          <div className={styles.portalFrame}>
            <div className={styles.portalHead}>
              <p className={styles.portalKicker}>{t("diff.kicker")}</p>
              <p className={styles.portalUrl}>{t("diff.url")}</p>
            </div>

            <div className={styles.portalHero}>
              <div>
                <p className={styles.portalEyebrow}>{t("diff.eyebrow")}</p>
                <h3>
                  {t.rich("diff.ready", { em: (chunks) => <em>{chunks}</em> })}
                </h3>
              </div>

              <TrackLink href="/demos/portal" event="cta_home_portal_preview" className={styles.portalCta}>
                {t("diff.openPreview")} -&gt;
              </TrackLink>
            </div>

            <div className={styles.journey}>
              {JOURNEY_KEYS.map(([key, state]) => (
                <div
                  key={key}
                  className={`${styles.jstep} ${
                    state === "done"
                      ? styles.jstepDone
                      : state === "active"
                        ? styles.jstepActive
                        : ""
                  }`}
                >
                  <span className={styles.jdot} />
                  <span className={styles.jname}>{t(`diff.journey.${key}`)}</span>
                </div>
              ))}
            </div>

            <div className={styles.portalCards}>
              <article className={styles.portalCard}>
                <p className={styles.portalCardTitle}>{t("diff.currentMilestone")}</p>
                <p className={styles.portalCardValue}>{t("diff.currentMilestoneValue")}</p>
                <p className={styles.portalCardMeta}>{t("diff.currentMilestoneMeta")}</p>
              </article>
              <article className={styles.portalCard}>
                <p className={styles.portalCardTitle}>{t("diff.deposit")}</p>
                <p className={styles.portalCardValue}>{t("diff.depositValue")}</p>
                <p className={styles.portalCardMeta}>{t("diff.depositMeta")}</p>
              </article>
              <article className={styles.portalCard}>
                <p className={styles.portalCardTitle}>{t("diff.launchTarget")}</p>
                <p className={styles.portalCardValue}>{t("diff.launchTargetValue")}</p>
                <p className={styles.portalCardMeta}>{t("diff.launchTargetMeta")}</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.how} fadeUp`}>
        <div className="container">
          <div className={styles.howHead}>
            <p className={styles.sectionLabel}>{t("how.label")}</p>
            <h2 className={styles.sectionTitle}>{t("how.title")}</h2>
          </div>

          <div className={styles.howSteps}>
            {howSteps.map((step) => (
              <article key={step.phase} className={styles.howStep}>
                <p className={styles.howStepNum}>{step.phase}</p>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.founder} fadeUp`}>
        <div className="container">
          <div className={styles.founderInner}>
            <div className={styles.founderPhotoWrap}>
              <Image
                src="/about/komlan.jpg"
                alt="Komlan Kouhiko, founder of CrecyStudio"
                width={220}
                height={220}
                className={styles.founderImg}
              />
            </div>
            <div className={styles.founderContent}>
              <p className={styles.sectionLabel}>{t("founder.label")}</p>
              <h2 className={styles.founderName}>{t("founder.name")}</h2>
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

      <section className={`${styles.closing} fadeUp`}>
        <div className="container">
          <p className={styles.sectionLabel}>{t("closing.label")}</p>
          <h2>
            {t.rich("closing.title", { em: (chunks) => <em>{chunks}</em> })}
          </h2>
          <div className={styles.closingActions}>
            <TrackLink href="/start" event="cta_home_closing_start" className="btn btnPrimary">
              {t("closing.cta")} <span className="btnArrow">-&gt;</span>
            </TrackLink>
            <TrackLink href="/build/intro" event="cta_home_closing_estimate" className="btn">
              {t("closing.ctaSecondary")} <span className="btnArrow">-&gt;</span>
            </TrackLink>
          </div>
          <p className={styles.closingPricingLink}>
            <TrackLink href="/pricing" event="cta_home_closing_pricing">
              {t("closing.ctaPricing")}
            </TrackLink>
          </p>
        </div>
      </section>

    </main>
  );
}
