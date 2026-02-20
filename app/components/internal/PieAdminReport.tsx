// app/components/internal/PieAdminReport.tsx
type Props = {
  report: any;
};

function fmtMoney(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n));
}

function Badge({ text }: { text: string }) {
  return <span className="badge">{text}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel" style={{ marginTop: 14 }}>
      <div className="panelHeader">
        <strong>{title}</strong>
      </div>
      <div className="panelBody">{children}</div>
    </div>
  );
}

function safeParse(report: any) {
  if (!report) return null;
  if (typeof report === "object") return report;
  if (typeof report === "string") {
    try {
      return JSON.parse(report);
    } catch {
      return null;
    }
  }
  return null;
}

export default function PieAdminReport({ report }: Props) {
  const r = safeParse(report);

  if (!r) {
    return (
      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panelHeader"><strong>PIE Report</strong></div>
        <div className="panelBody">
          <p className="smallNote">No readable PIE report found.</p>
          <details style={{ marginTop: 8 }}>
            <summary>Raw</summary>
            <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>{String(report)}</pre>
          </details>
        </div>
      </div>
    );
  }

  const pg = r.pricing_guardrail || {};
  const cx = r.complexity || {};
  const hrs = r.hours || {};
  const tl = r.timeline || {};
  const plat = r.platform_recommendation || {};
  const ai = r.ai_insights || null;

  return (
    <div style={{ marginTop: 14 }}>
      <Section title="PIE Overview">
        <div className="row" style={{ marginBottom: 10 }}>
          <Badge text={r.version || "PIE"} />
          {r.overview?.tier ? <Badge text={`Tier: ${r.overview.tier}`} /> : null}
          {cx.level ? <Badge text={`Complexity: ${cx.level}`} /> : null}
          {typeof cx.score_100 === "number" ? <Badge text={`Score: ${cx.score_100}/100`} /> : null}
        </div>

        <div style={{ fontWeight: 900, fontSize: 18 }}>{r.overview?.headline || "PIE Report"}</div>
        <p className="pDark" style={{ marginTop: 8 }}>{r.overview?.summary || "No summary available."}</p>

        <div className="grid2" style={{ marginTop: 12 }}>
          <div className="card">
            <div className="cardInner">
              <div className="smallNote">Quoted Price</div>
              <div style={{ fontWeight: 950, fontSize: 22 }}>{fmtMoney(r.overview?.quoted_price)}</div>
              <div className="smallNote" style={{ marginTop: 6 }}>Client fit: {r.overview?.fit || "—"}</div>
            </div>
          </div>
          <div className="card">
            <div className="cardInner">
              <div className="smallNote">Estimated Hours</div>
              <div style={{ fontWeight: 950, fontSize: 22 }}>{hrs.total_hours ?? "—"}h</div>
              <div className="smallNote" style={{ marginTop: 6 }}>
                {tl.part_time_weeks ? `Part-time: ${tl.part_time_weeks}` : ""}
                {tl.full_time_weeks ? ` • Full-time: ${tl.full_time_weeks}` : ""}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Pricing Guardrail">
        <div className="grid2">
          <div>
            <div className="smallNote">Hourly rate used</div>
            <div style={{ fontWeight: 900 }}>{fmtMoney(pg.hourly_rate_used)}/hr</div>

            <div className="smallNote" style={{ marginTop: 10 }}>Cost at hourly</div>
            <div style={{ fontWeight: 900 }}>{fmtMoney(pg.cost_at_hourly)}</div>

            <div className="smallNote" style={{ marginTop: 10 }}>Quoted</div>
            <div style={{ fontWeight: 900 }}>{fmtMoney(pg.quoted_price)}</div>
          </div>

          <div>
            <div className="smallNote">Position</div>
            <div style={{ fontWeight: 900, textTransform: "capitalize" }}>{pg.pricing_position || "unknown"}</div>

            <div className="smallNote" style={{ marginTop: 10 }}>Recommended range</div>
            <div style={{ fontWeight: 900 }}>
              {fmtMoney(pg.recommended_range?.min)} - {fmtMoney(pg.recommended_range?.max)}
            </div>

            <div className="smallNote" style={{ marginTop: 10 }}>Delta vs hourly guardrail</div>
            <div style={{ fontWeight: 900 }}>{fmtMoney(pg.delta)}</div>
          </div>
        </div>

        <div className="smallNote" style={{ marginTop: 12 }}>
          Public tier check: {pg.tier_range_check?.tier || "—"}{" "}
          {pg.tier_range_check?.public_min ? `(${fmtMoney(pg.tier_range_check?.public_min)} - ${fmtMoney(pg.tier_range_check?.public_max)})` : ""}
          {" • "}
          {pg.tier_range_check?.within_public_range === null
            ? "No tier range check"
            : pg.tier_range_check?.within_public_range
            ? "within public range"
            : "outside public range"}
        </div>
      </Section>

      <Section title="Complexity Drivers">
        {Array.isArray(cx.drivers) && cx.drivers.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {cx.drivers.map((d: string, i: number) => <li key={i}>{d}</li>)}
          </ul>
        ) : (
          <p className="smallNote">No drivers listed.</p>
        )}
      </Section>

      <Section title="Hours Breakdown">
        {hrs.by_phase ? (
          <div className="grid2">
            {Object.entries(hrs.by_phase).map(([k, v]) => (
              <div key={k} className="checkRow">
                <div className="checkLeft">
                  <div className="checkLabel" style={{ textTransform: "capitalize" }}>
                    {k.replaceAll("_", " ")}
                  </div>
                </div>
                <div className="checkHint">{String(v)}h</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="smallNote">No hours breakdown.</p>
        )}

        {Array.isArray(hrs.assumptions) && hrs.assumptions.length ? (
          <>
            <div className="smallNote" style={{ marginTop: 12 }}>Assumptions</div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {hrs.assumptions.map((a: string, i: number) => <li key={i}>{a}</li>)}
            </ul>
          </>
        ) : null}
      </Section>

      <Section title="Platform Recommendation">
        <div style={{ fontWeight: 900, textTransform: "uppercase" }}>{plat.recommended || "—"}</div>

        {Array.isArray(plat.why) && plat.why.length ? (
          <>
            <div className="smallNote" style={{ marginTop: 10 }}>Why</div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {plat.why.map((x: string, i: number) => <li key={i}>{x}</li>)}
            </ul>
          </>
        ) : null}

        {Array.isArray(plat.caution) && plat.caution.length ? (
          <>
            <div className="smallNote" style={{ marginTop: 10 }}>Caution</div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {plat.caution.map((x: string, i: number) => <li key={i}>{x}</li>)}
            </ul>
          </>
        ) : null}
      </Section>

      <Section title="Questions To Ask On Call">
        {Array.isArray(r.questions_to_ask) && r.questions_to_ask.length ? (
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {r.questions_to_ask.map((q: string, i: number) => <li key={i} style={{ marginBottom: 6 }}>{q}</li>)}
          </ol>
        ) : (
          <p className="smallNote">No questions generated.</p>
        )}
      </Section>

      <Section title="Risks and Scope Tradeoffs">
        <div className="grid2">
          <div>
            <div className="smallNote">Risks</div>
            {Array.isArray(r.risks) && r.risks.length ? (
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {r.risks.map((x: string, i: number) => <li key={i}>{x}</li>)}
              </ul>
            ) : <p className="smallNote">No risks listed.</p>}
          </div>

          <div>
            <div className="smallNote">Tradeoffs (if client needs lower price)</div>
            {Array.isArray(r.scope_tradeoffs) && r.scope_tradeoffs.length ? (
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {r.scope_tradeoffs.map((x: string, i: number) => <li key={i}>{x}</li>)}
              </ul>
            ) : <p className="smallNote">No tradeoffs listed.</p>}
          </div>
        </div>
      </Section>

      {ai ? (
        <Section title="AI Insights">
          {ai.executive_summary ? (
            <>
              <div className="smallNote">Executive summary</div>
              <p className="pDark" style={{ marginTop: 6 }}>{ai.executive_summary}</p>
            </>
          ) : null}

          {ai.client_psychology ? (
            <>
              <div className="smallNote" style={{ marginTop: 10 }}>Client psychology</div>
              <p className="pDark" style={{ marginTop: 6 }}>{ai.client_psychology}</p>
            </>
          ) : null}

          {Array.isArray(ai.hidden_risks) && ai.hidden_risks.length ? (
            <>
              <div className="smallNote" style={{ marginTop: 10 }}>Hidden risks</div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {ai.hidden_risks.map((x: string, i: number) => <li key={i}>{x}</li>)}
              </ul>
            </>
          ) : null}

          {Array.isArray(ai.upsell_opportunities) && ai.upsell_opportunities.length ? (
            <>
              <div className="smallNote" style={{ marginTop: 10 }}>Upsell opportunities</div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {ai.upsell_opportunities.map((x: string, i: number) => <li key={i}>{x}</li>)}
              </ul>
            </>
          ) : null}

          {Array.isArray(ai.call_strategy) && ai.call_strategy.length ? (
            <>
              <div className="smallNote" style={{ marginTop: 10 }}>Call strategy</div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {ai.call_strategy.map((x: string, i: number) => <li key={i}>{x}</li>)}
              </ul>
            </>
          ) : null}
        </Section>
      ) : null}

      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: "pointer", fontWeight: 800 }}>Raw PIE JSON</summary>
        <pre
          style={{
            marginTop: 10,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 12,
            overflowX: "auto",
            fontSize: 12,
          }}
        >
          {JSON.stringify(r, null, 2)}
        </pre>
      </details>
    </div>
  );
}