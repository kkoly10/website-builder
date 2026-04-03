"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EcommerceAdminRow } from "@/lib/ecommerce/workspace";

function pretty(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function tone(status?: string | null) {
  const s = String(status || "").toLowerCase();
  if (["completed", "active", "live", "accepted"].includes(s)) {
    return { bg: "rgba(46,160,67,0.14)", border: "rgba(46,160,67,0.34)", color: "#b7f5c4", label: pretty(status) };
  }
  if (["building", "proposal_review", "discovery", "reviewing", "quoted", "sent", "scheduled", "in_progress"].includes(s)) {
    return { bg: "rgba(201,168,76,0.14)", border: "rgba(201,168,76,0.34)", color: "#f1d98a", label: pretty(status) };
  }
  return { bg: "rgba(141,164,255,0.12)", border: "rgba(141,164,255,0.26)", color: "#d8e0ff", label: pretty(status || "new") };
}

export default function EcommercePipelineClient({ initialRows }: { initialRows: EcommerceAdminRow[] }) {
  const [rows] = useState(initialRows ?? []);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((row) => {
      const matchesSearch = !q
        ? true
        : row.businessName.toLowerCase().includes(q) ||
          row.contactName.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.ecomIntakeId.toLowerCase().includes(q);

      const matchesMode = modeFilter === "all" ? true : row.mode === modeFilter;
      return matchesSearch && matchesMode;
    });
  }, [rows, search, modeFilter]);

  return (
    <div style={{ marginTop: 18 }}>
      <div className="panel">
        <div className="panelBody">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="row">
              <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by business, contact, email, or intake id…" />
              <select className="select" value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
                <option value="all">All service paths</option>
                <option value="build">Store build</option>
                <option value="run">Managed operations</option>
                <option value="fix">Store optimization</option>
              </select>
            </div>
            <div className="smallNote">Total: <strong>{filtered.length}</strong></div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        {filtered.length === 0 ? (
          <div className="panel"><div className="panelBody"><div style={{ color: "var(--fg)", fontWeight: 900, fontSize: 20 }}>No e-commerce requests found</div><p className="p" style={{ marginBottom: 0 }}>When e-commerce intakes are submitted, they will appear here with service path, pricing recommendation, workspace status, and client links.</p></div></div>
        ) : null}

        {filtered.map((row) => {
          const intakeTone = tone(row.status);
          const phaseTone = tone(row.phase);
          return (
            <article key={row.ecomIntakeId} className="panel fadeUp">
              <div className="panelBody">
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 16, alignItems: "start" }}>
                  <div>
                    <div style={{ color: "var(--fg)", fontWeight: 900, fontSize: 24 }}>{row.businessName}</div>
                    <div className="pDark" style={{ marginTop: 6 }}>{row.contactName} • {row.email}</div>
                    <div className="pDark" style={{ marginTop: 4 }}>ID #{row.ecomIntakeId.slice(0, 8)} • {fmtDate(row.createdAt)} • {pretty(row.mode)}</div>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", padding: "8px 12px", borderRadius: 999, background: intakeTone.bg, border: `1px solid ${intakeTone.border}`, color: intakeTone.color, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>{intakeTone.label}</div>
                </div>

                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12 }}>
                  <Tile label="Service Path" value={pretty(row.mode)} />
                  <Tile label="Phase" value={pretty(row.phase)} />
                  <Tile label="Waiting On" value={row.waitingOn} />
                  <Tile label="Call" value={pretty(row.callStatus)} />
                  <Tile label="Quote" value={pretty(row.quoteStatus)} />
                  <Tile label="Monthly Orders" value={row.monthlyOrders} />
                </div>

                <div className="grid2stretch" style={{ marginTop: 14 }}>
                  <div style={{ border: "1px solid var(--stroke)", background: "var(--panel2)", borderRadius: 14, padding: 14 }}>
                    <div className="smallNote">Workspace summary</div>
                    <div style={{ marginTop: 8, color: "var(--fg)", fontWeight: 800 }}>{row.serviceSummary}</div>
                  </div>
                  <div style={{ border: "1px solid var(--accentStroke)", background: "var(--accentSoft)", borderRadius: 14, padding: 14 }}>
                    <div className="smallNote">Pricing recommendation</div>
                    <div style={{ marginTop: 8, color: "var(--fg)", fontWeight: 800 }}>{row.recommendationTier}</div>
                    <div className="pDark" style={{ marginTop: 6 }}>{row.recommendationRange}</div>
                  </div>
                </div>

                <div className="row" style={{ marginTop: 16, justifyContent: "space-between" }}>
                  <div className="row">
                    <span style={{ padding: "7px 10px", borderRadius: 999, background: phaseTone.bg, border: `1px solid ${phaseTone.border}`, color: phaseTone.color, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>Phase {phaseTone.label}</span>
                  </div>
                  <div className="row">
                    <Link href={row.links.detail} className="btn btnPrimary">Open E-commerce Project <span className="btnArrow">→</span></Link>
                    <Link href={row.links.portal} className="btn btnGhost">Client Workspace</Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid var(--stroke)", borderRadius: 14, background: "var(--panel2)", padding: 14 }}>
      <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <div style={{ color: "var(--fg)", fontWeight: 800, fontSize: 15, lineHeight: 1.35 }}>{value}</div>
    </div>
  );
}
