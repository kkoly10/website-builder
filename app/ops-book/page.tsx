import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import OpsBookClient from "./OpsBookClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

type IntakePreview = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  recommendation_tier: string | null;
  recommendation_price_range: string | null;
};

export default async function OpsBookPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const opsIntakeId = pick(searchParams, "opsIntakeId").trim();

  if (!opsIntakeId) {
    return (
      <main className="container">
        <section className="section">
          <div className="card">
            <div className="cardInner">
              <h1 className="h2">Missing ops intake</h1>
              <p className="p" style={{ marginTop: 8 }}>
                Start from the workflow intake page so we can attach the booking to the right
                submission.
              </p>
              <div style={{ marginTop: 12 }}>
                <Link href="/systems" className="btn btnPrimary">
                  Go to Ops Intake
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const { data: intake } = await supabaseAdmin
    .from("ops_intakes")
    .select("id, company_name, contact_name, email, recommendation_tier, recommendation_price_range")
    .eq("id", opsIntakeId)
    .maybeSingle<IntakePreview>();

  if (!intake) {
    return (
      <main className="container">
        <section className="section">
          <div className="card">
            <div className="cardInner">
              <h1 className="h2">Ops intake not found</h1>
              <p className="p" style={{ marginTop: 8 }}>
                The intake link may be expired or invalid. Start a new intake and try again.
              </p>
              <div style={{ marginTop: 12 }}>
                <Link href="/systems" className="btn btnPrimary">
                  Start New Ops Intake
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
        <div className="heroGrid">
          <div className="card">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                Ops Flow • Step 2
              </div>

              <div style={{ height: 10 }} />
              <h1 className="h2">Book your workflow review call</h1>

              <p className="p" style={{ marginTop: 8 }}>
                Intake saved for <strong>{intake.company_name}</strong>. Pick your preferred call
                timing and I’ll use this to prepare your workflow review.
              </p>

              <div className="pills" style={{ marginTop: 10 }}>
                <span className="pill">{intake.contact_name}</span>
                <span className="pill">{intake.email}</span>
                {intake.recommendation_tier ? (
                  <span className="pill">{intake.recommendation_tier}</span>
                ) : null}
                {intake.recommendation_price_range ? (
                  <span className="pill">{intake.recommendation_price_range}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardInner">
              <div style={{ fontWeight: 900, marginBottom: 8 }}>What happens next</div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                <li>You submit your call preferences</li>
                <li>We review your intake + workflow pain points</li>
                <li>You get a clearer scope and next steps</li>
                <li>PIE can generate a detailed internal action plan</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <OpsBookClient opsIntakeId={intake.id} />
    </main>
  );
}