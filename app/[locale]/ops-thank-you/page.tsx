import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import RawLink from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "opsThankYou" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function OpsThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await Promise.resolve(searchParams);
  const opsIntakeId = pick(sp, "opsIntakeId");
  const callRequestId = pick(sp, "callRequestId");

  return <OpsThankYouContent opsIntakeId={opsIntakeId} callRequestId={callRequestId} />;
}

function OpsThankYouContent({
  opsIntakeId,
  callRequestId,
}: {
  opsIntakeId: string;
  callRequestId: string;
}) {
  const t = useTranslations("opsThankYou");
  const customerNext = "/";

  return (
    <main className="container">
      <section className="section">
        <div className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              {t("kicker")}
            </div>

            <div style={{ height: 10 }} />
            <h1 className="h2">{t("title")}</h1>

            <p className="p">{t("body")}</p>

            <div className="pills">
              {opsIntakeId ? (
                <span className="pill">
                  {t("intakePillPrefix")} {opsIntakeId.slice(0, 8)}…
                </span>
              ) : null}
              {callRequestId ? (
                <span className="pill">
                  {t("callPillPrefix")} {callRequestId.slice(0, 8)}…
                </span>
              ) : null}
            </div>

            <div className="card" style={{ marginTop: 14, background: "var(--paper-2)" }}>
              <div className="cardInner">
                <div style={{ fontWeight: 900, marginBottom: 8 }}>{t("createAccountCardTitle")}</div>
                <p className="p" style={{ marginTop: 0 }}>
                  {t("createAccountCardBody")}
                </p>

                <div className="heroActions">
                  <Link
                    href={`/signup?next=${encodeURIComponent(customerNext)}`}
                    className="btn btnPrimary"
                  >
                    {t("createAccountCta")} <span className="btnArrow">→</span>
                  </Link>

                  <Link
                    href={`/login?next=${encodeURIComponent(customerNext)}`}
                    className="btn btnGhost"
                  >
                    {t("signInCta")}
                  </Link>
                </div>
              </div>
            </div>

            <div className="heroActions">
              <Link href="/systems" className="btn btnGhost">
                {t("submitAnotherCta")}
              </Link>
              {opsIntakeId ? (
                // /portal/ops/* lives outside the [locale] segment — render with raw next/link
                <RawLink
                  href={`/portal/ops/${encodeURIComponent(opsIntakeId)}`}
                  className="btn btnGhost"
                >
                  {t("openWorkspaceCta")}
                </RawLink>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
