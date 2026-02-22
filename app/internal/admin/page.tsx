// app/internal/admin/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyObj = Record<string, any>;

function toObj(v: any): AnyObj {
  if (!v) return {};
  if (typeof v === "object") return v as AnyObj;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function pickLatestByQuoteId(rows: any[] | null | undefined) {
  const map = new Map<string, any>();
  for (const row of rows ?? []) {
    const qid = row?.quote_id;
    if (!qid) continue;
    if (!map.has(qid)) map.set(qid, row); // rows already ordered desc
  }
  return map;
}

export default async function InternalAdminPage() {
  const { data: quotesData, error: quotesError } = await supabaseAdmin
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(150);

  if (quotesError) {
    return (
      <main className="section">
        <div className="container">
          <div className="card">
            <div className="cardInner">
              <h1 className="h2">Internal Admin</h1>
              <p className="p" style={{ color: "#ffb4b4" }}>
                Could not load quotes: {quotesError.message}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const quotes = (quotesData ?? []) as any[];

  const leadIds = Array.from(
    new Set(quotes.map((q) => q?.lead_id).filter(Boolean))
  ) as string[];

  const quoteIds = quotes.map((q) => q.id).filter(Boolean) as string[];

  const [{ data: leadsData }, { data: callData }, { data: pieData }] =
    await Promise.all([
      leadIds.length
        ? supabaseAdmin.from("leads").select("*").in("id", leadIds)
        : Promise.resolve({ data: [] as any[] }),
      quoteIds.length
        ? supabaseAdmin
            .from("call_requests")
            .select("*")
            .in("quote_id", quoteIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
      quoteIds.length
        ? supabaseAdmin
            .from("pie_reports")
            .select("id, quote_id, created_at, score, tier, confidence, report")
            .in("quote_id", quoteIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ]);

  const leadsById = new Map<string, any>();
  for (const l of leadsData ?? []) leadsById.set(l.id, l);

  const latestCallByQuoteId = pickLatestByQuoteId(callData as any[]);
  const latestPieByQuoteId = pickLatestByQuoteId(pieData as any[]);

  const items = quotes.map((q) => {
    const debug = toObj(q.debug);
    const scopeSnapshot = toObj(q.scope_snapshot);

    return {
      ...q,
      debug,
      scope_snapshot: scopeSnapshot,
      _lead: q.lead_id ? leadsById.get(q.lead_id) ?? null : null,
      _callRequest: latestCallByQuoteId.get(q.id) ?? null,
      _pie: latestPieByQuoteId.get(q.id) ?? null,
    };
  });

  return <AdminClient initialItems={items} />;
}