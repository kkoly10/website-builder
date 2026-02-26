import { redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminPipelineClient from "./AdminPipelineClient";

export const dynamic = "force-dynamic";

export default async function WebPipelinePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/internal/admin");
  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const [quotesRes, piesRes, callsRes] = await Promise.all([
    supabaseAdmin.from("quotes").select("*, leads(email, name)").order("created_at", { ascending: false }),
    supabaseAdmin.from("pie_reports").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("call_requests").select("*").order("created_at", { ascending: false })
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

  const rows = quotes.map(q => {
    const lead = Array.isArray(q.leads) ? q.leads[0] : q.leads;
    const pieRecord = pieMap.get(q.id);
    const pieData = pieRecord?.report || pieRecord?.report_json || {};
    const callRecord = callMap.get(q.id);

    const baseTarget = q.estimate_total || q.quote_json?.estimateComputed?.total || q.quote_json?.estimate?.target || 0;
    const baseMin = q.estimate_low || q.quote_json?.estimateComputed?.low || q.quote_json?.estimate?.min || 0;
    const baseMax = q.estimate_high || q.quote_json?.estimateComputed?.high || q.quote_json?.estimate?.max || 0;

    return {
      quoteId: q.id,
      createdAt: q.created_at,
      status: q.status || "new",
      tier: q.tier_recommended || q.quote_json?.estimate?.tierRecommended || "—",
      leadEmail: q.lead_email || lead?.email || q.quote_json?.leadEmail || "No Email",
      leadName: lead?.name || q.quote_json?.contactName || null,
      
      clientStatus: q.client_status || q.quote_json?.portalState?.clientStatus || null,
      latestClientNote: q.client_notes || null,
      assetCount: Array.isArray(q.quote_json?.assets) ? q.quote_json.assets.length : 0,
      revisionCount: Array.isArray(q.quote_json?.revisions) ? q.quote_json.revisions.length : 0,

      callRequest: callRecord ? {
        status: callRecord.status || "new",
        bestTime: callRecord.best_time_to_call || null,
        preferredTimes: callRecord.preferred_times || null,
        timezone: callRecord.timezone || null,
        notes: callRecord.notes || null,
      } : null,

      estimate: { target: baseTarget, min: baseMin, max: baseMax },
      estimateFormatted: {
        target: `$${baseTarget.toLocaleString()}`,
        min: `$${baseMin.toLocaleString()}`,
        max: `$${baseMax.toLocaleString()}`
      },
      pie: {
        exists: !!pieRecord,
        id: pieRecord?.id || null,
        score: pieRecord?.score || pieData?.lead_score || null,
        tier: pieRecord?.tier || pieData?.recommended_tier || null,
        confidence: pieData?.confidence || null,
        summary: pieRecord?.summary || pieData?.summary || "",
        pricingTarget: pieData?.pricing_guardrail?.quoted_price || null,
        pricingMin: pieData?.pricing_guardrail?.recommended_range?.min || null,
        pricingMax: pieData?.pricing_guardrail?.recommended_range?.max || null,
        risks: pieData?.risks || [],
        pitch: pieData?.call_strategy || { emphasize: [] },
        hoursMin: pieData?.hours?.total_hours ? Math.floor(pieData.hours.total_hours * 0.8) : null,
        hoursMax: pieData?.hours?.total_hours || null,
        timelineText: pieData?.timeline?.full_time_weeks ? `${pieData.timeline.full_time_weeks} weeks` : null
      },
      adminPricing: { 
        discountPercent: q.admin_pricing?.discountPercent || 0, 
        flatAdjustment: q.admin_pricing?.flatAdjustment || 0, 
        hourlyRate: q.admin_pricing?.hourlyRate || 40, 
        notes: q.admin_pricing?.notes || "" 
      },
      proposalText: q.proposal_text || "",
      // THE FIX: Adding the workspace link required by the UI component
      links: { 
        detail: `/internal/admin/${q.id}`,
        workspace: `/internal/project/${q.id}`
      }
    };
  });

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="cardInner">
          <div className="kicker"><span className="kickerDot" /> Pipeline</div>
          <h1 className="h2" style={{ marginTop: 8 }}>Website Quotes</h1>
          <p className="pDark" style={{ marginTop: 4 }}>Manage web design leads, adjust pricing, run PIE analysis, and draft proposals.</p>
        </div>
      </div>

      <AdminPipelineClient initialRows={rows} />
    </section>
  );
}
