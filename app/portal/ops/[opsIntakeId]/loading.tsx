import { getTranslations } from "next-intl/server";

export default async function OpsPortalWorkspaceLoading() {
  const t = await getTranslations("portal.opsLoading");
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
        </div>
      </div>
    </main>
  );
}
