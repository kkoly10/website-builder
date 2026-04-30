"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { EstimatePresentation } from "@/lib/estimatePresentation";

type Props = {
  view: EstimatePresentation | null;
};

function money(value: number | null, fallback: string) {
  if (value == null || !Number.isFinite(value)) return fallback;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildPriceDisplay(view: EstimatePresentation, fallback: string) {
  if (view.variant === "deep") {
    return `${money(view.price.min, fallback)} - ${money(view.price.max, fallback)}`;
  }
  return money(view.price.target, fallback);
}

export default function EstimateClient({ view }: Props) {
  const t = useTranslations("estimate");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");

  // Fallback for when a price is null. Lib still emits "Scoped after review"
  // in some cases via view.price.priceNote etc. — translating those is part
  // of the lib refactor, not this PR. The fallback below covers the inline
  // money() call only.
  const moneyFallback = "—";

  async function onAccept() {
    if (!view?.acceptUrl) return;

    setAcceptError("");
    setAccepting(true);

    try {
      const response = await fetch(view.acceptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: view.quoteId,
          quoteToken: view.quoteToken || undefined,
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.depositUrl) {
        throw new Error(json?.error || t("depositError"));
      }

      window.location.href = String(json.depositUrl);
    } catch (error) {
      setAcceptError(error instanceof Error ? error.message : t("depositError"));
      setAccepting(false);
    }
  }

  if (!view) {
    return (
      <main className="container estimateEmpty">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          {t("empty.kicker")}
        </div>
        <div style={{ height: 12 }} />
        <h1 className="h2">{t("empty.title")}</h1>
        <p className="p maxW860">{t("empty.body")}</p>
        <div className="estimateEmptyActions">
          <Link href="/build/intro" className="btn btnPrimary">
            {t("empty.ctaQuote")} <span className="btnArrow">-&gt;</span>
          </Link>
          <Link href="/portal" className="btn btnGhost">
            {t("empty.ctaPortal")}
          </Link>
          <Link href="/" className="btn btnGhost">
            {t("empty.ctaHome")}
          </Link>
        </div>
      </main>
    );
  }

  const priceDisplay = buildPriceDisplay(view, moneyFallback);
  const showRange = view.variant === "deep";
  const showAccept = !!view.acceptLabel;
  const primarySchedule = view.variant !== "fast" && view.callToBook;

  return (
    <main className="estimatePage">
      <div className="container estimateBreadcrumb">
        <span>{t("breadcrumb")}</span>
        <span className="estimateBreadcrumbSep">/</span>
        <span className="estimateBreadcrumbAccent">{t("breadcrumbFor", { name: view.businessName })}</span>
      </div>

      <header className="estimateHero">
        <div className="container">
          <div className="estimateHeroLabel">{t("heroLabel")}</div>
          <h1 className="estimateHeroTitle">{view.heroTitle}</h1>
          <p className="estimateHeroBody">{view.heroBody}</p>
          {view.heroMeta ? <p className="estimateHeroMeta">{view.heroMeta}</p> : null}
        </div>
      </header>

      <section className="estimateModule">
        <div className="container">
          <div className="estimateSectionLabel">{t("investmentSectionLabel")}</div>
          <h2 className="estimateSectionTitle">{t("investmentSectionTitle")}</h2>
          <p className="estimateSectionBody">{view.investmentIntro}</p>

          <div className="estimateScopeGrid">
            <article className="estimateScopeCard">
              <h3>{t("scopeCardTitle")}</h3>
              <div className="estimateScopeRows">
                {view.scopeRows.map((row) => (
                  <div className="estimateScopeRow" key={row.label}>
                    <div className="estimateScopeKey">{row.label}</div>
                    <div className="estimateScopeValue">
                      {row.value}
                      {view.scopeCaveat ? <span className="estimateScopeCaveatInline"> {t("scopeCaveatInline")}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
              {view.scopeCaveat ? <p className="estimateScopeCaveat">{view.scopeCaveat}</p> : null}
            </article>

            <div className="estimatePriceRail">
              {view.contextNote ? (
                <aside className="estimateContextCard">
                  <div className="estimateContextLabel">{t("contextLabel")}</div>
                  <h3>{view.contextNote}</h3>
                  {view.contextDetails.length ? (
                    <ul className="estimateContextList">
                      {view.contextDetails.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  ) : null}
                </aside>
              ) : null}

              <article className="estimatePriceBlock">
                <div className="estimatePriceLabel">
                  {showRange ? t("priceLabelLikely") : t("priceLabelProject")}
                </div>
                <div className="estimatePriceAmount">{priceDisplay}</div>
                <p className="estimatePriceMeta">{view.price.priceNote}</p>

                {showRange ? (
                  <div className="estimatePriceRangeNote">
                    {t("priceRangeNote")}
                  </div>
                ) : (
                  <div className="estimatePriceSplit">
                    <div>
                      <div className="estimateSplitLabel">{t("depositLabel")}</div>
                      <div className="estimateSplitValue estimateSplitValueAccent">
                        {money(view.price.deposit, moneyFallback)}
                      </div>
                    </div>
                    <div>
                      <div className="estimateSplitLabel">{t("balanceLabel")}</div>
                      <div className="estimateSplitValue">{money(view.price.balance, moneyFallback)}</div>
                    </div>
                  </div>
                )}

                <div className="estimatePriceActions">
                  {primarySchedule ? (
                    <a
                      className="estimatePrimaryButton estimatePriceButton"
                      href={primarySchedule.url}
                      target={primarySchedule.external ? "_blank" : undefined}
                      rel={primarySchedule.external ? "noreferrer" : undefined}
                    >
                      {primarySchedule.label} <span className="estimateButtonArrow">-&gt;</span>
                    </a>
                  ) : null}

                  {showAccept ? (
                    <button
                      type="button"
                      className={primarySchedule ? "estimateSecondaryButton estimatePriceButton" : "estimatePrimaryButton estimatePriceButton"}
                      onClick={onAccept}
                      disabled={accepting}
                    >
                      {accepting ? t("creatingCheckout") : view.acceptLabel}{" "}
                      <span className="estimateButtonArrow">-&gt;</span>
                    </button>
                  ) : null}

                  <div className="estimateFineprint">
                    {primarySchedule ? primarySchedule.helper : t("stripeFineprint")}
                  </div>
                  {view.existingCallNote ? (
                    <div className="estimateExistingCallNote">{view.existingCallNote}</div>
                  ) : null}
                  {acceptError ? <div className="estimateActionError">{acceptError}</div> : null}
                </div>
              </article>
            </div>
          </div>

          <div className="estimateIncludedGrid">
            {view.included.map((column) => (
              <article key={column.id} className="estimateIncludedColumn">
                <div className="estimateIncludedLabel">{column.label}</div>
                <h3>{column.title}</h3>
                <ul>
                  {column.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="estimateProcessSection">
        <div className="container">
          <div className="estimateSectionLabel">{t("processSectionLabel")}</div>
          <h2 className="estimateSectionTitle">
            {view.variant === "deep"
              ? t("processTitleDeep")
              : view.variant === "warm"
              ? t("processTitleWarm")
              : t("processTitleFast")}
          </h2>
          <p className="estimateSectionBody">
            {view.variant === "deep" ? t("processBodyDeep") : t("processBodyDefault")}
          </p>

          <div className="estimateProcessGrid">
            {view.process.map((step) => (
              <article className="estimateProcessStep" key={step.label}>
                <div className="estimateProcessLabel">{step.label}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="estimateModule">
        <div className="container">
          <div className="estimateTierIntro">
            <div>
              <div className="estimateSectionLabel">{t("tierContextLabel")}</div>
              <h2 className="estimateSectionTitle">{t("tierContextTitle")}</h2>
            </div>
            <p className="estimateTierIntroBody">{view.tierIntro}</p>
          </div>

          <div className="estimateTierGrid">
            {view.tierCards.map((tier) => (
              <article
                key={tier.key}
                className={tier.current ? "estimateTierCard estimateTierCardCurrent" : "estimateTierCard"}
              >
                <div className="estimateTierName">/ {tier.name}</div>
                <div className="estimateTierRange">{tier.range}</div>
                <p className="estimateTierDetail">{tier.detail}</p>
                <div className="estimateTierMeta">{tier.meta}</div>
              </article>
            ))}
          </div>

          <div className="estimateFaqGrid">
            {view.faq.map((item) => (
              <article key={item.question} className="estimateFaqItem">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="estimateClosing">
        <div className="container estimateClosingInner">
          <div>
            <h2>{view.closing.title}</h2>
            <p>{view.closing.body}</p>
          </div>

          <div className="estimateClosingActions">
            {primarySchedule ? (
              <a
                className="estimatePrimaryButton estimateClosingButton"
                href={primarySchedule.url}
                target={primarySchedule.external ? "_blank" : undefined}
                rel={primarySchedule.external ? "noreferrer" : undefined}
              >
                {primarySchedule.label} <span className="estimateButtonArrow">-&gt;</span>
              </a>
            ) : null}

            {showAccept ? (
              <button
                type="button"
                className={primarySchedule ? "estimateSecondaryButton estimateClosingButton" : "estimatePrimaryButton estimateClosingButton"}
                onClick={onAccept}
                disabled={accepting}
              >
                {accepting ? t("creatingCheckout") : view.acceptLabel}{" "}
                <span className="estimateButtonArrow">-&gt;</span>
              </button>
            ) : null}

            {view.messageUrl ? (
              <Link className="estimateGhostButton estimateClosingButton" href={view.messageUrl}>
                {t("messageCta")}
              </Link>
            ) : null}

            <div className="estimateFineprint">{view.closing.fineprint}</div>
            {acceptError ? <div className="estimateActionError">{acceptError}</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
