type Props = {
  report: any;
};

function fmtMoney(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function safeParse(value: any) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel">
      <div className="panelHeader">
        <strong>{title}</strong>
      </div>
      <div className="panelBody">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="card">
      <div className="cardInner">
        <div className="smallNote">{label}</div>
        <div>{value}</div>
        {note ? (
          <div className="smallNote" style={{ marginTop: 6 }}>
            {note}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function PieAdminReport({ report }: Props) {
  const payload = safeParse(report);

  if (!payload) {
    return (
      <Section title="PIE Report">
        <p className="smallNote">No readable PIE report found.</p>
      </Section>
    );
  }

  const complexity = payload.complexity || {};
  const tier = payload.tier || {};
  const capacity = payload.capacity || {};
  const hours = capacity.estimatedHours || {};
  const routing = payload.routing || {};
  const lead = payload.lead || {};
  const scope = payload.scope || {};
  const negotiation = payload.negotiation || {};
  const risks = Array.isArray(payload.risks) ? payload.risks : [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Section title="PIE Overview">
        <div className="grid2stretch">
          <Stat
            label="Recommended Tier"
            value={tier.recommended || "-"}
            note={tier.rationale || undefined}
          />
          <Stat
            label="Routing Path"
            value={routing.finalPath || routing.path || "-"}
            note={routing.reason || undefined}
          />
          <Stat
            label="Target Price"
            value={fmtMoney(tier.targetPrice)}
            note={
              tier.priceBand
                ? `${fmtMoney(tier.priceBand.min)} - ${fmtMoney(tier.priceBand.max)}`
                : undefined
            }
          />
          <Stat
            label="Complexity"
            value={
              typeof complexity.score === "number"
                ? `${complexity.score}/100`
                : "-"
            }
            note={complexity.label || undefined}
          />
        </div>
      </Section>

      <Section title="Capacity">
        <div className="grid2stretch">
          <Stat
            label="Estimated Hours"
            value={
              typeof hours.target === "number"
                ? `${hours.target}h`
                : "-"
            }
            note={
              typeof hours.min === "number" && typeof hours.max === "number"
                ? `${hours.min}h - ${hours.max}h`
                : undefined
            }
          />
          <Stat
            label="Estimated Weeks"
            value={
              capacity.estimatedWeeks?.target
                ? `${capacity.estimatedWeeks.target} week(s)`
                : "-"
            }
            note={
              capacity.estimatedWeeks
                ? `${capacity.estimatedWeeks.min} - ${capacity.estimatedWeeks.max} week(s)`
                : undefined
            }
          />
          <Stat
            label="Effective Hourly Rate"
            value={
              typeof capacity.effectiveHourlyRate === "number"
                ? fmtMoney(capacity.effectiveHourlyRate)
                : "-"
            }
            note={capacity.profitMessage || undefined}
          />
          <Stat
            label="Profit Signal"
            value={capacity.profitSignal || "-"}
          />
        </div>

        {capacity.breakdown ? (
          <div style={{ marginTop: 16 }}>
            <div className="smallNote" style={{ marginBottom: 8 }}>
              Capacity Breakdown
            </div>
            <div className="grid2stretch">
              {Object.entries(capacity.breakdown).map(([key, value]) => (
                <Stat
                  key={key}
                  label={key}
                  value={`${value}h`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </Section>

      <Section title="Lead + Triggers">
        <div className="grid2stretch">
          <Stat
            label="Lead Score"
            value={
              typeof lead.score === "number" ? `${lead.score}/100` : "-"
            }
            note={lead.notes || undefined}
          />
          <Stat
            label="Priority"
            value={lead.priority || "-"}
            note={
              routing.recommendedCallLength
                ? `${routing.recommendedCallLength}-minute call recommended`
                : "No call required by default"
            }
          />
        </div>

        {Array.isArray(routing.triggerDetails) && routing.triggerDetails.length ? (
          <>
            <div className="smallNote" style={{ marginTop: 16 }}>
              Routing Triggers
            </div>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {routing.triggerDetails.map((detail: any, index: number) => (
                <li key={`${detail.rule}-${index}`}>
                  <strong>{detail.rule}</strong>: {detail.note}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Section>

      <Section title="Scope + Risks">
        {Array.isArray(scope.featuresIncluded) && scope.featuresIncluded.length ? (
          <>
            <div className="smallNote">Included features</div>
            <div className="pills" style={{ marginTop: 8 }}>
              {scope.featuresIncluded.map((feature: string) => (
                <span key={feature} className="pill">
                  {feature}
                </span>
              ))}
            </div>
          </>
        ) : null}

        {Array.isArray(risks) && risks.length ? (
          <>
            <div className="smallNote" style={{ marginTop: 16 }}>
              Risks
            </div>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {risks.map((risk: any, index: number) => (
                <li key={`${risk.flag}-${index}`}>
                  <strong>{risk.flag}</strong>: {risk.mitigation}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Section>

      <Section title="Negotiation Toolkit">
        <div className="grid2stretch">
          <div>
            <div className="smallNote">Lower-cost options</div>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {(negotiation.lowerCostOptions || []).map((option: string) => (
                <li key={option}>{option}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="smallNote">Price defense</div>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {(negotiation.priceDefense || []).map((point: string) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}
