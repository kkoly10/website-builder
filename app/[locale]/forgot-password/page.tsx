import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";
import ConversionShell from "@/components/site/ConversionShell";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.forgotPassword" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<ForgotLoadingCard />}>
      <ForgotPasswordClient />
    </Suspense>
  );
}

function ForgotLoadingCard() {
  const t = useTranslations("auth.forgotPassword");
  return <ConversionShell kicker={t("loadingKicker")} title={t("title")} />;
}
