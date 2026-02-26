import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PortalClient from "./PortalClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PortalPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const token = params.token;

  const { data: quote, error: qErr } = await supabaseAdmin
    .from("quotes")
    .select("*, leads(*)")
    .eq("public_token", token)
    .single();

  if (qErr || !quote) {
    return (
      <main className="container section">
        <div className="card">
          <div className="cardInner">
            <div className="h2" style={{ marginBottom: 8 }}>Client Portal Error</div>
            <p className="pDark" style={{ color: "#ffb4b4" }}>Project link could not be loaded. Quote not found.</p>
          </div>
        </div>
      </main>
    );
  }

  const lead = quote.leads ? (Array.isArray(quote.leads) ? quote.leads[0] : quote.leads) : null;

  const [{ data: callReq }, { data: pie }] = await Promise.all([
    supabaseAdmin.from("call_requests").select("*").eq("quote_id", quote.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("pie_reports").select("*").eq("quote_id", quote.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
  ]);

  const pieData = pie?.report_json || {};

  const bundle = {
    quote: {
      id: quote.id,
      publicToken: quote.public_token,
      createdAt: quote.created_at,
      status: quote.status || "Evaluating",
      tier: quote.tier_recommended || "—",
      estimate: {
        target: quote.estimate_total || null,
        min: quote.estimate_low || null,
        max: quote.estimate_high || null,
      },
      deposit: {
        status: quote.quote_json?.deposit?.status || "unpaid",
        paidAt: quote.quote_json?.deposit?.paidAt || null,
        link: quote.quote_json?.deposit?.link || null,
        amount: quote.quote_json?.deposit?.amount || Math.round((quote.estimate_total || 0) * 0.5),
        notes: quote.quote_json?.deposit?.notes || null,
      }
    },
    lead: {
      email: lead?.email || quote.lead_email || null,
      phone: lead?.phone || null,
      name: lead?.name || quote.quote_json?.contactName || null,
    },
    scope: {
      websiteType: quote.quote_json?.websiteType || null,
      pages: quote.quote_json?.pages || null,
      intent: quote.quote_json?.intent || null,
      timeline: quote.quote_json?.timeline || null,
      contentReady: quote.quote_json?.contentReady || null,
      domainHosting: quote.quote_json?.domainHosting || null,
      integrations: quote.quote_json?.integrations ? String(quote.quote_json.integrations).split(',') : [],
      notes: quote.quote_json?.notes || null,
    },
    callRequest: callReq ? {
      status: callReq.status,
      bestTime: callReq.best_time_to_call,
      timezone: callReq.timezone,
      notes: callReq.notes,
    } : null,
    pie: {
      exists: !!pie,
      id: pie?.id || null,
      score: pie?.score || pieData?.lead_score || null,
      tier: pie?.tier || pieData?.recommended_tier || null,
      confidence: pieData?.confidence || null,
      summary: pie?.summary || pieData?.summary || "",
      risks: pieData?.risks || [],
      pitch: pieData?.call_strategy || { emphasize: [], recommend: null, objections: [] },
      pricing: {
        target: pieData?.pricing_guardrail?.quoted_price || null,
        minimum: pieData?.pricing_guardrail?.recommended_range?.min || null,
        maximum: pieData?.pricing_guardrail?.recommended_range?.max || null,
      },
      hours: {
        min: pieData?.hours?.total_hours ? Math.floor(pieData.hours.total_hours * 0.8) : null,
        max: pieData?.hours?.total_hours || null,
      },
      timelineText: pieData?.timeline?.full_time_weeks ? `${pieData.timeline.full_time_weeks} weeks` : null,
      discoveryQuestions: pieData?.questions_to_ask || [],
    },
    portalState: {
      clientStatus: quote.client_status || "new",
      clientUpdatedAt: null,
      clientNotes: quote.client_notes || "",
      adminPublicNote: quote.admin_notes || null,
      milestones: quote.quote_json?.milestones || [
        { key: "kickoff", label: "Project Kickoff", done: true },
        { key: "content", label: "Assets & Content Collected", done: false },
        { key: "design", label: "Design Approval", done: false },
        { key: "build", label: "Development", done: false },
        { key: "launch", label: "Final Launch", done: false }
      ],
      assets: quote.quote_json?.assets || [],
      revisions: quote.quote_json?.revisions || [],
    }
  };

  return <PortalClient initial={bundle} />;
}
