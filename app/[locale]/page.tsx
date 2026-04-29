import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
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

const TIER_KEYS = ["starter", "growth", "premium"] as const;
const FEATURE_COUNT = 5;
const JOURNEY_KEYS = [
  ["intake", "done"],
  ["agreement", "done"],
  ["deposit", "done"],
  ["content", "done"],
  ["build", "done"],
  ["review", "active"],
  ["launch", "pending"],
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

  const tiers = TIER_KEYS.map((key) => ({
    key,
    name: t(`tiers.${key}.name`),
    price: t(`tiers.${key}.price`),
    desc: t(`tiers.${key}.desc`),
    features: Array.from(
      { length: FEATURE_COUNT },
      (_, i) => t(`tiers.${key}.f${i + 1}`)
    ),
    featured: key === "growth",
  }));

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
            <TrackLink href="/process" event="cta_home_hero_process" className={styles.heroSecondaryCta}>
              {t("ctaProcess")}
            </TrackLink>
          </div>
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

              <TrackLink href="/portal" event="cta_home_portal_preview" className={styles.portalCta}>
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

      <section className={`${styles.pricing} fadeUp`}>
        <div className="container">
          <div className={styles.pricingHead}>
            <div>
              <p className={styles.sectionLabel}>{t("tiers.label")}</p>
              <h2 className={styles.sectionTitle}>{t("tiers.title")}</h2>
            </div>
            <p className={styles.pricingLede}>{t("tiers.lede")}</p>
          </div>

          <div className={styles.tiers}>
            {tiers.map((tier) => (
              <article
                key={tier.key}
                className={`${styles.tier} ${tier.featured ? styles.tierFeatured : ""}`}
              >
                <p className={styles.tierName}>{tier.name}</p>
                <p className={styles.tierPrice}>{tier.price}</p>
                <p className={styles.tierDesc}>{tier.desc}</p>
                <ul>
                  {tier.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <TrackLink
                  href="/build/intro"
                  event="cta_home_pricing_quote"
                  className={styles.tierCta}
                >
                  {t("tiers.ctaQuote")}
                </TrackLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.closing} fadeUp`}>
        <div className="container">
          <p className={styles.sectionLabel}>{t("closing.label")}</p>
          <h2>
            {t.rich("closing.title", { em: (chunks) => <em>{chunks}</em> })}
          </h2>
          <TrackLink href="/build/intro" event="cta_home_closing_quote" className="btn btnPrimary">
            {t("closing.cta")} <span className="btnArrow">-&gt;</span>
          </TrackLink>
        </div>
      </section>

      <section className={`${styles.also} fadeUp`}>
        <div className={`container ${styles.alsoGrid}`}>
          <p className={styles.sectionLabel}>{t("also.label")}</p>
          <div className={styles.lanes}>
            <article className={styles.lane}>
              <h3>{t("also.systemsTitle")}</h3>
              <p>{t("also.systemsBody")}</p>
              <TrackLink href="/systems" event="cta_home_secondary_systems" className={styles.laneLink}>
                {t("also.systemsLink")} -&gt;
              </TrackLink>
            </article>

            <article className={styles.lane}>
              <h3>{t("also.ecomTitle")}</h3>
              <p>{t("also.ecomBody")}</p>
              <TrackLink href="/ecommerce" event="cta_home_secondary_ecom" className={styles.laneLink}>
                {t("also.ecomLink")} -&gt;
              </TrackLink>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
