import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeStatus, statusLabel } from "@/lib/ecommerce/status";

export const dynamic = "force-dynamic";

type EcomIntakeRow = {
  id: string;
  created_at: string | null;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  sales_channels: string[] | null;
  service_types: string[] | null;
  monthly_orders: string | null;
  storage_type: string | null;
};

type EcomCallRow = { ecom_intake_id: string; status: string | null; created_at: string | null };
type EcomQuoteRow = { ecom_intake_id: string; status: string | null; created_at: string | null };

export default async function EcommerceAdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/internal/admin/ecommerce");
  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const { data } = await supabaseAdmin
    .from("ecom_intakes")
    .select("id, created_at, business_name, contact_name, email, sales_channels, service_types, monthly_orders, storage_type")
    .order("created_at", { ascending: false })
    .limit(150);

  const rows = (data ?? []) as EcomIntakeRow[];
  const intakeIds = rows.map((row) => row.id);

  let calls: EcomCallRow[] = [];
  let quotes: EcomQuoteRow[] = [];

  if (intakeIds.length) {
    const [{ data: callData }, { data: quoteData }] = await Promise.all([
      supabaseAdmin
        .from("ecom_call_requests")
        .select("ecom_intake_id, status, created_at")
        .in("ecom_intake_id", intakeIds)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("ecom_quotes")
        .select("ecom_intake_id, status, created_at")
        .in("ecom_intake_id", intakeIds)
        .order("created_at", { ascending: false }),
    ]);

    calls = (callData ?? []) as EcomCallRow[];
    quotes = (quoteData ?? []) as EcomQuoteRow[];
  }

  const latestCallByIntake = new Map<string, EcomCallRow>();
  for (const row of calls) {
    if (!latestCallByIntake.has(row.ecom_intake_id)) latestCallByIntake.set(row.ecom_intake_id, row);
  }

  const latestQuoteByIntake = new Map<string, EcomQuoteRow>();
  for (const row of quotes) {
    if (!latestQuoteByIntake.has(row.ecom_intake_id)) latestQuoteByIntake.set(row.ecom_intake_id, row);
  }

  const normalizedRows = rows.map((row) => {
    const callStatus = normalizeStatus(latestCallByIntake.get(row.id)?.status, "not requested");
    const quoteStatus = normalizeStatus(latestQuoteByIntake.get(row.id)?.status, "not started");
    return { row, callStatus, quoteStatus };
  });

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div className="kicker"><span className="kickerDot" /> E-Commerce Pipeline</div>
          <h1 className="h2">Seller intake leads</h1>
          <p className="pDark">Separate lane for e-commerce records only (not mixed with website quotes or ops intakes).</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="cardInner" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--stroke)" }}>
                <th style={{ padding: "10px 8px" }}>Business</th>
                <th style={{ padding: "10px 8px" }}>Contact</th>
                <th style={{ padding: "10px 8px" }}>Email</th>
                <th style={{ padding: "10px 8px" }}>Channels</th>
                <th style={{ padding: "10px 8px" }}>Services</th>
                <th style={{ padding: "10px 8px" }}>Monthly Orders</th>
                <th style={{ padding: "10px 8px" }}>Storage Type</th>
                <th style={{ padding: "10px 8px" }}>Quote Status</th>
                <th style={{ padding: "10px 8px" }}>Call Status</th>
                <th style={{ padding: "10px 8px" }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {normalizedRows.map(({ row, callStatus, quoteStatus }) => (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--stroke)" }}>
                  <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                    <Link href={`/internal/admin/ecommerce/${row.id}`}>{row.business_name || "—"}</Link>
                  </td>
                  <td style={{ padding: "10px 8px" }}>{row.contact_name || "—"}</td>
                  <td style={{ padding: "10px 8px" }}>{row.email || "—"}</td>
                  <td style={{ padding: "10px 8px" }}>{(row.sales_channels || []).join(", ") || "—"}</td>
                  <td style={{ padding: "10px 8px" }}>{(row.service_types || []).join(", ") || "—"}</td>
                  <td style={{ padding: "10px 8px" }}>{row.monthly_orders || "—"}</td>
                  <td style={{ padding: "10px 8px" }}>{row.storage_type || "—"}</td>
                  <td style={{ padding: "10px 8px" }}>{statusLabel(quoteStatus, "not started")}</td>
                  <td style={{ padding: "10px 8px" }}>{statusLabel(callStatus, "not requested")}</td>
                  <td style={{ padding: "10px 8px" }}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {normalizedRows.length === 0 ? <p className="pDark" style={{ marginTop: 14 }}>No e-commerce leads found.</p> : null}
        </div>
      </div>
    </section>
  );
}
