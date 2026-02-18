// app/internal/quotes/[id]/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { evaluatePIE } from "@/lib/pie";

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

function requireToken(token: string) {
  const expected = process.env.INTERNAL_DASH_TOKEN || "";
  return expected && token && token === expected;
}

const STATUSES = [
  "new",
  "call_booked",
  "scope_locked",
  "deposit_sent",
  "deposit_paid",
  "active",
  "done",
  "lost",
] as const;

export default async function QuoteOpsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SearchParams;
}) {
  const token = pick(searchParams, "token").trim();
  const id = String(params.id || "").trim();

  if (!requireToken(token)) {
    return (
      <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Quote</h1>
        <p style={{ color: "#b00", fontWeight: 700 }}>Unauthorized.</p>
      </main>
    );
  }

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
      scope_locked_snapshot,
      scope_locked_at,
      deposit_link,
      deposit_amount,
      deposit_status,
      deposit_sent_at,
      deposit_paid_at,
      leads (
        email,
        phone,
        name
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Quote</h1>
        <p style={{ color: "#b00" }}>
          Could not load quote <code>{id}</code>: {error?.message ?? "Not found"}
        </p>
        <p style={{ marginTop: 18 }}>
          <a
            href={`/internal/dashboard?token=${encodeURIComponent(token)}`}
            style={{ textDecoration: "underline" }}
          >
            ← Back to dashboard
          </a>
        </p>
      </main>
    );
  }

  const lead = firstLead((data as any).leads);

  // PIE (internal) — safe try/catch
  let pie: any = null;
  try {
    pie = evaluatePIE((data as any).intake_normalized ?? {});
  } catch {
    pie = null;
  }

  return (
    <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
      <div style={{ marginBottom: 12 }}>
        <a
          href={`/internal/dashboard?token=${encodeURIComponent(token)}`}
          style={{ textDecoration: "underline" }}
        >
          ← Back to dashboard
        </a>
      </div>

      <h1 style={{ fontSize: 22, marginBottom: 10 }}>Quote Ops</h1>

      <section
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Summary</div>

        <div><strong>ID:</strong> <code>{(data as any).id}</code></div>
        <div><strong>Created:</strong> {new Date((data as any).created_at).toLocaleString()}</div>
        <div><strong>Status:</strong> {(data as any).status ?? "new"}</div>
        <div><strong>Tier:</strong> {(data as any).tier_recommended ?? "(none)"}</div>
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
      </section>

      {/* STATUS */}
      <section
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Status</div>

        <form action="/api/internal/quote-action" method="post" style={{ display: "grid", gap: 10 }}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="quoteId" value={(data as any).id} />
          <input type="hidden" name="action" value="update_status" />

          <select name="status" defaultValue={(data as any).status ?? "new"} style={{ padding: 10, borderRadius: 10 }}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button type="submit" style={{ padding: 10, borderRadius: 10, fontWeight: 800 }}>
            Save status
          </button>
        </form>
      </section>

      {/* LOCK SCOPE */}
      <section
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Lock scope</div>
        <div style={{ opacity: 0.8, marginBottom: 10 }}>
          After your video call, lock the scope snapshot so it becomes the “source of truth”.
        </div>

        <form action="/api/internal/quote-action" method="post">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="quoteId" value={(data as any).id} />
          <input type="hidden" name="action" value="lock_scope" />
          <button type="submit" style={{ padding: 10, borderRadius: 10, fontWeight: 900 }}>
            Lock current scope snapshot
          </button>
        </form>

        {(data as any).scope_locked_at ? (
          <div style={{ marginTop: 10, opacity: 0.8 }}>
            Locked at: {new Date((data as any).scope_locked_at).toLocaleString()}
          </div>
        ) : null}
      </section>

      {/* DEPOSIT LINK */}
      <section
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Deposit</div>
        <div style={{ opacity: 0.8, marginBottom: 10 }}>
          Payment happens after the call. Paste a deposit link (Stripe payment link works great).
        </div>

        <form action="/api/internal/quote-action" method="post" style={{ display: "grid", gap: 10 }}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="quoteId" value={(data as any).id} />
          <input type="hidden" name="action" value="set_deposit" />

          <input
            name="deposit_link"
            defaultValue={(data as any).deposit_link ?? ""}
            placeholder="https://buy.stripe.com/..."
            style={{ padding: 10, borderRadius: 10 }}
          />
          <input
            name="deposit_amount"
            defaultValue={(data as any).deposit_amount ?? ""}
            placeholder="Deposit amount (e.g., 250)"
            style={{ padding: 10, borderRadius: 10 }}
          />

          <button type="submit" style={{ padding: 10, borderRadius: 10, fontWeight: 900 }}>
            Save deposit link
          </button>
        </form>

        <div style={{ marginTop: 10, opacity: 0.85 }}>
          <strong>Deposit status:</strong> {(data as any).deposit_status ?? "—"}
        </div>

        <form action="/api/internal/quote-action" method="post" style={{ marginTop: 10 }}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="quoteId" value={(data as any).id} />
          <input type="hidden" name="action" value="mark_deposit_paid" />
          <button type="submit" style={{ padding: 10, borderRadius: 10, fontWeight: 900 }}>
            Mark deposit paid
          </button>
        </form>
      </section>

      {/* PIE (internal) */}
      <section
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 8 }}>PIE (Internal)</div>

        {!pie ? (
          <div style={{ opacity: 0.8 }}>PIE could not be evaluated for this quote.</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Score</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{pie.score} / 100</div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Tier</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{pie.tier}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Confidence</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{pie.confidence}</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Summary</div>
              <div style={{ opacity: 0.9 }}>{pie.summary}</div>
            </div>

            {pie.risks?.length ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Risk flags</div>
                <ul>
                  {pie.risks.map((r: string) => (
                    <li key={r}>🚩 {r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* raw */}
      <details>
        <summary style={{ cursor: "pointer", fontWeight: 900 }}>Raw JSON</summary>
        <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </main>
  );
}