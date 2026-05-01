import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function OpsPortalEntryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const sp = await Promise.resolve(searchParams);
  const opsIntakeId = pick(sp, "opsIntakeId").trim();

  if (opsIntakeId) {
    redirect(`/portal/ops/${opsIntakeId}`);
  }

  const t = await getTranslations("portal.opsEntry");

  return (
    <main className="container section">
      <div className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            {t("kicker")}
          </div>
          <div style={{ height: 10 }} />
          <h1 className="h2">{t("title")}</h1>
          <p className="p">{t("body")}</p>
          <div className="row" style={{ marginTop: 14 }}>
            <Link href="/portal" className="btn btnPrimary">
              {t("ctaBack")} <span className="btnArrow">→</span>
            </Link>
            <Link href="/ops-intake" className="btn btnGhost">
              {t("ctaIntake")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
