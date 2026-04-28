"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import type { EstimatePresentation } from "@/lib/estimatePresentation";

type Props = {
  view: EstimatePresentation | null;
};

function money(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "Scoped after review";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildPriceDisplay(view: EstimatePresentation) {
  if (view.variant === "deep") {
    return `${money(view.price.min)} - ${money(view.price.max)}`;
  }

  return money(view.price.target);
}

export default function EstimateClient({ view }: Props) {
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");

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
        throw new Error(json?.error || "Unable to create the deposit session.");
      }

      window.location.href = String(json.depositUrl);
    } catch (error) {
      setAcceptError(error instanceof Error ? error.message : "Unable to create the deposit session.");
      setAccepting(false);
    }
  }

  if (!view) {
    return (
      <main className="container estimateEmpty">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          CrecyStudio · Estimate
        </div>
        <div style={{ height: 12 }} />
        <h1 className="h2">We could not find that quote.</h1>
        <p className="p maxW860">
          Open the estimate link from your email, sign in with the same email you used on the intake,
          or start a fresh website quote if you need to rebuild the scope.
        </p>
        <div className="estimateEmptyActions">
          <Link href="/build/intro" className="btn btnPrimary">
            Start a website quote <span className="btnArrow">-&gt;</span>
          </Link>
          <Link href="/portal" className="btn btnGhost">
            Client portal
          </Link>
          <Link href="/" className="btn btnGhost">
            Home
          </Link>
        </div>
      </main>
    );
  }

  const priceDisplay = buildPriceDisplay(view);
  const showRange = view.variant === "deep";
  const showAccept = !!view.acceptLabel;
  const primarySchedule = view.variant !== "fast" && view.callToBook;

  return (
    <main className="estimatePage">
      <div className="container estimateBreadcrumb">
        <span>Your project</span>
        <span className="estimateBreadcrumbSep">/</span>
        <span className="estimateBreadcrumbAccent">Estimate for {view.businessName}</span>
      </div>

      <header className="estimateHero">
        <div className="container">
          <div className="estimateHeroLabel">Your personalized estimate</div>
          <h1 className="estimateHeroTitle">{view.heroTitle}</h1>
          <p className="estimateHeroBody">{view.heroBody}</p>
          {view.heroMeta ? <p className="estimateHeroMeta">{view.heroMeta}</p> : null}
        </div>
      </header>

      <section className="estimateModule">
        <div className="container">
          <div className="estimateSectionLabel">Your project</div>
          <h2 className="estimateSectionTitle">Scope and investment</h2>
          <p className="estimateSectionBody">{view.investmentIntro}</p>

          <div className="estimateScopeGrid">
            <article className="estimateScopeCard">
              <h3>What we&apos;ll build</h3>
              <div className="estimateScopeRows">
                {view.scopeRows.map((row) => (
                  <div className="estimateScopeRow" key={row.label}>
                    <div className="estimateScopeKey">{row.label}</div>
                    <div className="estimateScopeValue">
                      {row.value}
                      {view.scopeCaveat ? <span className="estimateScopeCaveatInline"> · To be confirmed</span> : null}
                    </div>
                  </div>
                ))}
              </div>
              {view.scopeCaveat ? <p className="estimateScopeCaveat">{view.scopeCaveat}</p> : null}
            </article>

            <div className="estimatePriceRail">
              {view.contextNote ? (
                <aside className="estimateContextCard">
                  <div className="estimateContextLabel">Before you commit</div>
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
                  {showRange ? "Likely investment" : "Project investment"}
                </div>
                <div className="estimatePriceAmount">{priceDisplay}</div>
                <p className="estimatePriceMeta">{view.price.priceNote}</p>

                {showRange ? (
                  <div className="estimatePriceRangeNote">
                    We&apos;ll confirm the final fixed quote on the call before any deposit is taken.
                  </div>
                ) : (
                  <div className="estimatePriceSplit">
                    <div>
                      <div className="estimateSplitLabel">Deposit today</div>
                      <div className="estimateSplitValue estimateSplitValueAccent">
                        {money(view.price.deposit)}
                      </div>
                    </div>
                    <div>
                      <div className="estimateSplitLabel">Balance at launch</div>
                      <div className="estimateSplitValue">{money(view.price.balance)}</div>
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
                      {accepting ? "Creating secure checkout..." : view.acceptLabel}{" "}
                      <span className="estimateButtonArrow">-&gt;</span>
                    </button>
                  ) : null}

                  <div className="estimateFineprint">
                    {primarySchedule ? primarySchedule.helper : "Secure payment via Stripe"}
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
          <div className="estimateSectionLabel">What happens next</div>
          <h2 className="estimateSectionTitle">
            {view.variant === "deep"
              ? "From alignment call to fixed scope."
              : view.variant === "warm"
              ? "A quick call, then a clean kickoff."
              : "From accept to launch."}
          </h2>
          <p className="estimateSectionBody">
            {view.variant === "deep"
              ? "We use the call to remove ambiguity first, then we move into kickoff with the fixed quote everyone understands."
              : "The next steps stay visible the whole way through so the project never disappears into email and guesswork."}
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
              <div className="estimateSectionLabel">For context</div>
              <h2 className="estimateSectionTitle">How we tier projects.</h2>
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
                {accepting ? "Creating secure checkout..." : view.acceptLabel}{" "}
                <span className="estimateButtonArrow">-&gt;</span>
              </button>
            ) : null}

            {view.messageUrl ? (
              <Link className="estimateGhostButton estimateClosingButton" href={view.messageUrl}>
                Message us with questions
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
