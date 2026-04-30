import { listRecentProjectActivity } from "@/lib/projectActivity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type DashboardRangeKey = "today" | "week" | "month" | "quarter" | "year";

type QuoteRow = {
  id: string;
  status: string | null;
  created_at: string | null;
  estimate_total: number | null;
  estimate_low: number | null;
  estimate_high: number | null;
};

type PortalProjectRow = {
  id: string;
  quote_id: string;
  launch_status: string | null;
  deposit_status: string | null;
  deposit_amount_cents: number | null;
  deposit_paid_at: string | null;
  preview_url: string | null;
  client_review_status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type MilestoneRow = {
  portal_project_id: string;
  status: string | null;
  updated_at: string | null;
};

type PieRow = {
  quote_id: string;
  score: number | null;
  created_at: string | null;
};

function normalizeRange(input?: string): DashboardRangeKey {
  if (input === "today" || input === "week" || input === "month" || input === "quarter" || input === "year") {
    return input;
  }
  return "month";
}

function startForRange(range: DashboardRangeKey) {
  const now = new Date();
  const start = new Date(now);
  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (range === "week") {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (range === "month") {
    start.setMonth(now.getMonth() - 1);
    return start;
  }
  if (range === "quarter") {
    start.setMonth(now.getMonth() - 3);
    return start;
  }
  start.setFullYear(now.getFullYear() - 1);
  return start;
}

function previousStartForRange(range: DashboardRangeKey) {
  const currentStart = startForRange(range);
  const previous = new Date(currentStart);
  if (range === "today") previous.setDate(previous.getDate() - 1);
  else if (range === "week") previous.setDate(previous.getDate() - 7);
  else if (range === "month") previous.setMonth(previous.getMonth() - 1);
  else if (range === "quarter") previous.setMonth(previous.getMonth() - 3);
  else previous.setFullYear(previous.getFullYear() - 1);
  return previous;
}

function moneyValue(quote: QuoteRow) {
  return (
    Number(quote.estimate_total ?? 0) ||
    Number(quote.estimate_high ?? 0) ||
    Number(quote.estimate_low ?? 0) ||
    0
  );
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function percentChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function bucketLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

export async function getDashboardSnapshot(rangeInput?: string) {
  const range = normalizeRange(rangeInput);
  const rangeStart = startForRange(range);
  const previousStart = previousStartForRange(range);

  const [quotesRes, projectsRes, milestonesRes, pieRes, recentActivity] = await Promise.all([
    supabaseAdmin
      .from("quotes")
      .select("id, status, created_at, estimate_total, estimate_low, estimate_high")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("customer_portal_projects")
      .select(
        "id, quote_id, launch_status, deposit_status, deposit_amount_cents, deposit_paid_at, preview_url, client_review_status, updated_at, created_at"
      ),
    supabaseAdmin
      .from("customer_portal_milestones")
      .select("portal_project_id, status, updated_at"),
    supabaseAdmin.from("pie_reports").select("quote_id, score, created_at"),
    listRecentProjectActivity(12).catch(() => [] as Awaited<ReturnType<typeof listRecentProjectActivity>>),
  ]);

  const quotes = (quotesRes.error ? [] : quotesRes.data ?? []) as QuoteRow[];
  const projects = (projectsRes.error ? [] : projectsRes.data ?? []) as PortalProjectRow[];
  const milestones = (milestonesRes.error ? [] : milestonesRes.data ?? []) as MilestoneRow[];
  const pies = (pieRes.error ? [] : pieRes.data ?? []) as PieRow[];

  const projectByQuote = new Map(projects.map((project) => [project.quote_id, project]));
  const milestoneCountByProject = new Map<string, { done: number; total: number }>();
  for (const milestone of milestones) {
    const current = milestoneCountByProject.get(milestone.portal_project_id) ?? { done: 0, total: 0 };
    current.total += 1;
    if ((milestone.status || "").toLowerCase() === "done") current.done += 1;
    milestoneCountByProject.set(milestone.portal_project_id, current);
  }

  const activeQuotes = quotes.filter((quote) =>
    ["proposal", "deposit", "active", "closed_won"].includes(String(quote.status || "").toLowerCase())
  );
  const activeProjects = activeQuotes.map((quote) => ({
    quote,
    project: projectByQuote.get(quote.id) ?? null,
  }));

  const currentQuotes = quotes.filter((quote) => {
    const created = safeDate(quote.created_at);
    return created ? created >= rangeStart : false;
  });
  const previousQuotes = quotes.filter((quote) => {
    const created = safeDate(quote.created_at);
    return created ? created >= previousStart && created < rangeStart : false;
  });

  const currentRevenue = currentQuotes.reduce((sum, quote) => sum + moneyValue(quote), 0);
  const previousRevenue = previousQuotes.reduce((sum, quote) => sum + moneyValue(quote), 0);

  const currentAvg = currentQuotes.length
    ? Math.round(currentRevenue / currentQuotes.length)
    : 0;
  const previousAvg = previousQuotes.length
    ? Math.round(previousQuotes.reduce((sum, quote) => sum + moneyValue(quote), 0) / previousQuotes.length)
    : 0;

  const liveProjects = activeProjects.filter(
    (item) => (item.project?.launch_status || "").toLowerCase() === "live"
  );
  const cycleDays = liveProjects
    .map((item) => {
      const created = safeDate(item.quote.created_at);
      const updated = safeDate(item.project?.updated_at);
      if (!created || !updated) return null;
      return Math.max(1, Math.round((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
    })
    .filter((value): value is number => typeof value === "number");
  const averageCycleDays = cycleDays.length
    ? Math.round(cycleDays.reduce((sum, value) => sum + value, 0) / cycleDays.length)
    : 0;

  const revenueBars = Array.from({ length: 12 }).map((_, index) => {
    const point = new Date();
    point.setMonth(point.getMonth() - (11 - index));
    const label = bucketLabel(point);
    const total = quotes
      .filter((quote) => {
        const created = safeDate(quote.created_at);
        return created
          ? created.getMonth() === point.getMonth() && created.getFullYear() === point.getFullYear()
          : false;
      })
      .reduce((sum, quote) => sum + moneyValue(quote), 0);
    return { label, total };
  });

  const revenueMax = Math.max(...revenueBars.map((bar) => bar.total), 1);
  const stageLabels = ["new", "proposal", "deposit", "active", "closed_won"];
  const stageBars = stageLabels.map((status) => {
    const total = quotes.filter(
      (quote) => String(quote.status || "").toLowerCase() === status
    ).length;
    return { status, total };
  });
  const stageMax = Math.max(...stageBars.map((bar) => bar.total), 1);

  const activeCount = activeProjects.length;
  const targetCapacity = 160;
  const bookedHours = Math.min(
    targetCapacity,
    activeProjects.reduce((sum, item) => {
      const milestoneStats = item.project ? milestoneCountByProject.get(item.project.id) : null;
      const completionRatio = milestoneStats?.total
        ? milestoneStats.done / milestoneStats.total
        : 0.25;
      return sum + Math.round(18 + completionRatio * 14);
    }, 0)
  );
  const workedHours = Math.min(targetCapacity, Math.round(bookedHours * 0.58));
  const freeHours = Math.max(targetCapacity - bookedHours, 0);
  const bookedPercent = Math.round((bookedHours / targetCapacity) * 100);

  const funnel = {
    intake: quotes.length,
    quote: quotes.filter((quote) =>
      ["proposal", "deposit", "active", "closed_won"].includes(
        String(quote.status || "").toLowerCase()
      )
    ).length,
    deposit: projects.filter(
      (project) => (project.deposit_status || "").toLowerCase() === "paid"
    ).length,
    launched: projects.filter(
      (project) => (project.launch_status || "").toLowerCase() === "live"
    ).length,
  };

  const activeTable = activeProjects
    .slice(0, 8)
    .map((item) => {
      const daysInStage = daysSince(item.quote.created_at);
      let action = "Review project";
      let urgent = false;
      if ((item.project?.deposit_status || "").toLowerCase() !== "paid" && item.quote.status === "deposit") {
        action = "Collect deposit";
        urgent = daysInStage >= 4;
      } else if ((item.project?.client_review_status || "").toLowerCase() === "changes requested") {
        action = "Handle client revisions";
        urgent = true;
      } else if (!item.project?.preview_url) {
        action = "Publish preview";
      } else if ((item.project?.launch_status || "").toLowerCase() !== "live") {
        action = "Advance launch checklist";
      }

      return {
        id: item.quote.id,
        status: item.quote.status || "new",
        daysInStage,
        value: moneyValue(item.quote),
        nextAction: action,
        urgent,
      };
    });

  const needsAttention = activeProjects
    .map((item) => {
      const daysInStage = daysSince(item.quote.created_at);
      const project = item.project;
      if (item.quote.status === "deposit" && (project?.deposit_status || "").toLowerCase() !== "paid") {
        return {
          title: "Deposit still pending",
          context: `Quote ${item.quote.id.slice(0, 8)} has been in deposit for ${daysInStage} days.`,
          priority: daysInStage >= 4 ? "high" : "medium",
        };
      }
      if ((project?.client_review_status || "").toLowerCase() === "changes requested") {
        return {
          title: "Client changes requested",
          context: `Quote ${item.quote.id.slice(0, 8)} is waiting on revision follow-through.`,
          priority: "high",
        };
      }
      if (!project?.preview_url && ["proposal", "deposit", "active"].includes(item.quote.status || "")) {
        return {
          title: "Preview not published",
          context: `Quote ${item.quote.id.slice(0, 8)} needs a client-visible workspace preview.`,
          priority: "medium",
        };
      }
      return null;
    })
    .filter((item): item is { title: string; context: string; priority: string } => Boolean(item))
    .slice(0, 5);

  const activityFeed = recentActivity.slice(0, 10).map((item) => ({
    at: item.createdAt,
    tone:
      item.eventType.includes("paid") || item.eventType.includes("accepted")
        ? "good"
        : item.eventType.includes("nudge") || item.eventType.includes("revision")
        ? "alert"
        : "neutral",
    label: `${item.summary} (${item.quoteId.slice(0, 8)})`,
  }));

  return {
    range,
    summary: {
      revenue: activeProjects.reduce((sum, item) => sum + moneyValue(item.quote), 0),
      activeProjects: activeCount,
      averageValue: currentAvg,
      cycleDays: averageCycleDays,
      revenueDelta: percentChange(currentRevenue, previousRevenue),
      activeDelta: percentChange(
        currentQuotes.filter((quote) => ["proposal", "deposit", "active"].includes(String(quote.status || "").toLowerCase())).length,
        previousQuotes.filter((quote) => ["proposal", "deposit", "active"].includes(String(quote.status || "").toLowerCase())).length
      ),
      averageDelta: percentChange(currentAvg, previousAvg),
    },
    revenueBars: revenueBars.map((bar) => ({
      ...bar,
      pct: Math.round((bar.total / revenueMax) * 100),
    })),
    stageBars: stageBars.map((bar) => ({
      ...bar,
      pct: Math.round((bar.total / stageMax) * 100),
    })),
    capacity: {
      workedHours,
      committedHours: bookedHours,
      freeHours,
      bookedPercent,
      targetCapacity,
    },
    funnel,
    activeTable,
    needsAttention,
    activityFeed,
  };
}

function daysSince(value?: string | null) {
  const parsed = safeDate(value);
  if (!parsed) return 0;
  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)));
}
