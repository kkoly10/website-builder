// app/internal/dashboard/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

export default async function InternalDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const token = pick(searchParams, "token").trim();

  if (!requireToken(token)) {
    return (
      <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Internal Dashboard</h1>
        <p style={{ color: "#b00", fontWeight: 700 }}>
          Unauthorized. Missing/invalid token.
        </p>
        <p style={{ marginTop: 12, opacity: 0.8 }}>
          Add <code>INTERNAL_DASH_TOKEN</code> in Vercel env vars, then open:
          <br />
          <code>/internal/dashboard?token=YOUR_TOKEN</code>
        </p>
      </main>
    );
  }

  const { data: quotes, error } = await supabaseAdmin
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
      deposit_status,
      leads (
        email,
        phone,
        name
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Internal Dashboard</h1>
        <a
          href={`/internal/preview?token=${encodeURIComponent(token)}`}
          style={{ textDecoration: "underline", opacity: 0.85 }}
        >
          (optional) Preview page
        </a>
      </div>

      <p style={{ opacity: 0.75, marginBottom: 18 }}>
        Recent quotes — click one to manage status, lock scope, and deposit.
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
                href={`/internal/quotes/${q.id}?token=${encodeURIComponent(token)}`}
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
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>
                    ${q.estimate_total}{" "}
                    <span style={{ opacity: 0.7, fontWeight: 700 }}>
                      • {q.tier_recommended ?? "—"} • {q.status ?? "new"}
                      {q.deposit_status ? ` • deposit:${q.deposit_status}` : ""}
                    </span>
                  </div>
                  <div style={{ opacity: 0.7 }}>
                    {new Date(q.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ marginTop: 6, opacity: 0.85 }}>
                  {lead?.email ?? "(no lead email)"}{" "}
                  {lead?.phone ? `• ${lead.phone}` : ""}{" "}
                  <span style={{ opacity: 0.75 }}>
                    • ID: <code>{q.id}</code>
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
}