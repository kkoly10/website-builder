import { redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminPipelineClient from "./AdminPipelineClient";

export const dynamic = "force-dynamic";

function safeObj(v: any) {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function WebPipelinePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/internal/admin");
  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const [quotesRes, piesRes, callsRes] = await Promise.all([
    supabaseAdmin
      .from("quotes")
      .select("*, leads(email, name)")
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("pie_reports")
      .select("*")
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("call_requests")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const quotes = quotesRes.data || [];
  const pies = piesRes.data || [];
  const calls = callsRes.data || [];

  const pieMap = new Map();
  for (const p of pies) {
    if (!pieMap.has(p.quote_id)) pieMap.set(p.quote_id, p);
  }

  const callMap = new Map();
  for (const c of calls) {
    if (!callMap.has(c.quote_id)) callMap.set(c.quote_id, c);
  }

  const rows = quotes.map((q) => {
    const lead = Array.isArray(q.leads) ? q.leads[0] : q.leads;
    const pieRecord = pieMap.get(q.id);
    const pieData = pieRecord?.report || pieRecord?.report_json || {};
    const callRecord = callMap.get(q.id);

    const debug = safeObj(q.debug);
    const portalAdmin = safeObj(debug.portalAdmin);

    const baseTarget =
      q.estimate_total ||
      q.quote_json?.estimateComputed?.total ||
      q.quote_json?.estimate?.target ||
      0;

    const baseMin =
      q.estimate_low ||
      q.quote_json?.estimateComputed?.low ||
      q.quote_json?.estimate?.min ||
      0;

    const baseMax =
      q.estimate_high ||
      q.quote_json?.estimateComputed?.high ||
      q.quote_json?.estimate?.max ||
      0;

    return {
      quoteId: q.id,
      createdAt: q.created_at,
      status: q.status || "new",
      tier: q.tier_recommended || q.quote_json?.estimate?.tierRecommended || "—",
      leadEmail: q.lead_email || lead?.email || q.quote_json?.leadEmail || "No Email",
      leadName: lead?.name || q.quote_json?.contactName || "Unknown Lead",

      estimate: { target: baseTarget, min: baseMin, max: baseMax },
      estimateFormatted: {
        target: `$${baseTarget.toLocaleString()}`,
        min: `$${baseMin.toLocaleString()}`,
        max: `$${baseMax.toLocaleString()}`,
      },

      pie: {
        exists: !!pieRecord,
        id: pieRecord?.id || null,
        score: pieRecord?.score || pieData?.lead_score || null,
        tier: pieRecord?.tier || pieData?.recommended_tier || null,
        confidence: pieData?.confidence || null,
        summary: pieRecord?.summary || pieData?.summary || "",
      },

      adminPricing: {
        discountPercent: debug?.adminPricing?.discountPercent || 0,
        flatAdjustment: debug?.adminPricing?.flatAdjustment || 0,
        hourlyRate: debug?.adminPricing?.hourlyRate || 40,
        notes: debug?.adminPricing?.notes || "",
      },

      portalAdmin: {
        previewUrl: portalAdmin.previewUrl || "",
        productionUrl: portalAdmin.productionUrl || "",
        previewStatus: portalAdmin.previewStatus || "Awaiting published preview",
        previewNotes: portalAdmin.previewNotes || "",
        previewUpdatedAt: portalAdmin.previewUpdatedAt || "",
        clientReviewStatus: portalAdmin.clientReviewStatus || "Preview pending",
        agreementStatus: portalAdmin.agreementStatus || "Not published yet",
        agreementModel: portalAdmin.agreementModel || "Managed build agreement",
        ownershipModel: portalAdmin.ownershipModel || "Managed with project handoff options",
        agreementPublishedAt: portalAdmin.agreementPublishedAt || "",
        launchStatus: portalAdmin.launchStatus || "Not ready",
        domainStatus: portalAdmin.domainStatus || "Pending",
        analyticsStatus: portalAdmin.analyticsStatus || "Pending",
        formsStatus: portalAdmin.formsStatus || "Pending",
        seoStatus: portalAdmin.seoStatus || "Pending",
        handoffStatus: portalAdmin.handoffStatus || "Pending",
        launchNotes: portalAdmin.launchNotes || "",
      },

      proposalText: debug?.generatedProposal || "",

      callRequest: callRecord
        ? {
            status: callRecord.status || "new",
            bestTime: callRecord.best_time_to_call || null,
            preferredTimes: callRecord.preferred_times || null,
            timezone: callRecord.timezone || null,
            notes: callRecord.notes || null,
          }
        : null,

      links: {
        detail: `/internal/admin/${q.id}`,
        workspace: q.public_token ? `/portal/${q.public_token}` : `/internal/project/${q.id}`,
      },
    };
  });

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" />
            Pipeline
          </div>
          <h1 className="h2">Website Quotes</h1>
          <p className="pDark" style={{ marginTop: 4 }}>
            Manage website leads, pricing, PIE analysis, workspace publishing,
            launch readiness, and the client-facing Website Project Studio.
          </p>
        </div>
      </div>

      <AdminPipelineClient initialRows={rows} />
    </section>
  );
}