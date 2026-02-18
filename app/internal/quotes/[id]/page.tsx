// app/internal/quotes/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { evaluatePIE } from "@/lib/pie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getKey(searchParams: SearchParams) {
  const expected = process.env.INTERNAL_DASHBOARD_KEY;
  if (!expected) return "";
  const k = searchParams.key;
  const key = Array.isArray(k) ? (k[0] ?? "") : (k ?? "");
  if (key !== expected) notFound();
  return key;
}

function firstLead(leads: any) {
  if (!leads) return null;
  return Array.isArray(leads) ? leads[0] ?? null : leads;
}

export default async function QuoteDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SearchParams;
}) {
  const key = getKey(searchParams);
  const quoteId = params.id;

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
      leads ( email, phone, name )
    `
    )
    .eq("id", quoteId)
    .single();

  if (error || !data) {
    return (
      <main style={{ padding: 28, fontFamily: "ui-sans-serif, system-ui" }}>
        <p style={{ color: "#b00" }}>
          Could not load quote <code>{quoteId}</code>: {error?.message ?? "Not found"}
        </p>
      </main>
    );
  }

  const lead = firstLead((data as any).leads);

  // Compute PIE live (unknown keys are OK; PIE can ignore what it doesn’t need)
  let pie: any = null;
  try {
    pie = evaluatePIE({
      ...(data as any).intake_normalized,
      scopeSnapshot: (data as any).scope_snapshot ?? {},
      estimate: {
        total: (data as any).estimate_total,
        low: (data as any).estimate_low,
        high: (data as any).estimate_high,
        tier: (data as any).tier_recommended,
      },
      lead: lead ?? {},
    });
  } catch (e: any) {
    pie = { error: e?.message ?? "Failed to compute PIE" };
  }

  // Load latest saved PIE (optional)
  const { data: savedPie } = await supabaseAdmin
    .from("pie_reports")
    .select("id,created_at,report_json")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false })
    .limit(1);

  const saved = (savedPie ?? [])[0] ?? null;

  const backHref = `/internal/quotes${key ? `?key=${encodeURIComponent(key)}` : ""}`;

  return (
    <main style={{ padding: 28, fontFamily: "ui-sans-serif, system-ui" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href={backHref} style={{ textDecoration: "underline" }}>
          ← Back to quotes
        </Link>
      </div>

      <h1 style={{ fontSize: 22, marginBottom: 10 }}>Quote Details</h1>

      <div style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 16 }}>
        <div><strong>ID:</strong> <code>{(data as any).id}</code></div>
        <div><strong>Created:</strong> {new Date((data as any).created_at).toLocaleString()}</div>
        <div><strong>Status:</strong> {(data as any).status ?? "—"}</div>
        <div><strong>Tier:</strong> {(data as any).tier_recommended ?? "—"}</div>
        <div>
          <strong>Total:</strong> ${(data as any).estimate_total}{" "}
          <span style={{ opacity: 0.7 }}>
            (range ${(data as any).estimate_low} – ${(data as any).estimate_high})
          </span>
        </div>

        <div style={{ marginTop: 10 }}>
          <strong>Lead:</strong>{" "}
          {lead?.email ?? "(missing)"}
          {lead?.phone ? ` • ${lead.phone}` : ""}
          {lead?.name ? ` • ${lead.name}` : ""}
        </div>
      </div>

      <div style={{ height: 16 }} />

      <section style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>PIE (computed live)</div>

        {pie?.error ? (
          <p style={{ color: "#b00" }}>{pie.error}</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <Box label="Score" value={`${pie.score ?? "—"} / 100`} />
              <Box label="Tier" value={pie.tier ?? "—"} />
              <Box label="Confidence" value={pie.confidence ?? "—"} />
            </div>

            <div style={{ marginTop: 12 }}>
              <strong>Summary:</strong> {pie.summary ?? "—"}
            </div>
          </>
        )}

        <form action="/api/internal/save-pie" method="post" style={{ marginTop: 12 }}>
          <input type="hidden" name="quoteId" value={quoteId} />
          {key ? <input type="hidden" name="key" value={key} /> : null}
          <button
            type="submit"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.2)",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Save PIE to Supabase
          </button>
        </form>

        {saved ? (
          <p style={{ marginTop: 10, opacity: 0.8 }}>
            Latest saved PIE: <code>{saved.id}</code> •{" "}
            {new Date(saved.created_at).toLocaleString()}
          </p>
        ) : (
          <p style={{ marginTop: 10, opacity: 0.7 }}>No saved PIE yet.</p>
        )}
      </section>

      <div style={{ height: 16 }} />

      <details open style={{ marginBottom: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 800 }}>intake_normalized</summary>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify((data as any).intake_normalized ?? {}, null, 2)}
        </pre>
      </details>

      <details open style={{ marginBottom: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 800 }}>scope_snapshot</summary>
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

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
    </div>
  );
}