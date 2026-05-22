import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("comingSoon");
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
