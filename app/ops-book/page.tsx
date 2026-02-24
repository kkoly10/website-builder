import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import OpsBookClient from "./OpsBookClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function OpsBookPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const sp = await Promise.resolve(searchParams);
  const opsIntakeId = pick(sp, "opsIntakeId").trim();

  if (!opsIntakeId) {
    return (
      <main className="container">
        <section className="section">
          <div className="card">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                Ops Booking
              </div>

              <div style={{ height: 10 }} />
              <h1 className="h2">Missing ops intake</h1>
              <p className="p" style={{ marginTop: 8 }}>
                Start from the workflow intake page so we can attach the booking to the right
                submission.
              </p>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/systems" className="btn btnPrimary">
                  Start Workflow Intake <span className="btnArrow">→</span>
                </Link>
                <Link href="/" className="btn btnGhost">
                  Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const { data: intake, error } = await supabaseAdmin
    .from("ops_intakes")
    .select(
      "id, company_name, contact_name, email, recommendation_tier, recommendation_price_range"
    )
    .eq("id", opsIntakeId)
    .maybeSingle();

  if (error || !intake) {
    return (
      <main className="container">
        <section className="section">
          <div className="card">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                Ops Booking
              </div>

              <div style={{ height: 10 }} />
              <h1 className="h2">Could not load intake</h1>
              <p className="p" style={{ marginTop: 8 }}>
                We couldn’t find that workflow intake. Please restart the intake flow and try again.
              </p>

              {error ? (
                <div
                  style={{
                    marginTop: 12,
                    borderRadius: 12,
                    padding: 12,
                    border: "1px solid rgba(255,80,80,0.35)",
                    background: "rgba(255,80,80,0.08)",
                  }}
                >
                  <strong>Error:</strong> {error.message}
                </div>
              ) : null}

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/systems" className="btn btnPrimary">
                  Start Workflow Intake <span className="btnArrow">→</span>
                </Link>
                <Link href="/" className="btn btnGhost">
                  Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="section">
        <div className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Ops Booking
            </div>

            <div style={{ height: 10 }} />
            <h1 className="h2">Book your workflow review call</h1>
            <p className="p" style={{ marginTop: 8 }}>
              We found your intake. Pick your preferred call timing below so we can attach it to the
              correct workflow request.
            </p>

            <div className="pills" style={{ marginTop: 10 }}>
              <span className="pill">Intake ID: {intake.id.slice(0, 8)}…</span>
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
