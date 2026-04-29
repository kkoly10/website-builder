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
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactContent />;
}

function ContactContent() {
  const t = useTranslations("contact");

  return (
    <SupportPageShell
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      ctas={[
        { href: "/terms", label: t("ctaTerms") },
        { href: "/portal", label: t("ctaPortal"), variant: "ghost", raw: true },
      ]}
    >
      <section className="grid2stretch marketingStackLg">
        <article className="card">
          <div className="cardInner">
            <h2 className="h3">{t("primaryHeading")}</h2>
            <p className="pDark">{t("emailLabel")}</p>
            <p className="p">
              <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
            </p>
          </div>
        </article>

        <article className="card">
          <div className="cardInner">
            <h2 className="h3">{t("topicsHeading")}</h2>
            <ul className="serviceCardList">
              <li>{t("topic1")}</li>
              <li>{t("topic2")}</li>
              <li>{t("topic3")}</li>
              <li>{t("topic4")}</li>
            </ul>
          </div>
        </article>
      </section>
    </SupportPageShell>
  );
}
