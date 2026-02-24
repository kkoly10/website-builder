import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/portal")}`);
  }

  const admin = isAdminEmail(user.email);

  return (
    <main className="container" style={{ paddingTop: 24, paddingBottom: 32 }}>
      <section className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Client Portal
          </div>

          <div style={{ height: 10 }} />

          <h1 className="h2" style={{ margin: 0 }}>
            Welcome back
          </h1>

          <p className="p" style={{ marginTop: 10 }}>
            Signed in as <strong>{user.email}</strong>
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link href="/build" className="btn btnPrimary">
              Website Quote
            </Link>
            <Link href="/systems" className="btn btnGhost">
              Workflow Intake
            </Link>
            <Link href="/estimate" className="btn btnGhost">
              Estimate
            </Link>
            {admin ? (
              <Link href="/internal" className="btn btnGhost">
                Internal Admin
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section" style={{ marginTop: 18 }}>
        <div className="tierGrid">
          <div className="card">
            <div className="cardInner">
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Website Projects</div>
              <p className="p" style={{ marginTop: 0 }}>
                Start a new quote, review scope, and continue your website project workflow.
              </p>
              <Link href="/build" className="btn btnPrimary">
                Start Website Intake
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="cardInner">
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Ops / Workflow Systems</div>
              <p className="p" style={{ marginTop: 0 }}>
                Submit a workflow intake for billing, CRM, invoicing, lead flow, and automation.
              </p>
              <Link href="/systems" className="btn btnPrimary">
                Start Ops Intake
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}