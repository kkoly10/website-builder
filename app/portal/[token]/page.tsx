// app/portal/[token]/page.tsx
import PortalClient from "./PortalClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function tryResolveQuoteIdFromToken(token: string): Promise<string | null> {
  const db: any = supabaseAdmin;

  // If token is already a quote UUID (helpful fallback)
  if (isUuid(token)) return token;

  // Try common table/column patterns without crashing if table doesn't exist yet
  const attempts: Array<{ table: string; tokenCol: string; quoteCol: string }> = [
    { table: "portal_access", tokenCol: "token", quoteCol: "quote_id" },
    { table: "portal_access", tokenCol: "portal_token", quoteCol: "quote_id" },
    { table: "portal_links", tokenCol: "token", quoteCol: "quote_id" },
    { table: "client_portals", tokenCol: "token", quoteCol: "quote_id" },
    { table: "customer_portals", tokenCol: "token", quoteCol: "quote_id" },
  ];

  for (const a of attempts) {
    try {
      const { data, error } = await db
        .from(a.table)
        .select(`${a.quoteCol}`)
        .eq(a.tokenCol, token)
        .maybeSingle();

      if (!error && data?.[a.quoteCol]) return String(data[a.quoteCol]);
    } catch {
      // ignore and continue
    }
  }

  return null;
}

async function getQuoteBundleByQuoteId(quoteId: string) {
  const db: any = supabaseAdmin;

  let quote: AnyRow | null = null;
  let lead: AnyRow | null = null;
  let callRequest: AnyRow | null = null;
  let pieReport: AnyRow | null = null;
  let milestones: AnyRow[] = [];

  // Quote
  {
    const { data } = await db.from("quotes").select("*").eq("id", quoteId).maybeSingle();
    quote = data ?? null;
  }

  // Lead (try by quote.lead_id first, then leads.quote_id)
  if (quote?.lead_id) {
    const { data } = await db.from("leads").select("*").eq("id", quote.lead_id).maybeSingle();
    lead = data ?? null;
  }
  if (!lead) {
    const { data } = await db
      .from("leads")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    lead = data ?? null;
  }

  // Call request
  {
    const { data } = await db
      .from("call_requests")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    callRequest = data ?? null;
  }

  // PIE report (prefer quote_id; fallback project_id if legacy)
  {
    let res = await db
      .from("pie_reports")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!res?.data) {
      res = await db
        .from("pie_reports")
        .select("*")
        .eq("project_id", quoteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    }

    pieReport = res?.data ?? null;
  }

  // Optional milestones (won’t fail build if table isn't there)
  // We try a few common names so you can create whichever one you want later.
  for (const tableName of ["project_milestones", "milestones", "portal_milestones"]) {
    try {
      const { data, error } = await db
        .from(tableName)
        .select("*")
        .eq("quote_id", quoteId)
        .order("sort_order", { ascending: true });

      if (!error && Array.isArray(data)) {
        milestones = data;
        break;
      }
    } catch {
      // ignore
    }
  }

  return { quote, lead, callRequest, pieReport, milestones };
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const quoteId = await tryResolveQuoteIdFromToken(token);

  if (!quoteId) {
    return (
      <div className="section">
        <div className="container">
          <div className="panel">
            <div className="panelHeader">
              <h1 className="h2" style={{ margin: 0 }}>
                Client Portal
              </h1>
            </div>
            <div className="panelBody">
              <p className="p" style={{ marginTop: 0 }}>
                This portal link is invalid or expired.
              </p>
              <p className="pDark" style={{ marginBottom: 0 }}>
                If you’re the client, ask CrecyStudio to resend your portal link.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const bundle = await getQuoteBundleByQuoteId(quoteId);

  return <PortalClient token={token} quoteId={quoteId} bundle={bundle} />;
}