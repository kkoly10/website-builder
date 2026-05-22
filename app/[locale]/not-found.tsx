import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notFound");
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="container" style={{ padding: "80px 0", textAlign: "center" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio
      </div>

      <div style={{ height: 16 }} />

      <h1 className="h1">{t("h1")}</h1>
      <p className="p" style={{ maxWidth: 500, margin: "12px auto 0" }}>
        {t("body")}
      </p>

      <div style={{ height: 28 }} />

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" className="btn btnPrimary">
          {t("backHome")} <span className="btnArrow">&#8594;</span>
        </Link>
        <Link href="/contact" className="btn btnGhost">
          {t("contactUs")}
        </Link>
      </div>
    </main>
  );
}
