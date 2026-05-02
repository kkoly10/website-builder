import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ServicePage from "@/components/service-page/ServicePage";
import { getServicePageData } from "@/lib/service-pages";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesMeta.carePlans" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function CarePlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = getServicePageData(locale, "care_plans");
  return <ServicePage {...data} />;
}
