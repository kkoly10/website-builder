import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.resetPassword" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="container">
      <section className="section">
        <Suspense fallback={<ResetLoadingCard />}>
          <ResetPasswordClient />
        </Suspense>
      </section>
    </main>
  );
}

function ResetLoadingCard() {
  const t = useTranslations("auth.resetPassword");
  return (
    <div className="card">
      <div className="cardInner">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          {t("loadingKicker")}
        </div>
      </div>
    </div>
  );
}
