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

// Maps the ?type=... URL param (English machine value) to the byType.* key
// in the contact namespace. Lets pages elsewhere (homepage cards, /work CTA)
// link to /contact?type=X and have this page acknowledge what they came for
// instead of showing a generic intro.
const TYPE_TO_KEY: Record<string, "webApp" | "portal" | "rescue"> = {
  web_app: "webApp",
  portal: "portal",
  rescue: "rescue",
};

type ContactTypeKey = "webApp" | "portal" | "rescue" | null;

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  const rawType = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  const typeKey: ContactTypeKey =
    typeof rawType === "string" && TYPE_TO_KEY[rawType] ? TYPE_TO_KEY[rawType] : null;
  setRequestLocale(locale);
  return <ContactContent typeKey={typeKey} />;
}

function ContactContent({ typeKey }: { typeKey: ContactTypeKey }) {
  const t = useTranslations("contact");
  const kicker = typeKey ? t(`byType.${typeKey}.kicker`) : t("kicker");
  const title = typeKey ? t(`byType.${typeKey}.title`) : t("title");
  const description = typeKey ? t(`byType.${typeKey}.description`) : t("description");
  const mailtoHref = typeKey
    ? `mailto:hello@crecystudio.com?subject=${encodeURIComponent(kicker)}`
    : "mailto:hello@crecystudio.com";

  return (
    <SupportPageShell
      kicker={kicker}
      title={title}
      description={description}
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
              <a href={mailtoHref}>hello@crecystudio.com</a>
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
