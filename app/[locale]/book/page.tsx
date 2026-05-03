import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import RawLink from "next/link";
import BookClient from "./BookClient";
import RecoverQuoteRedirect from "./RecoverQuoteRedirect";
import { markProposalViewed } from "@/lib/proposals";

export const dynamic = "force-dynamic";

type SearchParamsPromise = Promise<Record<string, string | string[] | undefined>>;

function pick(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function pickAny(sp: Record<string, string | string[] | undefined>, keys: string[]) {
  for (const k of keys) {
    const v = pick(sp, k).trim();
    if (v) return v;
  }
  return "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "book" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function BookPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParamsPromise;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const sp = await props.searchParams;

  const quoteId = pickAny(sp, ["quoteId", "quoteid", "qid", "id"]);
  const quoteToken = pickAny(sp, ["token", "quoteToken", "quote_token", "t"]);

  if (!quoteId) {
    return <BookMissingPanel />;
  }

  void markProposalViewed(quoteId).catch(() => {});

  return <BookClient quoteId={quoteId} quoteToken={quoteToken || undefined} />;
}

function BookMissingPanel() {
  const t = useTranslations("book.missing");

  return (
    <main className="container" style={{ padding: "28px 0 80px" }}>
      <RecoverQuoteRedirect />

      <section className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            {t("kicker")}
          </div>

          <div style={{ height: 10 }} />
          <h1 className="h2">{t("title")}</h1>

          <p className="p">{t("body")}</p>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn btnPrimary" href="/estimate">
              {t("ctaEstimate")} <span className="btnArrow">→</span>
            </Link>
            <Link className="btn btnGhost" href="/build">
              {t("ctaEdit")}
            </Link>
            {/* /portal lives outside [locale]; render with raw next/link so /fr/build does not prefix it */}
            <RawLink className="btn btnGhost" href="/portal">
              {t("ctaPortal")}
            </RawLink>
            <a
              href="mailto:hello@crecystudio.com?subject=Help%20finding%20my%20quote"
              className="btn btnGhost"
            >
              {t("ctaHelp")}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
