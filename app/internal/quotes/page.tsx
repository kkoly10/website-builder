// app/internal/quotes/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getKey(searchParams: SearchParams) {
  const expected = process.env.INTERNAL_DASHBOARD_KEY;
  if (!expected) return ""; // allow if not set (dev)
  const k = searchParams.key;
  const key = Array.isArray(k) ? (k[0] ?? "") : (k ?? "");
  if (key !== expected) notFound();
  return key;
}

function firstLead(leads: any) {
  if (!leads) return null;
  return Array.isArray(leads) ? leads[0] ?? null : leads;
}

export default async function InternalQuotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const key = getKey(searchParams);

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
      leads ( email, phone, name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main style={{ padding: 28, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>Internal — Quotes</h1>
      <p style={{ opacity: 0.7, marginBottom: 16 }}>
        Latest 50 quotes • click one to see full input + PIE
      </p>

      {error ? (
        <p style={{ color: "#b00" }}>Error: {error.message}</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {(quotes ?? []).map((q: any) => {
            const lead = firstLead(q.leads);
            return (
              <Link
                key={q.id}
                href={`/internal/quotes/${q.id}${key ? `?key=${encodeURIComponent(key)}` : ""}`}
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
                      • {q.tier_recommended ?? "—"} • {q.status ?? "—"}
                    </span>
                  </div>
                  <div style={{ opacity: 0.7 }}>
                    {new Date(q.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ marginTop: 6, opacity: 0.85 }}>
                  {lead?.email ?? "(no email)"}{" "}
                  {lead?.phone ? ` • ${lead.phone}` : ""}{" "}
                  <span style={{ opacity: 0.75 }}>• id:</span> <code>{q.id}</code>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}