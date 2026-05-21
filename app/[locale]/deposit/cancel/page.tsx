import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function DepositCancelPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("depositCancel");
  const quoteId = pick(searchParams, "quoteId").trim();

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Deposit
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">{t("h1")}</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        {t("body")}
      </p>

      {quoteId ? (
        <p className="smallNote">
          {t("quoteIdLabel")} <code>{quoteId}</code>
        </p>
      ) : null}

      <div style={{ height: 18 }} />

      <Link className="btn btnPrimary" href="/">
        {t("backHome")} <span className="btnArrow">→</span>
      </Link>
    </main>
  );
}
