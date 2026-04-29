import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import SignupClient from "./SignupClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.signup" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="container" style={{ padding: "80px 0", maxWidth: 440, margin: "0 auto" }}>
      <Suspense fallback={<SignupLoadingCard />}>
        <SignupClient />
      </Suspense>
    </main>
  );
}

function SignupLoadingCard() {
  const t = useTranslations("auth.signup");
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
