import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function formatArr(value: unknown) {
  if (!Array.isArray(value)) return "—";
  return value.length ? value.join(", ") : "—";
}

function statusText(value: string | null | undefined, fallback: string) {
  const status = String(value || "").trim().toLowerCase();
  const normalized = status || fallback;
  if (normalized === "not requested") return "Not requested";
  if (normalized === "in_progress") return "In progress";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default async function OpsPortalWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(`/portal/ops/${id}`)}`);

  const { data: intake } = await supabaseAdmin
    .from("ops_intakes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!intake) notFound();

  const userEmail = normalizeEmail(user.email);
  const intakeEmail = normalizeEmail(intake.email);
  const intakeOwnerEmail = normalizeEmail(intake.owner_email_norm);
  const ownsByUserId = intake.auth_user_id && intake.auth_user_id === user.id;
  const ownsByEmail = !!userEmail && ((!!intakeEmail && userEmail === intakeEmail) || (!!intakeOwnerEmail && userEmail === intakeOwnerEmail));

  if (!ownsByUserId && !ownsByEmail) {
    redirect("/portal");
  }

  if (!intake.auth_user_id && ownsByEmail) {
    await supabaseAdmin.from("ops_intakes").update({ auth_user_id: user.id }).eq("id", intake.id);
  }

  const [{ data: call }, { data: pie }] = await Promise.all([
    supabaseAdmin
      .from("ops_call_requests")
      .select("*")
      .eq("ops_intake_id", intake.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("ops_pie_reports")
      .select("*")
      .eq("ops_intake_id", intake.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <main className="container" style={{ padding: "40px 0 80px" }}>
      <section className="card" style={{ marginBottom: 12 }}>
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" /> Ops Workspace
          </div>
          <h1 className="h2">{intake.company_name || "Ops Request"}</h1>
          <p className="pDark" style={{ marginTop: 4 }}>
            Submitted {fmtDate(intake.created_at)} • Intake Status: {statusText(intake.status, "new")}
          </p>

          <div className="pills" style={{ marginTop: 10 }}>
            <span className="pill">Call Status: {statusText(call?.status, "not requested")}</span>
            <span className="pill">PIE Report: {pie ? "Ready" : "Pending"}</span>
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href={`/ops-book?opsIntakeId=${encodeURIComponent(intake.id)}`} className="btn btnGhost">
              Book / Update Call
            </Link>
            <Link href="/systems" className="btn btnGhost">
              Review Workflow Services
            </Link>
            <Link href="/contact" className="btn btnPrimary">
              Contact / Support
            </Link>
          </div>
        </div>
      </section>

      <div className="grid2">
        <section className="card">
          <div className="cardInner" style={{ display: "grid", gap: 8 }}>
            <h2 className="h3">Intake summary</h2>
            <div className="pDark"><strong>Contact:</strong> {intake.contact_name || "—"}</div>
            <div className="pDark"><strong>Email:</strong> {intake.email || "—"}</div>
            <div className="pDark"><strong>Industry:</strong> {intake.industry || "—"}</div>
            <div className="pDark"><strong>Team size:</strong> {intake.team_size || "—"}</div>
            <div className="pDark"><strong>Job volume:</strong> {intake.job_volume || "—"}</div>
            <div className="pDark"><strong>Urgency:</strong> {intake.urgency || "—"}</div>
            <div className="pDark"><strong>Readiness:</strong> {intake.readiness || "—"}</div>
            <div className="pDark"><strong>Current tools:</strong> {formatArr(intake.current_tools)}</div>
            <div className="pDark"><strong>Pain points:</strong> {formatArr(intake.pain_points)}</div>
            <div className="pDark"><strong>Workflows needed:</strong> {formatArr(intake.workflows_needed)}</div>
            <div className="pDark"><strong>Notes:</strong> {intake.notes || "—"}</div>
          </div>
        </section>

        <section className="card">
          <div className="cardInner" style={{ display: "grid", gap: 8 }}>
            <h2 className="h3">Recommendation and next steps</h2>
            <div className="pDark"><strong>Recommended tier:</strong> {intake.recommendation_tier || "—"}</div>
            <div className="pDark"><strong>Estimated range:</strong> {intake.recommendation_price_range || "—"}</div>
            <div className="pDark"><strong>Recommendation score:</strong> {intake.recommendation_score ?? "—"}</div>
            <div className="pDark"><strong>Latest call request:</strong> {fmtDate(call?.created_at)}</div>
            <div className="pDark"><strong>Best call time:</strong> {call?.best_time_to_call || "—"}</div>
            <div className="pDark"><strong>Preferred times:</strong> {call?.preferred_times || "—"}</div>
            <div className="pDark"><strong>Timezone:</strong> {call?.timezone || "—"}</div>
            <div className="pDark"><strong>Call notes:</strong> {call?.notes || "—"}</div>

            {pie?.summary ? (
              <div className="card" style={{ background: "var(--panel2)", marginTop: 8 }}>
                <div className="cardInner">
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Latest PIE summary</div>
                  <p className="pDark" style={{ margin: 0 }}>{pie.summary}</p>
                </div>
              </div>
            ) : (
              <div className="pDark">Your workflow report is being prepared. We&apos;ll update this workspace once it&apos;s ready.</div>
            )}

            <div className="pDark" style={{ fontSize: 13 }}>
              Last updated: {fmtDate(pie?.updated_at || call?.updated_at || intake.updated_at)}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
