import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import EcommerceQuoteEditor from "./EcommerceQuoteEditor";
import EcommerceStatusControls from "./EcommerceStatusControls";
import { normalizeStatus, statusLabel } from "@/lib/ecommerce/status";

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

function toNum(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildRecommendation(intake: any) {
  const services = Array.isArray(intake?.service_types) ? intake.service_types : [];
  const monthlyOrders = toNum(intake?.monthly_orders);
  const skuCount = toNum(intake?.sku_count);

  let setupFee = 500;
  let monthlyFee = 150;

  if (services.includes("Website only")) setupFee += 700;
  if (services.includes("Hosting / maintenance")) monthlyFee += 75;
  if (services.includes("Marketplace management")) monthlyFee += 350;
  if (services.includes("Inventory storage")) monthlyFee += 200;
  if (services.includes("Fulfillment")) monthlyFee += 250;
  if (services.includes("Virtual assistant support")) monthlyFee += 200;

  if (monthlyOrders > 250) monthlyFee += 300;
  if (skuCount > 200) monthlyFee += 150;

  return {
    setupFee,
    monthlyFee,
    fulfillmentModel: services.includes("Fulfillment") ? "Hybrid per-order + storage support" : "Not included",
    status: "draft",
    quoteJson: {
      source: "phase-a-b-c-admin-recommendation",
      assumptions: { serviceTypes: services, monthlyOrders, skuCount },
      note: "Baseline recommendation generated for admin review before sending.",
    },
  };
}

export default async function EcommerceAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const routeParams = await params;
  const intakeId = routeParams.id;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(`/internal/admin/ecommerce/${intakeId}`)}`);
  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const [{ data: intake }, { data: quote }, { data: call }] = await Promise.all([
    supabaseAdmin.from("ecom_intakes").select("*").eq("id", intakeId).maybeSingle(),
    supabaseAdmin.from("ecom_quotes").select("*").eq("ecom_intake_id", intakeId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("ecom_call_requests").select("*").eq("ecom_intake_id", intakeId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!intake) notFound();

  const recommendation = buildRecommendation(intake);

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div style={{ marginBottom: 12 }}><Link href="/internal/admin/ecommerce" className="btn btnGhost">← Back to E-Commerce Leads</Link></div>

      <div className="card">
        <div className="cardInner">
          <div className="kicker"><span className="kickerDot" /> E-Commerce Lead Summary</div>
          <h1 className="h2">{intake.business_name || "E-Commerce Lead"}</h1>
          <p className="pDark" style={{ marginTop: 4 }}>{intake.contact_name || "—"} • {intake.email || "—"}</p>

          <div className="pills" style={{ marginTop: 10 }}>
            <span className="pill">Intake: {statusLabel(intake.status, "new")}</span>
            <span className="pill">Call: {statusLabel(call?.status, "not requested")}</span>
            <span className="pill">Quote: {statusLabel(quote?.status, "not started")}</span>
            <span className="pill">Submitted: {fmtDate(intake.created_at)}</span>
            <span className="pill">Updated: {fmtDate(quote?.updated_at || call?.updated_at || intake.updated_at)}</span>
          </div>
        </div>
      </div>

      <EcommerceStatusControls
        ecomIntakeId={intakeId}
        initialIntakeStatus={normalizeStatus(intake.status, "new")}
        initialCallStatus={normalizeStatus(call?.status, "new")}
        initialQuoteStatus={normalizeStatus(quote?.status, "draft")}
      />

      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="cardInner" style={{ display: "grid", gap: 8 }}>
            <h2 className="h3">Intake highlights</h2>
            <div className="pDark"><strong>Store URL:</strong> {intake.store_url || "—"}</div>
            <div className="pDark"><strong>Sales channels:</strong> {formatArr(intake.sales_channels)}</div>
            <div className="pDark"><strong>Service types:</strong> {formatArr(intake.service_types)}</div>
            <div className="pDark"><strong>Monthly orders:</strong> {intake.monthly_orders || "—"}</div>
            <div className="pDark"><strong>Peak orders:</strong> {intake.peak_orders || "—"}</div>
            <div className="pDark"><strong>Storage type:</strong> {intake.storage_type || "—"}</div>
            <div className="pDark"><strong>Budget range:</strong> {intake.budget_range || "—"}</div>
            <div className="pDark"><strong>Timeline:</strong> {intake.timeline || "—"}</div>
            <div className="pDark"><strong>Decision maker:</strong> {intake.decision_maker || "—"}</div>
            <div className="pDark"><strong>Notes:</strong> {intake.notes || "—"}</div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner" style={{ display: "grid", gap: 8 }}>
            <h2 className="h3">Call request summary</h2>
            <div className="pDark"><strong>Status:</strong> {statusLabel(call?.status, "not requested")}</div>
            <div className="pDark"><strong>Best time:</strong> {call?.best_time || "—"}</div>
            <div className="pDark"><strong>Preferred times:</strong> {call?.preferred_times || "—"}</div>
            <div className="pDark"><strong>Timezone:</strong> {call?.timezone || "—"}</div>
            <div className="pDark"><strong>Notes:</strong> {call?.notes || "—"}</div>
            <div className="pDark"><strong>Requested:</strong> {fmtDate(call?.created_at)}</div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={`/ecommerce/book?ecomIntakeId=${encodeURIComponent(intakeId)}`} className="btn btnGhost">Book / Update Call</Link>
              <Link href="/ecommerce/pricing" className="btn btnGhost">Review Pricing</Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <EcommerceQuoteEditor ecomIntakeId={intakeId} intakeData={intake} quote={quote} recommendation={recommendation} />
      </div>
    </section>
  );
}
