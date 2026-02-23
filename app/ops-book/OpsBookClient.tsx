"use client";

import { useMemo, useState } from "react";

type AnyRow = Record<string, any>;

function fmtDate(value: any) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function fmtCurrency(value: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function OpsBookClient(props: any) {
  // Flexible input so it won't break even if page.tsx passes a different prop name
  const rows: AnyRow[] = useMemo(() => {
    if (Array.isArray(props?.initialRows)) return props.initialRows;
    if (Array.isArray(props?.rows)) return props.rows;
    if (Array.isArray(props?.items)) return props.items;
    if (Array.isArray(props?.data)) return props.data;
    return [];
  }, [props]);

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const hay = JSON.stringify(r ?? {}).toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="cardInner">
          <div
            className="row"
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>Ops Book</div>
              <div className="smallNote">
                Internal operations view (quotes / projects / handoff items)
              </div>
            </div>

            <div style={{ minWidth: 260, flex: 1, maxWidth: 420 }}>
              <input
                className="input"
                placeholder="Search email, quote ID, status..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10, gap: 8 }}>
            <span className="badge">Total: {rows.length}</span>
            <span className="badge">Filtered: {filtered.length}</span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="cardInner">
            <div style={{ fontWeight: 800, marginBottom: 6 }}>No records found</div>
            <div className="smallNote">
              If this page should show data, make sure your page loader is passing
              <code style={{ marginLeft: 6 }}>initialRows</code> (or rows/items/data).
            </div>
          </div>
        </div>
      ) : (
        <div className="row" style={{ flexDirection: "column", gap: 14 }}>
          {filtered.map((row, idx) => {
            const key =
              row.quoteId ||
              row.quote_id ||
              row.id ||
              row.projectId ||
              `row-${idx}`;

            const isExpanded = !!expanded[key];

            const leadEmail =
              row.leadEmail ||
              row.lead_email ||
              row.email ||
              row.client_email ||
              "—";

            const projectStatus =
              row.projectStatus ||
              row.project_status ||
              row.status ||
              "new";

            const clientStatus =
              row.clientStatus || row.client_status || "—";

            const createdAt = row.createdAt || row.created_at || row.inserted_at;

            const price =
              row.price ??
              row.target ??
              row.estimate_target ??
              row.pricingTarget ??
              row.pie_pricing_target;

            const assetCount =
              row.assetCount ?? row.asset_count ?? row.assets ?? 0;

            const revisionCount =
              row.revisionCount ?? row.revision_count ?? row.revisions ?? 0;

            const latestNote =
              row.latestClientNote ||
              row.latest_client_note ||
              row.latestNote ||
              row.note ||
              "";

            return (
              <div key={String(key)} className="card">
                <div className="cardInner">
                  <div
                    className="row"
                    style={{
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="row" style={{ gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        <span className="badge">{projectStatus}</span>
                        <span className="badge">Client: {clientStatus}</span>
                        <span className="badge">Assets: {assetCount}</span>
                        <span className="badge">Revisions: {revisionCount}</span>
                      </div>

                      <div style={{ fontWeight: 900, marginBottom: 4 }}>{leadEmail}</div>

                      <div style={{ fontSize: 13, opacity: 0.8 }}>
                        Quote: {row.quoteId || row.quote_id || "—"}
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.8 }}>
                        Created: {fmtDate(createdAt)}
                      </div>

                      {latestNote ? (
                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.92 }}>
                          <strong>Latest client note:</strong> {String(latestNote)}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>
                        {price != null ? fmtCurrency(price) : "—"}
                      </div>
                      <div className="smallNote">Current target / estimate</div>
                    </div>
                  </div>

                  <div className="row" style={{ marginTop: 12, gap: 10, flexWrap: "wrap" }}>
                    <button
                      className="btn btnGhost"
                      onClick={() =>
                        setExpanded((m) => ({ ...m, [key]: !m[key] }))
                      }
                    >
                      {isExpanded ? "Hide raw" : "Show raw"}
                    </button>

                    {(row.quoteId || row.quote_id) ? (
                      <a
                        className="btn btnGhost"
                        href={`/internal/project/${row.quoteId || row.quote_id}`}
                      >
                        Open project
                      </a>
                    ) : null}
                  </div>

                  {isExpanded ? (
                    <div
                      style={{
                        marginTop: 10,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        padding: 10,
                        overflowX: "auto",
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 12,
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {JSON.stringify(row, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}