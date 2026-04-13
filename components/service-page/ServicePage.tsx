import Image from "next/image";
import Link from "next/link";
import styles from "./service-page.module.css";

type CTA = {
  label: string;
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

type ServicePageProps = {
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
  crossLinks: CTA[];
  finalTitle: string;
  finalText: string;
  finalPrimaryCta: CTA;
  finalSecondaryCta: CTA;
};

export default function ServicePage({
  eyebrow,
  title,
  intro,
  heroImage,
  heroAlt,
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
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay} />
        </div>

        <div className={styles.shell}>
          <div className={styles.heroContent}>
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

            <div className={styles.heroStats}>
              {heroStats.map((stat) => (
                <span key={stat} className={styles.statPill}>
                  {stat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.fitSplit}>
            <article className={styles.fitPanel}>
              <p className={styles.sectionLabel}>Who this is for</p>
              <h2 className={styles.sectionTitle}>{whoItsForTitle}</h2>
              <ul className={styles.list}>
                {whoItsFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3 className={styles.fitSubheading}>{bestFitTitle}</h3>
              <ul className={styles.list}>
                {bestFit.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className={styles.notFitPanel}>
              <p className={styles.sectionLabel}>Probably not first move</p>
              <h2 className={styles.sectionTitle}>{notFitTitle}</h2>
              <ul className={styles.list}>
                {notFit.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <p className={styles.sectionLabel}>Problems we solve</p>
          <h2 className={styles.sectionHeading}>{problemsTitle}</h2>
          <div className={styles.problemGrid}>
            {problems.map((item, index) => (
              <article key={item} className={styles.problemCard}>
                <span className={styles.problemIndex}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className={styles.cardText}>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <p className={styles.sectionLabel}>What’s included</p>
          <h2 className={styles.sectionHeading}>{includesTitle}</h2>
          <div className={styles.gridThree}>
            {includes.map((group) => (
              <article key={group.title} className={styles.card}>
                <h3 className={styles.cardTitle}>{group.title}</h3>
                <ul className={styles.list}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.darkBand}>
        <div className={styles.shell}>
          <div className={styles.pricingHeader}>
            <div>
              <p className={styles.darkLabel}>How it works</p>
              <h2 className={styles.sectionHeading}>{processTitle}</h2>
            </div>
            <p className={styles.sectionText}>{pricingIntro}</p>
          </div>
          <div className={styles.processGrid}>
            {process.map((item) => (
              <article key={item.step} className={styles.processCard}>
                <span className={styles.stepBadge}>{item.step}</span>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardText}>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.pricingHeader}>
            <div>
              <p className={styles.sectionLabel}>Pricing approach</p>
              <h2 className={styles.sectionHeading}>{pricingTitle}</h2>
            </div>
            <p className={styles.sectionText}>{processIntro}</p>
          </div>
          <div className={styles.gridThree}>
            {pricingCards.map((card) => (
              <article key={card.label} className={styles.pricingCard}>
                <p className={styles.priceLabel}>{card.label}</p>
                <p className={styles.priceValue}>{card.value}</p>
                <p className={styles.priceDetail}>{card.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <p className={styles.sectionLabel}>Frequently asked questions</p>
          <h2 className={styles.sectionHeading}>{faqTitle}</h2>

          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <article key={faq.question} className={styles.faqRow}>
                <p className={styles.faqIndex}>{String(index + 1).padStart(2, "0")}</p>
                <div>
                  <h3 className={styles.faqQuestion}>{faq.question}</h3>
                  <p className={styles.faqAnswer}>{faq.answer}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.card}>
            <p className={styles.sectionLabel}>Compare services</p>
            <h2 className={styles.sectionHeading}>Need the right lane first?</h2>
            <div className={styles.crossLinks}>
              {crossLinks.map((link) => (
                <Link key={link.href} href={link.href} className={styles.crossLink}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.finalCta}>
            <div>
              <p className={styles.sectionLabel}>Ready to move?</p>
              <h2 className={styles.finalTitle}>{finalTitle}</h2>
              <p className={styles.finalText}>{finalText}</p>
            </div>

            <div className={styles.finalActions}>
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
    </main>
  );
}
