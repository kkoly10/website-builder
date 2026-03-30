import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getGhostProjectSnapshot } from "@/lib/ghost/snapshot";
import GhostProjectSidebar from "@/components/internal/ghost/GhostProjectSidebar";
import EcommerceStatusControls from "./EcommerceStatusControls";

export const dynamic = "force-dynamic";

type ParamsPromise = Promise<{ id: string }>;

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function statusText(value: string | null | undefined, fallback: string) {
  return String(value || "").trim().toLowerCase() || fallback;
}

function formatArray(value: unknown) {
  if (!Array.isArray(value)) return "—";
  return value.length ? value.join(", ") : "—";
}

function money(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? `$${num.toLocaleString()}` : "—";
}

export default async function EcommerceAdminDetailPage(props: { params: ParamsPromise }) {
  const params = await props.params;
  const id = params.id;

  const [{ data: intake }, { data: quote }, { data: call }, snapshot] = await Promise.all([
    supabaseAdmin.from("ecom_intakes").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin
      .from("ecom_quotes")
      .select("*")
      .eq("ecom_intake_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("ecom_call_requests")
      .select("*")
      .eq("ecom_intake_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getGhostProjectSnapshot("ecommerce", id),
  ]);

  if (!intake) notFound();

  const callStatus = statusText(call?.status, "not requested");
  const quoteStatus = statusText(quote?.status, "not started");
  const updatedAt = quote?.updated_at || call?.updated_at || intake.updated_at || intake.created_at;

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 360px",
          gap: 12,
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div className="card">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" /> E-Commerce Lead
              </div>

              <h1 className="h2">{intake.business_name || "E-Commerce Lead"}</h1>
              <p className="pDark" style={{ marginTop: 4 }}>
                {intake.contact_name || "—"} • {intake.email || "—"} • {intake.store_url || "No store URL"}
              </p>

              <div className="pills" style={{ marginTop: 10 }}>
                <span className="pill">Status: {statusText(intake.status, "new")}</span>
                <span className="pill">Call: {callStatus}</span>
                <span className="pill">Quote: {quoteStatus}</span>
                <span className="pill">Submitted: {fmtDate(intake.created_at)}</span>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/internal/admin/ecommerce" className="btn btnGhost">
                  ← Back to E-Commerce Leads
                </Link>
                <Link
                  href={`/portal/ecommerce/${encodeURIComponent(intake.id)}`}
                  className="btn btnGhost"
                >
                  Open Client Workspace
                </Link>
                <Link
                  href={`/ecommerce/book?ecomIntakeId=${encodeURIComponent(intake.id)}`}
                  className="btn btnGhost"
                >
                  Open Public Booking Page
                </Link>
              </div>
            </div>
          </div>

          <EcommerceStatusControls
            ecomIntakeId={id}
            initialIntakeStatus={statusText(intake.status, "new")}
            initialCallStatus={callStatus}
            initialQuoteStatus={quoteStatus}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            <div className="card">
              <div className="cardInner">
                <div style={{ fontWeight: 900, marginBottom: 10, color: "var(--fg)" }}>
                  Intake Snapshot
                </div>
                <div className="pDark">
                  <strong>Business:</strong> {intake.business_name || "—"}
                  <br />
                  <strong>Contact:</strong> {intake.contact_name || "—"}
                  <br />
                  <strong>Email:</strong> {intake.email || "—"}
                  <br />
                  <strong>Store URL:</strong> {intake.store_url || "—"}
                  <br />
                  <strong>Sales channels:</strong> {formatArray(intake.sales_channels)}
                  <br />
                  <strong>Service types:</strong> {formatArray(intake.service_types)}
                  <br />
                  <strong>Budget range:</strong> {intake.budget_range || "—"}
                  <br />
                  <strong>Timeline:</strong> {intake.timeline || "—"}
                </div>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--stroke)" }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>Planning Notes</div>
                  <div className="pDark">{intake.notes || "—"}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardInner">
                <div style={{ fontWeight: 900, marginBottom: 10, color: "var(--fg)" }}>
                  Demand + Fulfillment
                </div>
                <div className="pDark">
                  <strong>Monthly orders:</strong> {intake.monthly_orders || "—"}
                  <br />
                  <strong>Peak orders:</strong> {intake.peak_orders || "—"}
                  <br />
                  <strong>Storage type:</strong> {intake.storage_type || "—"}
                  <br />
                  <strong>Last updated:</strong> {fmtDate(updatedAt)}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    background: "var(--bg2)",
                    border: "1px solid var(--stroke)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>Ghost-ready summary</div>
                  <div className="pDark">
                    This lane now uses the same Ghost project sidebar model as Website and Ops, so
                    e-commerce is no longer the odd admin surface out.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            <div className="card">
              <div className="cardInner">
                <div style={{ fontWeight: 900, marginBottom: 10, color: "var(--fg)" }}>
                  Latest Planning Call
                </div>

                {call ? (
                  <div className="pDark">
                    <strong>Status:</strong> <span className="badge">{callStatus}</span>
                    <br />
                    <strong>Created:</strong> {fmtDate(call.created_at)}
                    <br />
                    <strong>Best time:</strong> {call.best_time_to_call || "—"}
                    <br />
                    <strong>Preferred window:</strong> {call.preferred_times || "—"}
                    <br />
                    <strong>Timezone:</strong> {call.timezone || "—"}
                    <br />
                    <div
                      style={{
                        marginTop: 8,
                        padding: 8,
                        background: "var(--bg2)",
                        borderRadius: 8,
                        border: "1px solid var(--stroke)",
                      }}
                    >
                      <strong>Client Notes:</strong>
                      <br />
                      {call.notes || "—"}
                    </div>
                  </div>
                ) : (
                  <div className="pDark">No planning call request yet.</div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="cardInner">
                <div style={{ fontWeight: 900, marginBottom: 10, color: "var(--fg)" }}>
                  Quote Summary
                </div>

                {quote ? (
                  <div className="pDark">
                    <strong>Status:</strong> <span className="badge">{quoteStatus}</span>
                    <br />
                    <strong>Setup fee:</strong> {money(quote.estimate_setup_fee)}
                    <br />
                    <strong>Monthly fee:</strong> {money(quote.estimate_monthly_fee)}
                    <br />
                    <strong>Fulfillment model:</strong> {quote.estimate_fulfillment_model || "—"}
                    <br />
                    <strong>Created:</strong> {fmtDate(quote.created_at)}
                  </div>
                ) : (
                  <div className="pDark">
                    No e-commerce quote yet. Ghost will flag this as a live admin gap until a quote is
                    created.
                  </div>
                )}

                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    background: "var(--bg2)",
                    border: "1px solid var(--stroke)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>Next operator move</div>
                  <div className="pDark">
                    {!call
                      ? "Confirm the client’s planning call window."
                      : !quote
                      ? "Draft the e-commerce quote and service plan."
                      : quoteStatus === "sent"
                      ? "Follow up on quote acceptance."
                      : "Confirm onboarding owner and next milestone."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardInner">
              <h2 className="h2">Raw Intake + Quote Data</h2>

              <details>
                <summary style={{ cursor: "pointer", fontWeight: 800, color: "var(--fg)" }}>
                  View Full Intake JSON
                </summary>
                <pre
                  style={{
                    margin: 0,
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid var(--stroke)",
                    background: "var(--bg2)",
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: 12,
                    lineHeight: 1.45,
                  }}
                >
                  {JSON.stringify(intake, null, 2)}
                </pre>
              </details>

              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 800, color: "var(--fg)" }}>
                  View Latest Quote JSON
                </summary>
                <pre
                  style={{
                    margin: 0,
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid var(--stroke)",
                    background: "var(--bg2)",
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: 12,
                    lineHeight: 1.45,
                  }}
                >
                  {JSON.stringify(quote || { status: "No quote yet" }, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>

        <GhostProjectSidebar lane="ecommerce" projectId={id} snapshot={snapshot} />
      </div>
    </section>
  );
}