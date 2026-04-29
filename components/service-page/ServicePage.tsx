import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./service-page.module.css";

type CTA = {
  label: string;
  href: string;
};

type CrossLink = {
  // id maps to the crossLinks.{id} dictionary entry. Letting the component
  // own the label lookup keeps service-pages.ts free of locale concerns
  // for cross-references.
  id: "websites" | "ecommerce" | "systems";
  href: string;
};

type PricingCard = {
  label: string;
  value: string;
  detail: string;
};

type IncludeGroup = {
  title: string;
  items: string[];
};

type ProcessStep = {
  step: string;
  title: string;
  detail: string;
};

type FAQ = {
  question: string;
  answer: string;
};

export type ServicePageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  heroImage: string;
  heroAlt: string;
  heroStats: string[];
  primaryCta: CTA;
  secondaryCta: CTA;
  whoItsForTitle: string;
  whoItsFor: string[];
  problemsTitle: string;
  problems: string[];
  includesTitle: string;
  includes: IncludeGroup[];
  pricingTitle: string;
  pricingIntro: string;
  pricingCards: PricingCard[];
  processTitle: string;
  processIntro: string;
  process: ProcessStep[];
  faqTitle: string;
  faqs: FAQ[];
  bestFitTitle: string;
  bestFit: string[];
  notFitTitle: string;
  notFit: string[];
  crossLinks: CrossLink[];
  finalTitle: string;
  finalText: string;
  finalPrimaryCta: CTA;
  finalSecondaryCta: CTA;
};

export default function ServicePage({
  eyebrow,
  title,
  intro,
  heroStats,
  primaryCta,
  secondaryCta,
  whoItsForTitle,
  whoItsFor,
  problemsTitle,
  problems,
  includesTitle,
  includes,
  pricingTitle,
  pricingIntro,
  pricingCards,
  processTitle,
  processIntro,
  process,
  faqTitle,
  faqs,
  bestFitTitle,
  bestFit,
  notFitTitle,
  notFit,
  crossLinks,
  finalTitle,
  finalText,
  finalPrimaryCta,
  finalSecondaryCta,
}: ServicePageProps) {
  const t = useTranslations("servicePage");
  const tCross = useTranslations("crossLinks");
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1 className={styles.heroTitle}>{title}</h1>
            <p className={styles.heroIntro}>{intro}</p>

            <div className={styles.heroActions}>
              <Link href={primaryCta.href} className={styles.primaryButton}>
                {primaryCta.label}
              </Link>
              <Link href={secondaryCta.href} className={styles.secondaryButton}>
                {secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.proofBar}>
        <div className={`container ${styles.proofGrid}`}>
          {heroStats.map((item) => (
            <div key={item} className={styles.proofItem}>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={`container ${styles.fitSplit}`}>
          <article className={styles.fitCard}>
            <p className={styles.sectionLabel}>{t("goodFit")}</p>
            <h2 className={styles.sectionTitle}>{whoItsForTitle}</h2>
            <ul className={styles.markerList}>
              {whoItsFor.map((item) => (
                <li key={item}>
                  <span>+</span>
                  <p>{item}</p>
                </li>
              ))}
            </ul>

            <div className={styles.fitNote}>
              <p className={styles.fitNoteLabel}>{t("bestFit")}</p>
              <h3>{bestFitTitle}</h3>
              <ul className={styles.noteList}>
                {bestFit.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className={styles.notFitCard}>
            <p className={styles.sectionLabel}>{t("notFirstMove")}</p>
            <h2 className={styles.sectionTitle}>{notFitTitle}</h2>
            <ul className={styles.markerList}>
              {notFit.map((item) => (
                <li key={item}>
                  <span>-</span>
                  <p>{item}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{t("problemsLabel")}</p>
            <h2 className={styles.sectionTitle}>{problemsTitle}</h2>
          </div>

          <div className={styles.problemGrid}>
            {problems.map((item, index) => (
              <article key={item} className={styles.problemCard}>
                <p className={styles.problemIndex}>0{index + 1}</p>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{t("whatYouGet")}</p>
            <h2 className={styles.sectionTitle}>{includesTitle}</h2>
          </div>

          <div className={styles.includesGrid}>
            {includes.map((group) => (
              <article key={group.title} className={styles.includeCard}>
                <h3>{group.title}</h3>
                <ul className={styles.noteList}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.processBand}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.darkLabel}>{t("processLabel")}</p>
            <h2 className={styles.darkTitle}>{processTitle}</h2>
            <p className={styles.darkIntro}>{processIntro}</p>
          </div>

          <div className={styles.processGrid}>
            {process.map((item) => (
              <article key={item.step} className={styles.processCard}>
                <p className={styles.processStep}>{item.step}</p>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.pricingSection}`}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{t("pricingLabel")}</p>
            <h2 className={styles.sectionTitle}>{pricingTitle}</h2>
            <p className={styles.sectionIntro}>{pricingIntro}</p>
          </div>

          <div className={styles.pricingGrid}>
            {pricingCards.map((card, index) => (
              <article key={card.label} className={styles.pricingCard}>
                <p className={styles.pricingLabel}>{card.label}</p>
                <p className={styles.pricingValue}>{card.value}</p>
                <p className={styles.pricingDetail}>{card.detail}</p>
                <div className={styles.pricingMeta}>
                  {index === 1 ? t("mostCommon") : t("scopedToProject")}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{t("faqLabel")}</p>
            <h2 className={styles.sectionTitle}>{faqTitle}</h2>
          </div>

          <div className={styles.faqGrid}>
            {faqs.map((faq) => (
              <article key={faq.question} className={styles.faqCard}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.finalCard}>
            <p className={styles.sectionLabel}>{t("readyToMove")}</p>
            <h2 className={styles.finalTitle}>{finalTitle}</h2>
            <p className={styles.sectionIntro}>{finalText}</p>

            <div className={styles.heroActions}>
              <Link href={finalPrimaryCta.href} className={styles.primaryButton}>
                {finalPrimaryCta.label}
              </Link>
              <Link href={finalSecondaryCta.href} className={styles.secondaryButton}>
                {finalSecondaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.alsoStrip}>
        <div className={`container ${styles.alsoGrid}`}>
          <p className={styles.sectionLabel}>{t("alsoOffered")}</p>
          <div className={styles.crossLinks}>
            {crossLinks.map((link) => (
              <article key={link.href} className={styles.crossLinkCard}>
                <h3>{tCross(link.id)}</h3>
                <Link href={link.href}>{t("exploreLane")} -&gt;</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
