// app/internal/dashboard/[id]/page.tsx
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import QuoteEditorClient from "@/app/internal/dashboard/QuoteEditorClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function firstLead(leads: any) {
  if (!leads) return null;
  return Array.isArray(leads) ? leads[0] ?? null : leads;
}

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const quoteId = String(params?.id ?? "").trim();

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
      deposit_link_url,
      deposit_amount,
      scope_locked_at,
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
      <main className="container" style={{ padding: "48px 0 80px" }}>
        <h1 className="h2">Quote not found</h1>
        <p className="pDark" style={{ marginTop: 10 }}>
          {error?.message ?? "Unknown error"}
        </p>
        <div style={{ height: 18 }} />
        <Link className="btn btnGhost" href="/internal/dashboard">
          ← Back
        </Link>
      </main>
    );
  }

  const lead = firstLead((data as any).leads);

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Internal • Quote detail
      </div>

      <div style={{ height: 10 }} />
      <h1 className="h1">Quote</h1>

      <div style={{ height: 14 }} />
      <div className="row" style={{ justifyContent: "space-between" }}>
        <Link className="btn btnGhost" href="/internal/dashboard">
          ← Back to dashboard
        </Link>
        <span className={`badge ${(data as any).scope_locked_at ? "badgeHot" : ""}`}>
          {(data as any).scope_locked_at ? "Scope locked" : "Scope not locked"}
        </span>
      </div>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 950 }}>Summary</div>
          <div className="smallNote">
            {new Date((data as any).created_at).toLocaleString()} • <code>{(data as any).id}</code>
          </div>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 10 }}>
          <div>
            <strong>Total:</strong> ${(data as any).estimate_total}{" "}
            <span style={{ opacity: 0.7 }}>
              (range ${(data as any).estimate_low} – ${(data as any).estimate_high})
            </span>
          </div>
          <div>
            <strong>Tier:</strong> {(data as any).tier_recommended ?? "—"}
          </div>
          <div>
            <strong>Status:</strong> {(data as any).status ?? "new"}
          </div>
          <div>
            <strong>Lead:</strong>{" "}
            {lead?.email ?? "(missing)"}
            {lead?.phone ? ` • ${lead.phone}` : ""}
            {lead?.name ? ` • ${lead.name}` : ""}
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      {/* Editor: status + lock scope + deposit link */}
      <QuoteEditorClient
        quoteId={(data as any).id}
        initial={{
          status: (data as any).status ?? "new",
          deposit_link_url: (data as any).deposit_link_url ?? "",
          deposit_amount: (data as any).deposit_amount ?? "",
          scope_snapshot: (data as any).scope_snapshot ?? {},
          scope_locked_at: (data as any).scope_locked_at ?? null,
        }}
      />

      <div style={{ height: 18 }} />

      <details className="panel" open>
        <summary className="panelHeader" style={{ cursor: "pointer", fontWeight: 950 }}>
          intake_normalized
        </summary>
        <div className="panelBody">
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {JSON.stringify((data as any).intake_normalized ?? {}, null, 2)}
          </pre>
        </div>
      </details>

      <div style={{ height: 18 }} />

      <details className="panel">
        <summary className="panelHeader" style={{ cursor: "pointer", fontWeight: 950 }}>
          debug
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