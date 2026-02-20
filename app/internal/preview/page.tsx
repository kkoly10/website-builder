// app/internal/preview/page.tsx
import { createClient } from "@supabase/supabase-js";
import { ensurePieForQuoteId } from "@/lib/pie/ensurePie";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function db() {
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function first(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function money(n: any) {
  const val = Number(n || 0);
  return `$${Math.round(val).toLocaleString()}`;
}

async function resolveSearchParams(
  sp:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>
    | undefined
) {
  if (!sp) return {};
  if (typeof (sp as any).then === "function") return await (sp as any);
  return sp as Record<string, string | string[] | undefined>;
}

export default async function InternalPreviewPage({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await resolveSearchParams(searchParams);
  const quoteId = first(sp, "quoteId").trim();

  const supabase = db();

  // If a quoteId is present, show detail view
  if (quoteId) {
    const { data: quote, error: quoteErr } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (quoteErr || !quote) {
      return (
        <main className="container" style={{ padding: "48px 0 80px" }}>
          <div className="kicker"><span className="kickerDot" /> Internal Preview</div>
          <div style={{ height: 12 }} />
          <h1 className="h1">Quote not found</h1>
          <p className="p">{quoteErr?.message || "No quote found for this ID."}</p>
          <a className="btn btnGhost" href="/internal/preview">← Back to list</a>
        </main>
      );
    }

    // Try to auto-generate PIE if missing (deterministic, no AI)
    if (!quote.latest_pie_report_id) {
      try {
        await ensurePieForQuoteId(quoteId);
        // reload quote after linking
        const refreshed = await supabase.from("quotes").select("*").eq("id", quoteId).single();
        if (refreshed.data) Object.assign(quote, refreshed.data);
      } catch (e) {
        // don't crash page; we'll show a button/failure note below
      }
    }

    const { data: lead } = quote.lead_id
      ? await supabase.from("leads").select("*").eq("id", quote.lead_id).single()
      : { data: null as any };

    const { data: callReq } = await supabase
      .from("call_requests")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let pie: any = null;

    if (quote.latest_pie_report_id) {
      const pieRes = await supabase
        .from("pie_reports")
        .select("*")
        .eq("id", quote.latest_pie_report_id)
        .single();
      pie = pieRes.data || null;
    } else {
      // fallback if linked id missing but row exists by quote_id
      const pieRes = await supabase
        .from("pie_reports")
        .select("*")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      pie = pieRes.data || null;
    }

    return (
      <main className="container" style={{ padding: "48px 0 80px" }}>
        <div className="kicker"><span className="kickerDot" /> Internal Preview • Quote Detail</div>
        <div style={{ height: 12 }} />
        <h1 className="h2">Quote detail</h1>

        <div style={{ height: 14 }} />

        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Summary</div>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 8 }}>
            <div className="pDark"><strong>Quote ID:</strong> <code>{quote.id}</code></div>
            <div className="pDark"><strong>Status:</strong> {quote.status || "new"}</div>
            <div className="pDark"><strong>Tier:</strong> {quote.tier_recommended || "—"}</div>
            <div className="pDark"><strong>Estimate:</strong> {money(quote.estimate_total)} ({money(quote.estimate_low)}–{money(quote.estimate_high)})</div>
            <div className="pDark"><strong>Created:</strong> {quote.created_at ? new Date(quote.created_at).toLocaleString() : "—"}</div>
            <div className="pDark"><strong>Lead:</strong> {lead?.email || "—"} {lead?.phone ? `• ${lead.phone}` : ""}</div>
          </div>
        </section>

        <div style={{ height: 14 }} />

        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Call request</div>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 8 }}>
            {callReq ? (
              <>
                <div className="pDark"><strong>Status:</strong> {callReq.status || "—"}</div>
                <div className="pDark"><strong>Best time:</strong> {callReq.best_time_to_call || callReq.preferred_times || "—"}</div>
                <div className="pDark"><strong>Timezone:</strong> {callReq.timezone || "—"}</div>
                <div className="pDark"><strong>Notes:</strong> {callReq.notes || "—"}</div>
              </>
            ) : (
              <div className="pDark">No call request yet.</div>
            )}
          </div>
        </section>

        <div style={{ height: 14 }} />

        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>PIE report</div>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 10 }}>
            {!pie ? (
              <>
                <div className="pDark">No PIE report found for this quote yet.</div>
                <a
                  className="btn btnPrimary"
                  href={`/api/internal/backfill-pie?quoteId=${encodeURIComponent(quote.id)}`}
                  style={{ width: "fit-content" }}
                >
                  Generate PIE now →
                </a>
                <div className="smallNote">
                  This uses deterministic PIE v1 (no AI) and links it to this quote.
                </div>
              </>
            ) : (
              <>
                <div className="pDark">
                  <strong>PIE ID:</strong> <code>{pie.id}</code> • <strong>Score:</strong> {pie.score ?? "—"} • <strong>Tier:</strong> {pie.tier ?? "—"} • <strong>Confidence:</strong> {pie.confidence ?? "—"}
                </div>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.82)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 12,
                    padding: 12,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
{JSON.stringify(pie.report || pie.payload || {}, null, 2)}
                </pre>
              </>
            )}
          </div>
        </section>

        <div style={{ height: 14 }} />
        <div className="row">
          <a className="btn btnGhost" href="/internal/preview">← Back to list</a>
        </div>
      </main>
    );
  }

  // LIST VIEW (no quoteId)
  const { data: quotes = [] } = await supabase
    .from("quotes")
    .select("id, created_at, status, tier_recommended, estimate_total, lead_id, latest_pie_report_id")
    .order("created_at", { ascending: false })
    .limit(50);

  const leadIds = Array.from(new Set((quotes || []).map((q: any) => q.lead_id).filter(Boolean)));

  let leadMap = new Map<string, any>();
  if (leadIds.length > 0) {
    const { data: leads = [] } = await supabase
      .from("leads")
      .select("id, email, phone")
      .in("id", leadIds);

    leadMap = new Map((leads || []).map((l: any) => [l.id, l]));
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker"><span className="kickerDot" /> Internal Preview</div>
      <div style={{ height: 12 }} />
      <h1 className="h1">Recent quotes</h1>
      <p className="p">Tap “View details” to open the full quote, call request, and PIE report.</p>

      <div className="row" style={{ marginTop: 12 }}>
        <a className="btn btnPrimary" href="/api/internal/backfill-pie">
          Backfill missing PIE (all) →
        </a>
      </div>

      <div style={{ height: 14 }} />

      <div style={{ display: "grid", gap: 12 }}>
        {quotes.map((q: any) => {
          const lead = leadMap.get(q.lead_id);
          return (
            <section className="panel" key={q.id}>
              <div className="panelBody" style={{ display: "grid", gap: 8 }}>
                <div className="pDark" style={{ fontWeight: 900 }}>
                  {money(q.estimate_total)} • {q.tier_recommended || "—"} • {q.status || "new"} • PIE {q.latest_pie_report_id ? "✓" : "—"}
                </div>
                <div className="smallNote">{q.created_at ? new Date(q.created_at).toLocaleString() : "—"}</div>
                <div className="pDark">
                  {(lead?.email || "No email")} • <code>{q.id}</code>
                </div>

                <div className="row">
                  {/* native anchor avoids iOS/client-link weirdness */}
                  <a className="btn btnPrimary" href={`/internal/preview?quoteId=${encodeURIComponent(q.id)}`}>
                    View details →
                  </a>
                  <a className="btn btnGhost" href={`/internal/preview?quoteId=${encodeURIComponent(q.id)}`}>
                    Open link
                  </a>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
