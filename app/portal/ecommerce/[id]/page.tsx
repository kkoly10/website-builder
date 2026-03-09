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
  return String(value || "").trim().toLowerCase() || fallback;
}

export default async function EcommercePortalWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(`/portal/ecommerce/${id}`)}`);

  const { data: intake } = await supabaseAdmin
    .from("ecom_intakes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!intake) notFound();

  const userEmail = normalizeEmail(user.email);
  const intakeEmail = normalizeEmail(intake.email);
  const ownsByUserId = intake.auth_user_id && intake.auth_user_id === user.id;
  const ownsByEmail = !!userEmail && !!intakeEmail && userEmail === intakeEmail;

  if (!ownsByUserId && !ownsByEmail) {
    redirect("/portal");
  }

  if (!intake.auth_user_id && ownsByEmail) {
    await supabaseAdmin.from("ecom_intakes").update({ auth_user_id: user.id }).eq("id", intake.id);
  }

  const [{ data: call }, { data: quote }] = await Promise.all([
    supabaseAdmin
      .from("ecom_call_requests")
      .select("*")
      .eq("ecom_intake_id", intake.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("ecom_quotes")
      .select("*")
      .eq("ecom_intake_id", intake.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <main className="container" style={{ padding: "40px 0 80px" }}>
      <section className="card" style={{ marginBottom: 12 }}>
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" /> E-Commerce Workspace
          </div>
          <h1 className="h2">{intake.business_name || "E-Commerce Request"}</h1>
          <p className="pDark" style={{ marginTop: 4 }}>
            Submitted {fmtDate(intake.created_at)} • Intake status: {statusText(intake.status, "new")}
          </p>

          <div className="pills" style={{ marginTop: 10 }}>
            <span className="pill">Call: {statusText(call?.status, "not requested")}</span>
            <span className="pill">Quote: {statusText(quote?.status, "not started")}</span>
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href={`/ecommerce/book?ecomIntakeId=${encodeURIComponent(intake.id)}`} className="btn btnGhost">
              Book / Update Call
            </Link>
            <Link href="/ecommerce/pricing" className="btn btnGhost">
              Review Pricing
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
            <div className="pDark"><strong>Store URL:</strong> {intake.store_url || "—"}</div>
            <div className="pDark"><strong>Sales channels:</strong> {formatArr(intake.sales_channels)}</div>
            <div className="pDark"><strong>Service types:</strong> {formatArr(intake.service_types)}</div>
            <div className="pDark"><strong>Monthly orders:</strong> {intake.monthly_orders || "—"}</div>
            <div className="pDark"><strong>Peak orders:</strong> {intake.peak_orders || "—"}</div>
            <div className="pDark"><strong>Storage type:</strong> {intake.storage_type || "—"}</div>
            <div className="pDark"><strong>Budget range:</strong> {intake.budget_range || "—"}</div>
            <div className="pDark"><strong>Timeline:</strong> {intake.timeline || "—"}</div>
            <div className="pDark"><strong>Notes:</strong> {intake.notes || "—"}</div>
          </div>
        </section>

        <section className="card">
          <div className="cardInner" style={{ display: "grid", gap: 8 }}>
            <h2 className="h3">Quote and next steps</h2>
            <div className="pDark"><strong>Latest call status:</strong> {statusText(call?.status, "not requested")}</div>
            <div className="pDark"><strong>Latest quote status:</strong> {statusText(quote?.status, "not started")}</div>

            {quote ? (
              <>
                <div className="pDark"><strong>Setup fee:</strong> {quote.estimate_setup_fee != null ? `$${Number(quote.estimate_setup_fee).toLocaleString()}` : "—"}</div>
                <div className="pDark"><strong>Monthly fee:</strong> {quote.estimate_monthly_fee != null ? `$${Number(quote.estimate_monthly_fee).toLocaleString()}` : "—"}</div>
                <div className="pDark"><strong>Fulfillment model:</strong> {quote.estimate_fulfillment_model || "—"}</div>
              </>
            ) : (
              <div className="pDark">Your quote is being prepared. We&apos;ll update this workspace once it&apos;s ready.</div>
            )}

            <div className="card" style={{ background: "var(--panel2)", marginTop: 8 }}>
              <div className="cardInner">
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Next steps</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.8 }}>
                  <li>Confirm your preferred planning call window.</li>
                  <li>Review your modular recommendation and quote status.</li>
                  <li>Finalize service mix and launch timeline.</li>
                </ul>
              </div>
            </div>

            <div className="pDark" style={{ fontSize: 13 }}>
              Last updated: {fmtDate(quote?.updated_at || call?.updated_at || intake.updated_at)}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
