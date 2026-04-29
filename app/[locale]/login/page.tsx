import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="container" style={{ padding: "80px 0", maxWidth: 440, margin: "0 auto" }}>
      <Suspense fallback={<LoginLoadingCard />}>
        <LoginClient />
      </Suspense>
    </main>
  );
}

function LoginLoadingCard() {
  const t = useTranslations("auth.login");
  return (
    <div className="card">
      <div className="cardInner">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          {t("loadingKicker")}
        </div>
        <h1 className="h2">{t("loadingTitle")}</h1>
      </div>
    </div>
  );
}
