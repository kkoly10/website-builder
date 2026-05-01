import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import OpsBookClient from "./OpsBookClient";

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
  const t = await getTranslations({ locale, namespace: "opsBook" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function OpsBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await Promise.resolve(searchParams);
  const opsIntakeId = pick(sp, "opsIntakeId").trim();

  if (!opsIntakeId) {
    return <MissingPanel />;
  }

  const { data: intake, error } = await supabaseAdmin
    .from("ops_intakes")
    .select(
      "id, company_name, contact_name, email, recommendation_tier, recommendation_price_range"
    )
    .eq("id", opsIntakeId)
    .maybeSingle();

  if (error || !intake) {
    return <LoadErrorPanel errorMessage={error?.message} />;
  }

  return <FoundPanel intake={intake} />;
}

function MissingPanel() {
  const t = useTranslations("opsBook");
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
            <h1 className="h2">{t("missing.title")}</h1>
            <p className="p">{t("missing.body")}</p>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/systems" className="btn btnPrimary">
                {t("missing.ctaStart")} <span className="btnArrow">→</span>
              </Link>
              <Link href="/" className="btn btnGhost">
                {t("missing.ctaHome")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoadErrorPanel({ errorMessage }: { errorMessage?: string }) {
  const t = useTranslations("opsBook");
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
            <h1 className="h2">{t("loadError.title")}</h1>
            <p className="p">{t("loadError.body")}</p>

            {errorMessage ? (
              <div
                style={{
                  marginTop: 12,
                  borderRadius: 12,
                  padding: 12,
                  border: "1px solid var(--accent)",
                  background: "var(--accent-bg)",
                }}
              >
                <strong>{t("loadError.errorPrefix")}</strong> {errorMessage}
              </div>
            ) : null}

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/systems" className="btn btnPrimary">
                {t("missing.ctaStart")} <span className="btnArrow">→</span>
              </Link>
              <Link href="/" className="btn btnGhost">
                {t("missing.ctaHome")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

type IntakeRow = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  recommendation_tier: string | null;
  recommendation_price_range: string | null;
};

function FoundPanel({ intake }: { intake: IntakeRow }) {
  const t = useTranslations("opsBook");
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
            <h1 className="h2">{t("found.title")}</h1>
            <p className="p">{t("found.body")}</p>

            <div className="pills">
              <span className="pill">
                {t("found.intakeIdLabel")} {intake.id.slice(0, 8)}…
              </span>
              {intake.recommendation_tier ? <span className="pill">{intake.recommendation_tier}</span> : null}
              {intake.recommendation_price_range ? (
                <span className="pill">{intake.recommendation_price_range}</span>
              ) : null}
            </div>
          </div>
        </div>

        <OpsBookClient
          intake={{
            id: intake.id,
            company_name: intake.company_name ?? "",
            contact_name: intake.contact_name ?? "",
            email: intake.email ?? "",
            recommendation_tier: intake.recommendation_tier ?? null,
            recommendation_price_range: intake.recommendation_price_range ?? null,
          }}
        />
      </section>
    </main>
  );
}
