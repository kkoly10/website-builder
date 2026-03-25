import Link from "next/link";
import { redirect } from "next/navigation";

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

  return (
    <main className="container section">
      <div className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Systems Lab
          </div>
          <div style={{ height: 10 }} />
          <h1 className="h2">Missing ops project</h1>
          <p className="p">
            Open an existing ops project from your portal hub, or start a new workflow intake.
          </p>
          <div className="row" style={{ marginTop: 14 }}>
            <Link href="/portal" className="btn btnPrimary">
              Back to Portal <span className="btnArrow">→</span>
            </Link>
            <Link href="/ops-intake" className="btn btnGhost">
              Start Workflow Intake
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
