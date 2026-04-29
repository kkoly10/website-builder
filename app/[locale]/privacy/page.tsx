import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import SupportPageShell from "@/components/site/SupportPageShell";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyContent />;
}

function PrivacyContent() {
  const t = useTranslations("privacy");

  return (
    <SupportPageShell
      kicker={t("kicker")}
      title={t("title")}
      description={t("lastUpdated")}
      ctas={[
        { href: "mailto:hello@crecystudio.com", label: t("ctaContact") },
        { href: "/terms", label: t("ctaTerms"), variant: "ghost" },
      ]}
    >
      <section className="panel marketingStackLg">
        <div className="panelBody marketingBody">
          <p className="p">{t("intro")}</p>
          <div>
            <h2 className="h3">{t("collectHeading")}</h2>
            <ul className="serviceCardList">
              <li>{t("collect1")}</li>
              <li>{t("collect2")}</li>
              <li>{t("collect3")}</li>
            </ul>
          </div>
          <div>
            <h2 className="h3">{t("useHeading")}</h2>
            <ul className="serviceCardList">
              <li>{t("use1")}</li>
              <li>{t("use2")}</li>
              <li>{t("use3")}</li>
            </ul>
          </div>
          <div>
            <h2 className="h3">{t("rightsHeading")}</h2>
            <p className="p">
              {t("rightsBody")}{" "}
              <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>.
            </p>
          </div>
        </div>
      </section>
    </SupportPageShell>
  );
}
