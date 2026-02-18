// app/internal/preview/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// OPTIONAL: If you have PIE already and want it shown on the quote detail.
// If you don't have this file yet, comment this import out and the PIE section below.
// import { evaluatePIE } from "@/lib/pie";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

// Handles: object OR array OR null
function one<T = any>(maybe: any): T | null {
  if (!maybe) return null;
  return Array.isArray(maybe) ? (maybe[0] ?? null) : maybe;
}

// OPTIONAL: protect internal page with a key
function gate(keyFromUrl: string) {
  const required = process.env.INTERNAL_PREVIEW_KEY;
  if (!required) return { ok: true, reason: "no_key_set" };
  if (keyFromUrl && keyFromUrl === required) return { ok: true, reason: "key_ok" };
  return { ok: false, reason: "missing_or_wrong_key" };
}

export default async function InternalPreviewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const quoteId = pick(searchParams, "quoteId").trim();
  const key = pick(searchParams, "key").trim();

  const access = gate(key);
  if (!access.ok) {
    return (
      <main className="container" style={{ padding: "48px 0 80px" }}>
        <div className="panel">
          <div className="panelHeader">
            <h1 className="h2">Internal Preview</h1>
            <p className="pDark" style={{ marginTop: 8 }}>
              Access denied. Add <code>?key=...</code> or set <code>INTERNAL_PREVIEW_KEY</code> in Vercel.
            </p>
          </div>
          <div className="panelBody">
            <div className="smallNote">
              Example: <code>/internal/preview?key=YOUR_KEY</code>
            </div>
          </div>
        </div>
      </main>
    );
  }

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
        lead:leads (
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
        <main className="container" style={{ padding: "48px 0 80px" }}>
          <div className="panel">
            <div className="panelHeader">
              <h1 className="h2">Internal Preview</h1>
              <p className="pDark" style={{ marginTop: 8 }}>
                Could not load quote <code>{quoteId}</code>:{" "}
                <span style={{ color: "rgba(255,120,120,0.95)" }}>
                  {error?.message ?? "Not found"}
                </span>
              </p>
            </div>
            <div className="panelBody">
              <a className="btn btnGhost" href={`/internal/preview${key ? `?key=${encodeURIComponent(key)}` : ""}`}>
                ← Back to recent quotes
              </a>
            </div>
          </div>
        </main>
      );
    }

    const lead = one((data as any).lead);

    // OPTIONAL PIE compute (safe)
    // let pie: any = null;
    // try {
    //   pie = evaluatePIE((data as any).intake_normalized ?? {});
    // } catch {}

    return (
      <main className="container" style={{ padding: "48px 0 80px" }}>
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Internal • Quote Preview
        </div>

        <div style={{ height: 12 }} />
        <h1 className="h1" style={{ fontSize: "clamp(28px, 3.2vw, 40px)" }}>
          Quote details
        </h1>
        <p className="p" style={{ maxWidth: 820, marginTop: 10 }}>
          Use this view to validate intake, estimate math, and follow-up details.
        </p>

        <div style={{ height: 18 }} />
        <a
          className="btn btnGhost"
          href={`/internal/preview${key ? `?key=${encodeURIComponent(key)}` : ""}`}
        >
          ← Back to recent quotes
        </a>

        <div style={{ height: 14 }} />

        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Summary</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              Quote ID: <code>{(data as any).id}</code>
            </p>
          </div>
          <div className="panelBody">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="smallNote">
                  <strong>Created:</strong>{" "}
                  {new Date((data as any).created_at).toLocaleString()}
                </div>
                <div className="smallNote" style={{ marginTop: 6 }}>
                  <strong>Status:</strong> {(data as any).status ?? "—"}{" "}
                  <span style={{ opacity: 0.75 }}>
                    • <strong>Tier:</strong> {(data as any).tier_recommended ?? "—"}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 950, fontSize: 22 }}>
                  ${(data as any).estimate_total ?? 0}
                </div>
                <div className="smallNote">
                  Range ${(data as any).estimate_low ?? 0} – ${(data as any).estimate_high ?? 0}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="fieldLabel">Lead</div>
              <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.86)" }}>
                {lead?.email ?? "(missing)"}
                {lead?.phone ? ` • ${lead.phone}` : ""}
                {lead?.name ? ` • ${lead.name}` : ""}
              </div>
            </div>

            {/* OPTIONAL PIE SECTION */}
            {/* {pie && (
              <div style={{ marginTop: 18 }}>
                <div className="fieldLabel">PIE (private)</div>
                <div className="panel" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="panelBody">
                    <div className="row" style={{ gap: 12 }}>
                      <div className="badge">Score: {pie.score}/100</div>
                      <div className="badge">Tier: {pie.tier}</div>
                      <div className="badge">Confidence: {pie.confidence}</div>
                    </div>
                    <div className="smallNote" style={{ marginTop: 10 }}>
                      {pie.summary}
                    </div>
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </section>

        <div style={{ height: 14 }} />

        <details className="panel" open>
          <summary className="panelHeader" style={{ cursor: "pointer" }}>
            <span style={{ fontWeight: 950 }}>intake_normalized</span>
          </summary>
          <div className="panelBody">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {JSON.stringify((data as any).intake_normalized ?? {}, null, 2)}
            </pre>
          </div>
        </details>

        <div style={{ height: 14 }} />

        <details className="panel" open>
          <summary className="panelHeader" style={{ cursor: "pointer" }}>
            <span style={{ fontWeight: 950 }}>scope_snapshot</span>
          </summary>
          <div className="panelBody">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {JSON.stringify((data as any).scope_snapshot ?? {}, null, 2)}
            </pre>
          </div>
        </details>

        <div style={{ height: 14 }} />

        <details className="panel">
          <summary className="panelHeader" style={{ cursor: "pointer" }}>
            <span style={{ fontWeight: 950 }}>debug</span>
          </summary>
          <div className="panelBody">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {JSON.stringify((data as any).debug ?? {}, null, 2)}
            </pre>
          </div>
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
      lead:leads (
        email
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(25);

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Internal • Quotes
      </div>

      <div style={{ height: 12 }} />
      <h1 className="h1" style={{ fontSize: "clamp(28px, 3.2vw, 40px)" }}>
        Recent quotes
      </h1>
      <p className="p" style={{ maxWidth: 820, marginTop: 10 }}>
        Click any quote to review details (intake + totals + lead info).
      </p>

      <div style={{ height: 18 }} />

      {error ? (
        <div className="panel">
          <div className="panelHeader">
            <h2 className="h2">Error</h2>
          </div>
          <div className="panelBody">
            <p style={{ color: "rgba(255,120,120,0.95)" }}>
              Error loading quotes: {error.message}
            </p>
          </div>
        </div>
      ) : (
        <div className="tierGrid" style={{ gridTemplateColumns: "repeat(1, 1fr)" }}>
          {(quotes ?? []).map((q: any) => {
            const lead = one(q.lead);
            const href = `/internal/preview?quoteId=${encodeURIComponent(q.id)}${
              key ? `&key=${encodeURIComponent(key)}` : ""
            }`;

            return (
              <a key={q.id} href={href} className="card cardHover" style={{ display: "block" }}>
                <div className="cardInner">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>
                      ${q.estimate_total ?? 0}{" "}
                      <span style={{ opacity: 0.7, fontWeight: 800 }}>
                        • {q.tier_recommended ?? "—"} • {q.status ?? "—"}
                      </span>
                    </div>
                    <div style={{ opacity: 0.7, fontWeight: 800, fontSize: 13 }}>
                      {new Date(q.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ marginTop: 8, opacity: 0.85, fontWeight: 800 }}>
                    {lead?.email ?? "(no lead email)"}{" "}
                    <span style={{ opacity: 0.7 }}>•</span> <code>{q.id}</code>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
}