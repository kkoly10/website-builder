import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import LoginClient from "./LoginClient";
import ConversionShell from "@/components/site/ConversionShell";

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
    <Suspense fallback={<LoginLoadingCard />}>
      <LoginClient />
    </Suspense>
  );
}

function LoginLoadingCard() {
  const t = useTranslations("auth.login");
  return <ConversionShell kicker={t("loadingKicker")} title={t("loadingTitle")} />;
}
