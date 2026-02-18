// app/internal/dashboard/page.tsx
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function firstLead(leads: any) {
  if (!leads) return null;
  return Array.isArray(leads) ? leads[0] ?? null : leads;
}

export default async function InternalDashboardPage() {
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
      deposit_link_url,
      scope_locked_at,
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
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Internal • Dashboard
      </div>

      <div style={{ height: 10 }} />
      <h1 className="h1">Quotes</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        Review estimates, lock scope after calls, then send deposit links.
      </p>

      <div style={{ height: 18 }} />

      {error ? (
        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Error</div>
            <div className="smallNote">{error.message}</div>
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Recent quotes</div>
            <div className="smallNote">{(quotes ?? []).length} loaded</div>
          </div>

          <div className="panelBody" style={{ display: "grid", gap: 10 }}>
            {(quotes ?? []).map((q: any) => {
              const lead = firstLead(q.leads);
              const locked = !!q.scope_locked_at;
              const hasDepositLink = !!q.deposit_link_url;

              return (
                <Link
                  key={q.id}
                  href={`/internal/dashboard/${q.id}`}
                  className="card cardHover"
                  style={{ display: "block" }}
                >
                  <div className="cardInner">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontWeight: 950 }}>
                        ${q.estimate_total}{" "}
                        <span style={{ opacity: 0.7, fontWeight: 800 }}>
                          (range ${q.estimate_low}–${q.estimate_high})
                        </span>
                      </div>
                      <div style={{ opacity: 0.75, fontWeight: 800 }}>
                        {new Date(q.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ marginTop: 8, opacity: 0.85 }}>
                      <strong>Status:</strong> {q.status ?? "new"}{" "}
                      <span style={{ opacity: 0.6 }}>•</span>{" "}
                      <strong>Tier:</strong> {q.tier_recommended ?? "—"}
                    </div>

                    <div style={{ marginTop: 8, opacity: 0.85 }}>
                      <strong>Lead:</strong> {lead?.email ?? "(missing)"}{" "}
                      {lead?.phone ? `• ${lead.phone}` : ""}{" "}
                      {lead?.name ? `• ${lead.name}` : ""}
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span className={`badge ${locked ? "badgeHot" : ""}`}>
                        {locked ? "Scope locked" : "Scope not locked"}
                      </span>
                      <span className={`badge ${hasDepositLink ? "badgeHot" : ""}`}>
                        {hasDepositLink ? "Deposit link set" : "No deposit link"}
                      </span>
                    </div>

                    <div style={{ marginTop: 10, opacity: 0.6 }}>
                      <code>{q.id}</code>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}