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

  const customerNext = "/";

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

            <div className="card" style={{ marginTop: 14, background: "rgba(255,255,255,0.03)" }}>
              <div className="cardInner">
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Optional: Create your account now</div>
                <p className="p" style={{ marginTop: 0 }}>
                  Creating an account lets you sign in later to check your project and next steps.
                </p>

                <div className="heroActions" style={{ marginTop: 12 }}>
                  <Link
                    href={`/signup?next=${encodeURIComponent(customerNext)}`}
                    className="btn btnPrimary"
                  >
                    Create Account <span className="btnArrow">→</span>
                  </Link>

                  <Link
                    href={`/login?next=${encodeURIComponent(customerNext)}`}
                    className="btn btnGhost"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>

            <div className="heroActions" style={{ marginTop: 14 }}>
              <Link href="/systems" className="btn btnGhost">
                Submit Another Intake
              </Link>
              <Link href="/internal/ops" className="btn btnGhost">
                Internal Ops Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}