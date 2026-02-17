// app/internal/preview/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function InternalPreviewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const quoteId = pick(searchParams, "quoteId").trim();

  // ✅ If a quoteId is provided, show the single quote + lead
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
        intake_normalized,
        scope_snapshot,
        debug,
        leads (
          email,
          phone,
          name
        )
      `
      )
      .eq("id", quoteId)
      .single();

    if (error) {
      return (
        <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
          <h1 style={{ fontSize: 22, marginBottom: 10 }}>Internal Preview</h1>
          <p style={{ color: "#b00" }}>
            Could not load quote <code>{quoteId}</code>: {error.message}
          </p>
          <p style={{ marginTop: 18 }}>
            Tip: open <code>/internal/preview</code> to see recent quote IDs.
          </p>
        </main>
      );
    }

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
            <strong>ID:</strong> <code>{data.id}</code>
          </div>
          <div>
            <strong>Created:</strong> {new Date(data.created_at).toLocaleString()}
          </div>
          <div>
            <strong>Status:</strong> {data.status}
          </div>
          <div>
            <strong>Tier:</strong> {data.tier_recommended ?? "(none)"}
          </div>
          <div>
            <strong>Total:</strong> ${data.estimate_total}{" "}
            <span style={{ opacity: 0.7 }}>
              (range ${data.estimate_low} – ${data.estimate_high})
            </span>
          </div>
          <div style={{ marginTop: 10 }}>
            <strong>Lead:</strong>{" "}
            <span>
              {data.leads?.email ?? "(missing)"}{" "}
              {data.leads?.phone ? `• ${data.leads.phone}` : ""}
            </span>
          </div>
        </div>

        <details open style={{ marginBottom: 14 }}>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>
            intake_normalized
          </summary>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(data.intake_normalized ?? {}, null, 2)}
          </pre>
        </details>

        <details open style={{ marginBottom: 14 }}>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>
            scope_snapshot
          </summary>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(data.scope_snapshot ?? {}, null, 2)}
          </pre>
        </details>

        <details>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>debug</summary>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(data.debug ?? {}, null, 2)}
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
          {(quotes ?? []).map((q: any) => (
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontWeight: 800 }}>
                  ${q.estimate_total}{" "}
                  <span style={{ opacity: 0.7 }}>
                    • {q.tier_recommended ?? "—"} • {q.status}
                  </span>
                </div>
                <div style={{ opacity: 0.7 }}>
                  {new Date(q.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                {q.leads?.email ?? "(no lead email)"} • <code>{q.id}</code>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
