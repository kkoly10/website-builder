// app/internal/dashboard/page.tsx
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireInternalToken } from "@/lib/internalToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

const STATUSES = [
  "new",
  "awaiting_call",
  "call_scheduled",
  "scope_locked",
  "deposit_sent",
  "deposit_paid",
  "in_progress",
  "delivered",
  "closed_won",
  "closed_lost",
] as const;

export default async function InternalDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const token = pick(searchParams, "token").trim();
  const quoteId = pick(searchParams, "quoteId").trim();

  const auth = requireInternalToken(token);
  if (!auth.ok) {
    return (
      <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Internal Dashboard</h1>
        <p style={{ color: "#b00" }}>{auth.error}</p>
        <p style={{ marginTop: 12, opacity: 0.8 }}>
          Add <code>INTERNAL_DASH_TOKEN</code> to Vercel env vars and open:
        </p>
        <pre style={{ background: "#111", color: "#fff", padding: 12, borderRadius: 10 }}>
          /internal/dashboard?token=YOUR_TOKEN
        </pre>
      </main>
    );
  }

  // If viewing a specific quote
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
        locked_scope_snapshot,
        scope_locked_at,
        deposit_url,
        deposit_status,
        deposit_sent_at,
        deposit_paid_at,
        booked_call_url,
        booked_call_at,
        internal_notes,
        leads (
          email,
          phone,
          name
        )
      `
      )
      .eq("id", quoteId)
      .single();

    const pie = await supabaseAdmin
      .from("pie_reports")
      .select("id, created_at, report")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return (
        <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
          <h1 style={{ fontSize: 22, marginBottom: 10 }}>Internal Dashboard</h1>
          <p style={{ color: "#b00" }}>
            Could not load quote <code>{quoteId}</code>: {error?.message ?? "Not found"}
          </p>
          <p style={{ marginTop: 14 }}>
            <Link href={`/internal/dashboard?token=${token}`} style={{ textDecoration: "underline" }}>
              ← Back to quotes
            </Link>
          </p>
        </main>
      );
    }

    const lead = Array.isArray((data as any).leads) ? (data as any).leads[0] : (data as any).leads;

    return (
      <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Internal Dashboard</h1>

        <div style={{ marginBottom: 14 }}>
          <Link href={`/internal/dashboard?token=${token}`} style={{ textDecoration: "underline" }}>
            ← Back to quotes
          </Link>
          <span style={{ marginLeft: 12, opacity: 0.7 }}>
            • Quote ID: <code>{(data as any).id}</code>
          </span>
        </div>

        <div style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>
              Total: ${(data as any).estimate_total}{" "}
              <span style={{ opacity: 0.7 }}>
                (range ${(data as any).estimate_low} – ${(data as any).estimate_high})
              </span>
            </div>
            <div style={{ opacity: 0.7 }}>
              {new Date((data as any).created_at).toLocaleString()}
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <strong>Lead:</strong>{" "}
            {lead?.email ?? "(missing)"}
            {lead?.phone ? ` • ${lead.phone}` : ""}
            {lead?.name ? ` • ${lead.name}` : ""}
          </div>

          <div style={{ marginTop: 10 }}>
            <strong>Status:</strong> {(data as any).status ?? "new"}{" "}
            <span style={{ opacity: 0.7 }}>
              • Tier: {(data as any).tier_recommended ?? "—"}
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ height: 14 }} />

        <div style={{ display: "grid", gap: 12 }}>
          {/* Update status */}
          <form action="/api/internal/quote/update" method="post" style={card()}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="quoteId" value={(data as any).id} />

            <div style={{ fontWeight: 800, marginBottom: 8 }}>Pipeline</div>

            <label style={label()}>Set status</label>
            <select name="status" defaultValue={(data as any).status ?? "new"} style={input()}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div style={{ height: 10 }} />

            <label style={label()}>Internal notes</label>
            <textarea
              name="internal_notes"
              defaultValue={(data as any).internal_notes ?? ""}
              style={{ ...input(), minHeight: 90 }}
              placeholder="Call notes, objections, scope tradeoffs…"
            />

            <div style={{ height: 12 }} />

            <button type="submit" style={btn()}>
              Save
            </button>
          </form>

          {/* Lock scope */}
          <form action="/api/internal/quote/lock-scope" method="post" style={card()}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="quoteId" value={(data as any).id} />

            <div style={{ fontWeight: 800, marginBottom: 6 }}>Lock scope</div>
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              Locks the current <code>scope_snapshot</code> into <code>locked_scope_snapshot</code> and updates status to <code>scope_locked</code>.
            </div>

            <div style={{ height: 10 }} />

            <button type="submit" style={btn()}>
              Lock scope from current snapshot
            </button>

            {(data as any).scope_locked_at ? (
              <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
                Locked at: {new Date((data as any).scope_locked_at).toLocaleString()}
              </div>
            ) : null}
          </form>

          {/* Deposit link */}
          <form action="/api/internal/quote/update" method="post" style={card()}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="quoteId" value={(data as any).id} />
            <input type="hidden" name="setDepositSent" value="1" />

            <div style={{ fontWeight: 800, marginBottom: 6 }}>Deposit link</div>
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              Paste a Stripe/Invoice/Payment link after the call. This will set status to <code>deposit_sent</code>.
            </div>

            <div style={{ height: 10 }} />

            <label style={label()}>Deposit URL</label>
            <input
              name="deposit_url"
              defaultValue={(data as any).deposit_url ?? ""}
              style={input()}
              placeholder="https://…"
            />

            <div style={{ height: 10 }} />

            <label style={label()}>Deposit status</label>
            <select name="deposit_status" defaultValue={(data as any).deposit_status ?? "not_sent"} style={input()}>
              <option value="not_sent">not_sent</option>
              <option value="sent">sent</option>
              <option value="paid">paid</option>
            </select>

            <div style={{ height: 12 }} />

            <button type="submit" style={btn()}>
              Save deposit
            </button>

            {(data as any).deposit_sent_at ? (
              <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
                Sent at: {new Date((data as any).deposit_sent_at).toLocaleString()}
              </div>
            ) : null}
            {(data as any).deposit_paid_at ? (
              <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
                Paid at: {new Date((data as any).deposit_paid_at).toLocaleString()}
              </div>
            ) : null}
          </form>

          {/* PIE */}
          <form action="/api/internal/quote/run-pie" method="post" style={card()}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="quoteId" value={(data as any).id} />
            <div style={{ fontWeight: 800, marginBottom: 6 }}>PIE</div>

            {pie.data ? (
              <>
                <div style={{ opacity: 0.8, fontSize: 13 }}>
                  Latest PIE: {new Date(pie.data.created_at).toLocaleString()}
                </div>
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>View PIE JSON</summary>
                  <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
                    {JSON.stringify(pie.data.report, null, 2)}
                  </pre>
                </details>
              </>
            ) : (
              <div style={{ opacity: 0.8, fontSize: 13 }}>
                No PIE report yet.
              </div>
            )}

            <div style={{ height: 12 }} />

            <button type="submit" style={btn()}>
              Run PIE and store
            </button>
          </form>
        </div>

        {/* Data views */}
        <div style={{ height: 14 }} />

        <details open style={card()}>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>scope_snapshot</summary>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
            {JSON.stringify((data as any).scope_snapshot ?? {}, null, 2)}
          </pre>
        </details>

        <details style={card()}>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>locked_scope_snapshot</summary>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
            {JSON.stringify((data as any).locked_scope_snapshot ?? {}, null, 2)}
          </pre>
        </details>

        <details style={card()}>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>intake_normalized</summary>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
            {JSON.stringify((data as any).intake_normalized ?? {}, null, 2)}
          </pre>
        </details>
      </main>
    );
  }

  // List view
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
    .limit(50);

  return (
    <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 22, marginBottom: 10 }}>Internal Dashboard</h1>
      <p style={{ opacity: 0.75, marginBottom: 18 }}>
        Recent quotes (click to open)
      </p>

      {error ? (
        <p style={{ color: "#b00" }}>Error loading quotes: {error.message}</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {(quotes ?? []).map((q: any) => {
            const lead = Array.isArray(q.leads) ? q.leads[0] : q.leads;
            return (
              <a
                key={q.id}
                href={`/internal/dashboard?token=${token}&quoteId=${q.id}`}
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
                      • {q.tier_recommended ?? "—"} • {q.status ?? "new"}
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

function card() {
  return {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 16,
    background: "#fff",
  } as const;
}

function label() {
  return { display: "block", fontSize: 12, opacity: 0.75, marginBottom: 6 } as const;
}

function input() {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.16)",
    outline: "none",
    fontSize: 14,
  } as const;
}

function btn() {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "#111",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  } as const;
}