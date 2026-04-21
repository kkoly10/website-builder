import Link from "next/link";
import { getDashboardSnapshot } from "@/lib/dashboard/queries";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function pretty(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function InternalDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const range = Array.isArray(resolved.range) ? resolved.range[0] : resolved.range;
  const dashboard = await getDashboardSnapshot(range);

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="adminDashWrap">
        <div className="adminDashHeader">
          <div>
            <div className="kicker">
              <span className="kickerDot" />
              Internal dashboard
            </div>
            <h1 className="h2">You&apos;re tracking {money(dashboard.summary.revenue)} in revenue across {dashboard.summary.activeProjects} active projects.</h1>
            <p className="pDark" style={{ marginTop: 6 }}>
              {dashboard.needsAttention.length} thing{dashboard.needsAttention.length === 1 ? "" : "s"} need
              your attention, and the portfolio is {dashboard.capacity.bookedPercent}% booked.
            </p>
          </div>

          <div className="adminDashRangeRow">
            {(["today", "week", "month", "quarter", "year"] as const).map((key) => (
              <Link
                key={key}
                href={`/internal/dashboard?range=${key}`}
                className={`adminDashRange ${dashboard.range === key ? "adminDashRangeActive" : ""}`}
              >
                {pretty(key)}
              </Link>
            ))}
          </div>
        </div>

        <div className="adminDashKpis">
          <article className="adminDashKpi adminDashKpiHero">
            <div className="adminDashKpiLabel">Revenue in play</div>
            <div className="adminDashKpiValue">{money(dashboard.summary.revenue)}</div>
            <div className="adminDashKpiDelta">
              {dashboard.summary.revenueDelta >= 0 ? "+" : ""}
              {dashboard.summary.revenueDelta}% vs previous period
            </div>
          </article>

          <article className="adminDashKpi">
            <div className="adminDashKpiLabel">Active projects</div>
            <div className="adminDashKpiValue">{dashboard.summary.activeProjects}</div>
            <div className="adminDashKpiDelta">
              {dashboard.summary.activeDelta >= 0 ? "+" : ""}
              {dashboard.summary.activeDelta}% vs previous period
            </div>
          </article>

          <article className="adminDashKpi">
            <div className="adminDashKpiLabel">Average value</div>
            <div className="adminDashKpiValue">{money(dashboard.summary.averageValue)}</div>
            <div className="adminDashKpiDelta">
              {dashboard.summary.averageDelta >= 0 ? "+" : ""}
              {dashboard.summary.averageDelta}% vs previous period
            </div>
          </article>

          <article className="adminDashKpi">
            <div className="adminDashKpiLabel">Cycle time</div>
            <div className="adminDashKpiValue">{dashboard.summary.cycleDays || "-"}</div>
            <div className="adminDashKpiDelta">Average days to live</div>
          </article>
        </div>

        <div className="adminDashGrid">
          <article className="adminDashCard">
            <div className="adminDashCardTitle">Revenue over 12 months</div>
            <div className="adminDashBars">
              {dashboard.revenueBars.map((bar) => (
                <div key={bar.label} className="adminDashBarCol">
                  <div className="adminDashBarValue">{bar.total ? money(bar.total) : "-"}</div>
                  <div className="adminDashBarTrack">
                    <div className="adminDashBarFill" style={{ height: `${Math.max(bar.pct, 6)}%` }} />
                  </div>
                  <div className="adminDashBarLabel">{bar.label}</div>
                </div>
              ))}
            </div>
          </article>

          <article className="adminDashCard">
            <div className="adminDashCardTitle">Pipeline by stage</div>
            <div className="adminDashStageList">
              {dashboard.stageBars.map((bar) => (
                <div key={bar.status} className="adminDashStageRow">
                  <div className="adminDashStageMeta">
                    <span>{pretty(bar.status)}</span>
                    <span>{bar.total}</span>
                  </div>
                  <div className="adminDashStageTrack">
                    <div className="adminDashStageFill" style={{ width: `${Math.max(bar.pct, 4)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="adminDashCard">
            <div className="adminDashCardTitle">Capacity</div>
            <div className="adminDashCapacityPct">{dashboard.capacity.bookedPercent}% booked</div>
            <div className="adminDashCapacityTrack">
              <div
                className="adminDashCapacityWorked"
                style={{
                  width: `${Math.round((dashboard.capacity.workedHours / dashboard.capacity.targetCapacity) * 100)}%`,
                }}
              />
              <div
                className="adminDashCapacityCommitted"
                style={{
                  width: `${Math.round((dashboard.capacity.committedHours / dashboard.capacity.targetCapacity) * 100)}%`,
                }}
              />
            </div>
            <div className="adminDashCapacityLegend">
              <span>Worked {dashboard.capacity.workedHours}h</span>
              <span>Committed {dashboard.capacity.committedHours}h</span>
              <span>Free {dashboard.capacity.freeHours}h</span>
            </div>
          </article>

          <article className="adminDashCard">
            <div className="adminDashCardTitle">Conversion funnel</div>
            <div className="adminDashFunnel">
              {[
                { label: "Intake", value: dashboard.funnel.intake },
                { label: "Quote", value: dashboard.funnel.quote },
                { label: "Deposit", value: dashboard.funnel.deposit },
                { label: "Launched", value: dashboard.funnel.launched },
              ].map((step, index) => {
                const max = Math.max(dashboard.funnel.intake, 1);
                return (
                  <div key={step.label} className="adminDashFunnelRow">
                    <div className="adminDashFunnelLabel">
                      <span>{step.label}</span>
                      <span>{step.value}</span>
                    </div>
                    <div
                      className="adminDashFunnelBar"
                      style={{ width: `${Math.max(22, Math.round((step.value / max) * (100 - index * 12)))}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        <div className="adminDashGrid adminDashGridBottom">
          <article className="adminDashCard adminDashCardWide">
            <div className="adminDashCardTitle">Active projects</div>
            <div className="adminDashTable">
              <div className="adminDashTableHead">
                <span>Project</span>
                <span>Stage</span>
                <span>Days</span>
                <span>Value</span>
                <span>Next action</span>
              </div>
              {dashboard.activeTable.map((row) => (
                <div key={row.id} className="adminDashTableRow">
                  <span>#{row.id.slice(0, 8)}</span>
                  <span>{pretty(row.status)}</span>
                  <span className={row.daysInStage >= 7 ? "adminDashWarn" : ""}>
                    {row.daysInStage}
                  </span>
                  <span>{money(row.value)}</span>
                  <span className={row.urgent ? "adminDashWarn" : ""}>{row.nextAction}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="adminDashCard">
            <div className="adminDashCardTitle">Needs attention</div>
            <div className="adminDashPriorityList">
              {dashboard.needsAttention.length === 0 ? (
                <div className="adminDashMuted">Nothing critical is waiting right now.</div>
              ) : (
                dashboard.needsAttention.map((item) => (
                  <div key={`${item.title}-${item.context}`} className="adminDashPriorityItem">
                    <div className="adminDashPriorityHead">
                      <span>{item.title}</span>
                      <span className={item.priority === "high" ? "adminDashWarn" : ""}>
                        {item.priority}
                      </span>
                    </div>
                    <div className="adminDashMuted">{item.context}</div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="adminDashCard">
            <div className="adminDashCardTitle">Activity feed</div>
            <div className="adminDashFeed">
              {dashboard.activityFeed.map((item) => (
                <div key={`${item.at}-${item.label}`} className="adminDashFeedItem">
                  <span className={`adminDashFeedDot adminDashFeedDot${item.tone.charAt(0).toUpperCase()}${item.tone.slice(1)}`} />
                  <div>
                    <div>{item.label}</div>
                    <div className="adminDashMuted">
                      {new Date(item.at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
