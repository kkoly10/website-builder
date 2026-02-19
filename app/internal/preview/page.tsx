// app/internal/preview/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import RunPieButton from "./RunPieButton";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function firstLead(leads: any) {
  if (!leads) return null;
  return Array.isArray(leads) ? leads[0] ?? null : leads;
}

export default async function InternalPreviewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const quoteId = pick(searchParams, "quoteId").trim();

  // ✅ If a quoteId is provided, show the single quote + lead + call request + pie
  if (quoteId) {
    const { data, error } = await supabaseAdmin
      .from("quotes")
      .select(
        `
        id,
        created_at,
        status,
        tier_recommended,
        estimate_total,
        estimate_low,
        estimate_high,
        intake_raw,
        intake_normalized,
        scope_snapshot,
        debug,
        latest_pie_report_id,
        leads (
          email,
          phone,
          name
        )
      `
      )
      .eq("id", quoteId)
      .single();

    if (error || !data) {
      return (
        <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
          <h1 style={{ fontSize: 22, marginBottom: 10 }}>Internal Preview</h1>
          <p style={{ color: "#b00" }}>
            Could not load quote <code>{quoteId}</code>: {error?.message ?? "Not found"}
          </p>
          <p style={{ marginTop: 18 }}>
            Tip: open <code>/internal/preview</code> to see recent quote IDs.
          </p>
        </main>
      );
    }

    const lead = firstLead((data as any).leads);

    // Latest call request (if any)
    const { data: calls } = await supabaseAdmin
      .from("call_requests")
      .select("id, created_at, status, preferred_times, timezone, notes")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1);

    const call = (calls ?? [])[0] ?? null;

    // Latest PIE report (if any)
    const { data: pies } = await supabaseAdmin
      .from("pie_reports")
      .select("id, created_at, score, tier, confidence, summary, report")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1);

    const pie = (pies ?? [])[0] ?? null;

    return (
      <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Internal Preview</h1>

        <div style={{ marginBottom: 12 }}>
          <a href="/internal/preview" style={{ textDecoration: "underline" }}>
            ← Back to recent quotes
          </a>
        </div>

        <div
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Quote</div>
          <div>
            <strong>ID:</strong> <code>{(data as any).id}</code>
          </div>
          <div>
            <strong>Created:</strong>{" "}
            {new Date((data as any).created_at).toLocaleString()}
          </div>
          <div>
            <strong>Status:</strong> {(data as any).status}
          </div>
          <div>
            <strong>Tier:</strong> {(data as any).tier_recommended ?? "(none)"}
          </div>
          <div>
            <strong>Total:</strong> ${(data as any).estimate_total}{" "}
            <span style={{ opacity: 0.7 }}>
              (range ${(data as any).estimate_low} – ${(data as any).estimate_high})
            </span>
          </div>

          <div style={{ marginTop: 10 }}>
            <strong>Lead:</strong>{" "}
            <span>
              {lead?.email ?? "(missing)"}
              {lead?.phone ? ` • ${lead.phone}` : ""}
              {lead?.name ? ` • ${lead.name}` : ""}
            </span>
          </div>
        </div>

        {/* Call Request */}
        <div
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Scope Call Request</div>
          {call ? (
            <>
              <div>
                <strong>Status:</strong> {call.status}
              </div>
              <div>
                <strong>Preferred times:</strong> {call.preferred_times || "(none)"}
              </div>
              <div>
                <strong>Timezone:</strong> {call.timezone || "(none)"}
              </div>
              <div style={{ marginTop: 10 }}>
                <strong>Notes:</strong>
                <pre style={{ whiteSpace: "pre-wrap" }}>{call.notes || ""}</pre>
              </div>
            </>
          ) : (
            <div style={{ opacity: 0.75 }}>No call request yet.</div>
          )}
        </div>

        {/* PIE */}
        <div
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>PIE Report</div>

          {pie ? (
            <>
              <div>
                <strong>PIE ID:</strong> <code>{pie.id}</code>
              </div>
              <div>
                <strong>Generated:</strong>{" "}
                {new Date(pie.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Score:</strong> {pie.score ?? "—"} / 100
              </div>
              <div>
                <strong>Tier:</strong> {pie.tier ?? "—"}{" "}
                <span style={{ opacity: 0.7 }}>({pie.confidence ?? "—"})</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <strong>Summary:</strong> {pie.summary ?? ""}
              </div>

              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: "pointer", fontWeight: 800 }}>Raw PIE JSON</summary>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(pie.report ?? {}, null, 2)}
                </pre>
              </details>
            </>
          ) : (
            <>
              <div style={{ opacity: 0.75, marginBottom: 10 }}>
                No PIE report stored yet for this quote.
              </div>
              <RunPieButton quoteId={quoteId} />
            </>
          )}
        </div>

        <details open style={{ marginBottom: 14 }}>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>
            intake_normalized
          </summary>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify((data as any).intake_normalized ?? {}, null, 2)}
          </pre>
        </details>

        <details style={{ marginBottom: 14 }}>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>
            intake_raw
          </summary>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify((data as any).intake_raw ?? {}, null, 2)}
          </pre>
        </details>

        <details open style={{ marginBottom: 14 }}>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>
            scope_snapshot
          </summary>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify((data as any).scope_snapshot ?? {}, null, 2)}
          </pre>
        </details>

        <details>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>debug</summary>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify((data as any).debug ?? {}, null, 2)}
          </pre>
        </details>
      </main>
    );
  }

  // ✅ No quoteId: show recent quotes list
  const { data: quotes, error } = await supabaseAdmin
    .from("quotes")
    .select(
      `
      id,
      created_at,
      status,
      tier_recommended,
      estimate_total,
      latest_pie_report_id,
      leads (
        email
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(25);

  return (
    <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 22, marginBottom: 10 }}>Internal Preview</h1>
      <p style={{ opacity: 0.75, marginBottom: 18 }}>
        Recent quotes (click to view full details)
      </p>

      {error ? (
        <p style={{ color: "#b00" }}>Error loading quotes: {error.message}</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {(quotes ?? []).map((q: any) => {
            const lead = firstLead(q.leads);
            return (
              <a
                key={q.id}
                href={`/internal/preview?quoteId=${q.id}`}
                style={{
                  display: "block",
                  border: "1px solid rgba(0,0,0,0.12)",
                  borderRadius: 14,
                  padding: 14,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>
                    ${q.estimate_total}{" "}
                    <span style={{ opacity: 0.7 }}>
                      • {q.tier_recommended ?? "—"} • {q.status}
                      {q.latest_pie_report_id ? " • PIE ✅" : " • PIE —"}
                    </span>
                  </div>
                  <div style={{ opacity: 0.7 }}>
                    {new Date(q.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ marginTop: 6, opacity: 0.8 }}>
                  {lead?.email ?? "(no lead email)"} • <code>{q.id}</code>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
}