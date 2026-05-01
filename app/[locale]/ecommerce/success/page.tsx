import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import RawLink from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ecomSuccess" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function EcommerceSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ecomIntakeId?: string; callRequestId?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  return <EcommerceSuccessContent ecomIntakeId={sp.ecomIntakeId} callRequestId={sp.callRequestId} />;
}

function EcommerceSuccessContent({
  ecomIntakeId,
  callRequestId,
}: {
  ecomIntakeId?: string;
  callRequestId?: string;
}) {
  const t = useTranslations("ecomSuccess");

  return (
    <main className="container" style={{ paddingBottom: 80 }}>
      <section className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="card">
          <div className="cardInner" style={{ textAlign: "center", padding: "40px 30px" }}>
            <div className="kicker">{t("kicker")}</div>
            <h1 className="h1" style={{ marginTop: 10 }}>{t("title")}</h1>
            <p className="pDark">
              {t("bodyPrefix")} {t("intakeIdLabel")}{" "}
              <strong>{ecomIntakeId?.slice(0, 8) || t("emptyId")}</strong>{" "}
              • {t("callIdLabel")}{" "}
              <strong>{callRequestId?.slice(0, 8) || t("emptyId")}</strong>
            </p>
            <p className="pDark" style={{ marginTop: 8 }}>{t("whatNext")}</p>
            <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/pricing#ecommerce" className="btn btnGhost">{t("ctaPricing")}</Link>
              {/* /portal lives outside [locale] — render with raw next/link so /fr/portal isn't generated. */}
              <RawLink href="/portal" className="btn btnPrimary">{t("ctaPortal")}</RawLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
