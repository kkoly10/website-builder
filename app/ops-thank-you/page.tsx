import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default function OpsThankYouPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const opsIntakeId = pick(searchParams, "opsIntakeId");
  const callRequestId = pick(searchParams, "callRequestId");

  return (
    <main className="container">
      <section className="section">
        <div className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Ops Flow • Complete
            </div>

            <div style={{ height: 10 }} />
            <h1 className="h2">Thanks — your workflow review request is in</h1>

            <p className="p" style={{ marginTop: 8 }}>
              We saved your intake and call preferences. Next step is reviewing your operations and
              preparing a clean workflow plan.
            </p>

            <div className="pills" style={{ marginTop: 10 }}>
              {opsIntakeId ? <span className="pill">Intake: {opsIntakeId.slice(0, 8)}…</span> : null}
              {callRequestId ? (
                <span className="pill">Call request: {callRequestId.slice(0, 8)}…</span>
              ) : null}
            </div>

            <div className="heroActions" style={{ marginTop: 14 }}>
              <Link href="/systems" className="btn btnGhost">
                Submit Another Intake
              </Link>
              <Link href="/internal/ops" className="btn btnPrimary">
                Internal Ops Dashboard
              </Link>
            </div>

            <p className="p" style={{ marginTop: 12 }}>
              If you’re prompting customers to create an account after booking, keep that step here
              (or from your email link flow) so it stays inside the ops product flow.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}