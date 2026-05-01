import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import EcommerceBookClient from "./EcommerceBookClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ecomBook" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function EcommerceBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await Promise.resolve(searchParams);
  const ecomIntakeId = pick(sp, "ecomIntakeId").trim();

  if (!ecomIntakeId) {
    return <MissingPanel />;
  }

  return <EcommerceBookClient ecomIntakeId={ecomIntakeId} />;
}

function MissingPanel() {
  const t = useTranslations("ecomBook.missing");

  return (
    <main className="container" style={{ paddingBottom: 80 }}>
      <section className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="card">
          <div className="cardInner" style={{ padding: 30 }}>
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              {t("kicker")}
            </div>

            <div style={{ height: 10 }} />
            <h1 className="h2">{t("title")}</h1>
            <p className="pDark">{t("body")}</p>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/ecommerce/intake" className="btn btnPrimary">
                {t("ctaStart")} <span className="btnArrow">→</span>
              </Link>
              <Link href="/" className="btn btnGhost">
                {t("ctaHome")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
