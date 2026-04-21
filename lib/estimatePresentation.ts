import "server-only";

import { resolveQuoteAccess } from "@/lib/accessControl";
import { ensureCustomerPortalForQuoteId } from "@/lib/customerPortal";
import { ensurePieForQuoteId } from "@/lib/pie/ensurePie";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AnyObj = Record<string, any>;

type EstimateVariant = "fast" | "warm" | "deep";

type ScopeRow = {
  label: string;
  value: string;
};

type IncludedColumn = {
  id: string;
  label: string;
  title: string;
  items: string[];
};

type ProcessStep = {
  label: string;
  title: string;
  body: string;
};

type TierCard = {
  key: string;
  name: string;
  range: string;
  detail: string;
  meta: string;
  current: boolean;
};

type FaqItem = {
  question: string;
  answer: string;
};

export type EstimatePresentation = {
  quoteId: string;
  quoteToken: string | null;
  portalToken: string | null;
  variant: EstimateVariant;
  businessName: string;
  contactName: string | null;
  createdAt: string | null;
  validUntil: string | null;
  heroTitle: string;
  heroBody: string;
  heroMeta: string;
  projectLabel: string;
  investmentIntro: string;
  contextNote: string | null;
  contextDetails: string[];
  callToBook: {
    label: string;
    helper: string;
    url: string;
    external: boolean;
    durationMinutes: 15 | 30;
  } | null;
  existingCallNote: string | null;
  messageUrl: string | null;
  acceptUrl: string | null;
  acceptLabel: string | null;
  scopeRows: ScopeRow[];
  scopeCaveat: string | null;
  price: {
    target: number | null;
    min: number | null;
    max: number | null;
    deposit: number | null;
    balance: number | null;
    tierLabel: string;
    tierKey: string;
    priceNote: string;
  };
  included: IncludedColumn[];
  process: ProcessStep[];
  tierIntro: string;
  tierCards: TierCard[];
  faq: FaqItem[];
  closing: {
    title: string;
    body: string;
    fineprint: string;
  };
};

type QuoteRow = {
  id: string;
  public_token: string | null;
  lead_id: string | null;
  lead_email: string | null;
  created_at: string | null;
  status: string | null;
  tier_recommended: string | null;
  estimate_total: number | null;
  estimate_low: number | null;
  estimate_high: number | null;
  quote_json: AnyObj | null;
  intake_raw: AnyObj | null;
  intake_normalized: AnyObj | null;
  latest_pie_report_id: string | null;
};

type LeadRow = {
  email: string | null;
  lead_email: string | null;
  phone: string | null;
  name: string | null;
};

type CallRequestRow = {
  status: string | null;
  best_time_to_call: string | null;
  preferred_times: string | null;
  timezone: string | null;
  notes: string | null;
  created_at: string | null;
};

function safeObj(value: unknown): AnyObj {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AnyObj)
    : {};
}

function safeArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => cleanString(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,|\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function toNumber(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const next = cleanString(value);
    if (next) return next;
  }
  return "";
}

function parsePages(value: unknown): string[] {
  const raw = cleanString(value);
  if (!raw) return [];
  if (raw.toLowerCase().includes("one pager")) return ["Homepage / one-page flow"];

  const numbers = (raw.match(/\d+/g) || []).map(Number).filter((item) => Number.isFinite(item));
  if (!numbers.length) return [raw];

  const count = raw.includes("-") && numbers.length >= 2
    ? numbers[numbers.length - 1]
    : numbers[0];

  return Array.from({ length: Math.max(1, count) }, (_, index) => `Page ${index + 1}`);
}

function deriveFeatures(intake: AnyObj) {
  const features = new Set<string>();

  for (const item of cleanTextList(intake.integrations)) features.add(titleCase(item));
  for (const item of cleanTextList(intake.automationTypes)) features.add(titleCase(item));
  for (const item of cleanTextList(intake.neededFeatures)) features.add(titleCase(item));

  if (cleanString(intake.integrationOther)) features.add(titleCase(cleanString(intake.integrationOther)));
  if (String(intake.booking).toLowerCase() === "true" || intake.booking === true) features.add("Booking integration");
  if (String(intake.payments).toLowerCase() === "true" || intake.payments === true) features.add("Payments");
  if (String(intake.blog).toLowerCase() === "true" || intake.blog === true) features.add("Blog / CMS");
  if (String(intake.membership).toLowerCase() === "true" || intake.membership === true) features.add("Member area");
  if (String(intake.wantsAutomation).toLowerCase() === "yes" || intake.wantsAutomation === true) {
    features.add("Automation");
  }

  return Array.from(features);
}

function normalizeTierKey(value: string) {
  const normalized = cleanString(value).toLowerCase();
  if (normalized.includes("starter")) return "starter";
  if (normalized.includes("premium")) return "premium";
  return "growth";
}

function normalizeTierLabel(value: string) {
  const key = normalizeTierKey(value);
  if (key === "starter") return "Starter";
  if (key === "premium") return "Premium";
  return "Growth";
}

function buildCallLink(args: {
  quoteId: string;
  quoteToken: string | null;
  durationMinutes: 15 | 30;
  businessName: string;
  leadEmail: string | null;
  leadName: string | null;
}) {
  const envKey = args.durationMinutes === 30
    ? process.env.NEXT_PUBLIC_CALENDLY_30_URL
    : process.env.NEXT_PUBLIC_CALENDLY_15_URL;
  const rawUrl = cleanString(envKey || process.env.NEXT_PUBLIC_CALENDLY_URL);

  if (!rawUrl) {
    const params = new URLSearchParams({ quoteId: args.quoteId });
    if (args.quoteToken) params.set("token", args.quoteToken);
    return {
      url: `/book?${params.toString()}`,
      external: false,
      label: `Request a ${args.durationMinutes}-minute call`,
      helper: "Share your preferred times and we will confirm the call manually.",
    };
  }

  try {
    const url = new URL(rawUrl);
    if (cleanString(args.leadEmail)) url.searchParams.set("email", cleanString(args.leadEmail));
    if (cleanString(args.leadName)) url.searchParams.set("name", cleanString(args.leadName));
    url.searchParams.set("a1", args.quoteId);
    url.searchParams.set("a2", args.businessName);

    return {
      url: url.toString(),
      external: true,
      label: `Schedule a ${args.durationMinutes}-minute call`,
      helper: "Pick a slot on the calendar and we will come prepared with your scoped quote.",
    };
  } catch {
    return {
      url: rawUrl,
      external: true,
      label: `Schedule a ${args.durationMinutes}-minute call`,
      helper: "Pick a slot on the calendar and we will come prepared with your scoped quote.",
    };
  }
}

function describeProject(websiteType: string, pagesIncluded: string[], featuresIncluded: string[]) {
  const type = cleanString(websiteType) ? titleCase(cleanString(websiteType)) : "website";
  const pageLabel = pagesIncluded.length
    ? `${pagesIncluded.length}-page ${type.toLowerCase()}`
    : type.toLowerCase();

  if (featuresIncluded.length) {
    return `${pageLabel} with ${featuresIncluded.slice(0, 3).join(", ").toLowerCase()}`;
  }

  return pageLabel;
}

function buildHeroBody(args: {
  variant: EstimateVariant;
  businessName: string;
  websiteType: string;
  pagesIncluded: string[];
  featuresIncluded: string[];
}) {
  const project = describeProject(args.websiteType, args.pagesIncluded, args.featuresIncluded);

  if (args.variant === "deep") {
    return `Based on your intake, we think ${args.businessName} needs a ${project}. The range below is our best current read, and we want to confirm the final fixed scope on a short call before you commit.`;
  }

  if (args.variant === "warm") {
    return `Based on your intake, we scoped a ${project} for ${args.businessName}. The quote is firm, but we would like to do a quick call before you commit so we can confirm a few details and protect the launch plan.`;
  }

  return `Based on your intake, we scoped a ${project} for ${args.businessName}. Everything below is specific to your project: the pages, the features, the timeline, and the price. If anything feels off, you can message us and we will adjust it before kickoff.`;
}

function buildContextDetails(triggerDetails: unknown, routingReason: string | null) {
  const details = safeArray(triggerDetails)
    .map((detail) => {
      const item = safeObj(detail);
      const rule = cleanString(item.rule);
      const note = cleanString(item.note);
      return firstString(`${rule}: ${note}`, note, rule);
    })
    .filter(Boolean);

  if (!details.length && routingReason) {
    return [routingReason];
  }

  return details;
}

function buildTierCards(currentTierKey: string): TierCard[] {
  return [
    {
      key: "starter",
      name: "Starter",
      range: "$1,800 - $2,400",
      detail: "For single-page or focused 2-3 page sites with a narrow scope and no heavy integrations.",
      meta: "1-3 pages · focused offer · 2 revisions · faster launch",
      current: currentTierKey === "starter",
    },
    {
      key: "growth",
      name: "Growth",
      range: "$3,500 - $4,500",
      detail: "For most service businesses that need multiple pages, stronger trust signals, and a few integrations.",
      meta: "4-6 pages · booking/forms/CMS · 3 revisions · ~3 week build",
      current: currentTierKey === "growth",
    },
    {
      key: "premium",
      name: "Premium",
      range: "$6,500 - $10,000+",
      detail: "For deeper content architecture, advanced integrations, or a bigger conversion and content system.",
      meta: "7+ pages · advanced features · 4 revisions · longer implementation",
      current: currentTierKey === "premium",
    },
  ];
}

function buildIncludedColumns(featuresIncluded: string[]) {
  return [
    {
      id: "strategy",
      label: "/ 01 - Strategy",
      title: "Planning and structure",
      items: [
        "Site plan built around your conversion goals",
        "Messaging hierarchy for the pages that matter most",
        "Scope alignment before the build starts",
        "Content and asset planning so launch does not stall",
      ],
    },
    {
      id: "build",
      label: "/ 02 - Build",
      title: "Custom, fast, and yours",
      items: [
        "Mobile-first responsive design",
        ...featuresIncluded.slice(0, 3),
        "Structured review and revisions during the build",
      ].filter(Boolean),
    },
    {
      id: "launch",
      label: "/ 03 - Launch",
      title: "Live, owned, and supported",
      items: [
        "QA across key devices and browsers",
        "Domain connection and launch support",
        "Core forms, analytics, and SEO basics checked",
        "30 days post-launch support for fixes and questions",
      ],
    },
  ];
}

function buildProcess(args: {
  variant: EstimateVariant;
  deposit: number | null;
  callLabel: string | null;
}) {
  if (args.variant === "deep") {
    return [
      {
        label: "/ 01 - Next step",
        title: "Talk through the specifics",
        body: "We use the call to confirm the moving parts, tighten the scope, and turn the range into a fixed quote you can approve with confidence.",
      },
      {
        label: "/ 02 - After the call",
        title: "Approve scope and deposit",
        body: "Once the scope is locked, we send the final fixed quote and deposit link so kickoff can happen without back-and-forth.",
      },
      {
        label: "/ 03 - Build window",
        title: "Content, build, and review",
        body: "We gather anything still missing, build in stages, and keep the revision process visible inside your project workspace.",
      },
      {
        label: "/ 04 - Launch",
        title: "Go live and handoff",
        body: "We launch cleanly, test the important details, and leave you with ownership of the site, content, and accounts.",
      },
    ] satisfies ProcessStep[];
  }

  if (args.variant === "warm") {
    return [
      {
        label: "/ 01 - Next step",
        title: "Quick alignment call",
        body: "A short call helps us confirm the scope details that triggered a manual review without slowing the project down.",
      },
      {
        label: "/ 02 - Approval",
        title: "Accept and pay the deposit",
        body: `Once we confirm the details, you can approve the fixed quote and pay the ${args.deposit ? `$${args.deposit.toLocaleString("en-US")}` : "project"} deposit securely through Stripe.`,
      },
      {
        label: "/ 03 - Build",
        title: "Content and review loop",
        body: "Your workspace goes live, you send assets, and we build in visible milestones with revisions along the way.",
      },
      {
        label: "/ 04 - Launch",
        title: "Launch and support",
        body: "We connect the final details, launch cleanly, and cover the first 30 days of support after go-live.",
      },
    ] satisfies ProcessStep[];
  }

  return [
    {
      label: "/ 01 - Today",
      title: "Accept and pay deposit",
      body: `Approve the quote and pay the ${args.deposit ? `$${args.deposit.toLocaleString("en-US")}` : "project"} deposit securely through Stripe so we can kick off immediately.`,
    },
    {
      label: "/ 02 - Days 1-5",
      title: "Content and kickoff",
      body: "You send the last assets and content, and we organize the build plan inside your private workspace.",
    },
    {
      label: "/ 03 - Days 6-18",
      title: "Build and review",
      body: "We design, build, and revise the site while keeping every milestone visible so nothing feels like a black box.",
    },
    {
      label: "/ 04 - Launch",
      title: "Launch and handoff",
      body: "We connect the domain, test the important details, and hand over the finished site with support after launch.",
    },
  ] satisfies ProcessStep[];
}

function buildFaq(variant: EstimateVariant): FaqItem[] {
  return [
    {
      question: "Can we adjust the scope before kickoff?",
      answer:
        "Yes. If anything above feels off, message us before approval and we will revise the quote. Scope changes are easiest before the deposit, which is exactly why this page exists.",
    },
    {
      question: "What if the project grows during the build?",
      answer:
        "Changes inside the agreed scope stay inside the price. If the project expands beyond that, we handle it as a written change order before any new work starts.",
    },
    {
      question: "What does the price include?",
      answer:
        "The quote covers planning, design, build, revisions, launch support, and the first 30 days of post-launch fixes and questions. Third-party software fees stay separate.",
    },
    {
      question: variant === "deep" ? "Why is this a range instead of a fixed quote?" : "What happens if I change my mind after the deposit?",
      answer:
        variant === "deep"
          ? "The range means we see a viable project here, but a few variables still need to be confirmed live before we can lock the fixed number without padding it."
          : "The deposit covers kickoff, planning, and early production time. If something changes immediately after approval, we handle it according to the agreement and the work already completed.",
    },
  ];
}

async function findQuoteIdByToken(token: string) {
  if (!token) return null;
  const { data, error } = await supabaseAdmin
    .from("quotes")
    .select("id")
    .eq("public_token", token)
    .maybeSingle();

  if (error) throw error;
  return cleanString(data?.id) || null;
}

async function maybeBackfillQuoteIntake(quote: QuoteRow) {
  const quoteJson = safeObj(quote.quote_json);
  const intakeRaw = safeObj(quoteJson.intakeRaw);
  const intakeNormalized = safeObj(quoteJson.intakeNormalized);

  const patch: AnyObj = {};
  if (!Object.keys(safeObj(quote.intake_raw)).length && Object.keys(intakeRaw).length) {
    patch.intake_raw = intakeRaw;
  }
  if (!Object.keys(safeObj(quote.intake_normalized)).length && Object.keys(intakeNormalized).length) {
    patch.intake_normalized = intakeNormalized;
  }

  if (!cleanString(quote.tier_recommended)) {
    const pricingTruth = safeObj(quoteJson.pricingTruth);
    const tier = cleanString(pricingTruth.tierKey || pricingTruth.tierLabel);
    if (tier) patch.tier_recommended = normalizeTierLabel(tier);
  }

  if (!Object.keys(patch).length) return quote;

  const { data, error } = await supabaseAdmin
    .from("quotes")
    .update(patch)
    .eq("id", quote.id)
    .select(
      "id, public_token, lead_id, lead_email, created_at, status, tier_recommended, estimate_total, estimate_low, estimate_high, quote_json, intake_raw, intake_normalized, latest_pie_report_id"
    )
    .single();

  if (error) throw error;
  return data as QuoteRow;
}

function parsePie(pieRow: AnyObj | null) {
  const payload = safeObj(pieRow?.payload);
  if (cleanString(payload.version) !== "3.0") {
    return {
      routingPath: "",
      routingReason: null,
      triggerDetails: [] as any[],
      recommendedCallLength: null as 15 | 30 | null,
      targetPrice: null as number | null,
      tierRecommended: null as string | null,
      pagesIncluded: [] as string[],
      featuresIncluded: [] as string[],
      revisionRounds: null as number | null,
      estimatedWeeks: null as number | null,
    };
  }

  const routing = safeObj(payload.routing);
  const tier = safeObj(payload.tier);
  const scope = safeObj(payload.scope);
  const capacity = safeObj(payload.capacity);
  const estimatedWeeks = safeObj(capacity.estimatedWeeks);

  return {
    routingPath: cleanString(routing.finalPath || routing.path),
    routingReason: cleanString(routing.reason) || null,
    triggerDetails: safeArray(routing.triggerDetails),
    recommendedCallLength:
      Number(routing.recommendedCallLength) === 30
        ? 30
        : Number(routing.recommendedCallLength) === 15
        ? 15
        : null,
    targetPrice: toNumber(tier.targetPrice),
    tierRecommended: cleanString(tier.recommended) || null,
    pagesIncluded: cleanTextList(scope.pagesIncluded),
    featuresIncluded: cleanTextList(scope.featuresIncluded),
    revisionRounds: toNumber(scope.revisionRounds),
    estimatedWeeks: toNumber(estimatedWeeks.target),
  };
}

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildPortalMessageUrl(token: string | null) {
  return token ? `/portal/${encodeURIComponent(token)}` : null;
}

export async function loadEstimatePresentation(args: {
  quoteId?: string | null;
  quoteToken?: string | null;
  userId?: string | null;
  userEmail?: string | null;
}): Promise<EstimatePresentation | null> {
  let quoteId = cleanString(args.quoteId);
  const quoteToken = cleanString(args.quoteToken) || null;

  if (!quoteId && quoteToken) {
    quoteId = (await findQuoteIdByToken(quoteToken)) || "";
  }

  if (!quoteId) return null;

  const access = await resolveQuoteAccess({
    quoteId,
    quoteToken,
    userId: cleanString(args.userId) || null,
    userEmail: cleanString(args.userEmail) || null,
  });

  if (!access.ok) return null;

  const quoteRes = await supabaseAdmin
    .from("quotes")
    .select(
      "id, public_token, lead_id, lead_email, created_at, status, tier_recommended, estimate_total, estimate_low, estimate_high, quote_json, intake_raw, intake_normalized, latest_pie_report_id"
    )
    .eq("id", quoteId)
    .single();

  if (quoteRes.error || !quoteRes.data) {
    throw new Error(quoteRes.error?.message || "Quote not found.");
  }

  let quote = (await maybeBackfillQuoteIntake(quoteRes.data as QuoteRow)) as QuoteRow;

  const [leadRes, callRes] = await Promise.all([
    quote.lead_id
      ? supabaseAdmin
          .from("leads")
          .select("email, lead_email, phone, name")
          .eq("id", quote.lead_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as const),
    supabaseAdmin
      .from("call_requests")
      .select("status, best_time_to_call, preferred_times, timezone, notes, created_at")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (leadRes.error) throw leadRes.error;
  if (callRes.error) throw callRes.error;

  let pieRow: AnyObj | null = null;
  const existingPie = quote.latest_pie_report_id
    ? await supabaseAdmin
        .from("pie_reports")
        .select("id, payload")
        .eq("id", quote.latest_pie_report_id)
        .maybeSingle()
    : await supabaseAdmin
        .from("pie_reports")
        .select("id, payload")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

  if (existingPie.error) throw existingPie.error;
  pieRow = existingPie.data ?? null;

  if (!pieRow) {
    const ensured = await ensurePieForQuoteId(quoteId);
    if (ensured.ok && ensured.pie) {
      pieRow = ensured.pie;
    }
  }

  const portal = await ensureCustomerPortalForQuoteId(quoteId);
  const portalToken = cleanString(portal?.access_token) || null;

  const quoteJson = safeObj(quote.quote_json);
  const intake = {
    ...safeObj(quote.intake_raw),
    ...safeObj(quote.intake_normalized),
    ...safeObj(quoteJson.intakeRaw),
    ...safeObj(quoteJson.intakeNormalized),
  };
  const lead = safeObj(leadRes.data);
  const call = (callRes.data ?? null) as CallRequestRow | null;
  const pie = parsePie(pieRow);

  const currentTier = normalizeTierKey(
    firstString(pie.tierRecommended, quote.tier_recommended, safeObj(quoteJson.pricingTruth).tierKey)
  );
  const tierLabel = normalizeTierLabel(currentTier);
  const routingPath = cleanString(pie.routingPath).toLowerCase();
  const variant: EstimateVariant =
    routingPath === "warm" || routingPath === "deep" || routingPath === "fast"
      ? (routingPath as EstimateVariant)
      : quote.estimate_total
      ? "fast"
      : "deep";

  const pagesIncluded =
    pie.pagesIncluded.length
      ? pie.pagesIncluded
      : parsePages(firstString(intake.pagesWanted, intake.pages));

  const featuresIncluded =
    pie.featuresIncluded.length ? pie.featuresIncluded : deriveFeatures(intake);

  const target = toNumber(quote.estimate_total) ?? pie.targetPrice;
  const min = toNumber(quote.estimate_low) ?? target;
  const max = toNumber(quote.estimate_high) ?? target;
  const deposit = variant === "deep" || target == null ? null : Math.max(100, Math.round(target * 0.5));
  const balance = deposit != null && target != null ? Math.max(0, target - deposit) : null;
  const triggerDetails = buildContextDetails(pie.triggerDetails, pie.routingReason);
  const durationMinutes =
    variant === "deep" ? 30 : pie.recommendedCallLength === 30 ? 30 : 15;
  const businessName = firstString(
    intake.businessName,
    intake.companyName,
    intake.company_name,
    intake.business_name,
    intake.brandName,
    intake.organizationName,
    safeObj(quoteJson.lead).companyName,
    safeObj(quoteJson.business).name
  ) || "your business";
  const contactName = cleanString(lead.name) || null;
  const leadEmail = firstString(lead.email, lead.lead_email, quote.lead_email) || null;
  const callToBook: EstimatePresentation["callToBook"] =
    variant === "fast"
      ? null
      : {
          durationMinutes: durationMinutes as 15 | 30,
          ...buildCallLink({
            quoteId,
            quoteToken: quoteToken || cleanString(quote.public_token) || null,
            durationMinutes,
            businessName,
            leadEmail,
            leadName: contactName,
          }),
        };

  const scopeRows: ScopeRow[] = [
    {
      label: "Pages",
      value: pagesIncluded.length ? pagesIncluded.join(" · ") : "Page count confirmed at kickoff",
    },
    {
      label: "Features",
      value: featuresIncluded.length
        ? featuresIncluded.join(" · ")
        : "Feature stack confirmed from scope and intake",
    },
    {
      label: "Platform",
      value:
        firstString(
          intake.platform,
          intake.stack,
          "Next.js custom build, fully owned by you"
        ) || "Platform confirmed at kickoff",
    },
    {
      label: "Timeline",
      value:
        pie.estimatedWeeks != null
          ? `${pie.estimatedWeeks} week build window once kickoff starts`
          : firstString(intake.timeline, "Timeline aligned during scope approval"),
    },
    {
      label: "Revisions",
      value:
        pie.revisionRounds != null
          ? `${pie.revisionRounds} revision round${pie.revisionRounds === 1 ? "" : "s"} included`
          : currentTier === "premium"
          ? "4 revision rounds included"
          : currentTier === "starter"
          ? "2 revision rounds included"
          : "3 revision rounds included",
    },
    {
      label: "Support",
      value: "30 days post-launch support for fixes, polish, and questions",
    },
    {
      label: "Ownership",
      value: "You own the code, content, domain, and accounts. No lock-in.",
    },
  ];

  const scopeCaveat =
    variant === "deep"
      ? "These scope rows reflect our current best read from the intake and will be confirmed live before we lock the final fixed quote."
      : null;

  const createdAt = formatDate(quote.created_at);
  const validUntil = quote.created_at
    ? formatDate(new Date(new Date(quote.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString())
    : null;
  const projectLabel = describeProject(cleanString(intake.websiteType), pagesIncluded, featuresIncluded);

  const existingCallNote = call
    ? firstString(
        `Call request on file: ${firstString(call.preferred_times, call.best_time_to_call)}${cleanString(call.timezone) ? ` · ${cleanString(call.timezone)}` : ""}`,
        `Call request on file from ${formatDate(call.created_at) || "this week"}.`
      )
    : null;

  return {
    quoteId,
    quoteToken: quoteToken || cleanString(quote.public_token) || null,
    portalToken,
    variant,
    businessName,
    contactName,
    createdAt,
    validUntil,
    heroTitle:
      variant === "deep"
        ? `Here's what we're thinking for ${businessName}. Let's talk specifics.`
        : variant === "warm"
        ? `Here's what we'd build for ${businessName}.`
        : `Here's what we'd build for ${businessName}.`,
    heroBody: buildHeroBody({
      variant,
      businessName,
      websiteType: cleanString(intake.websiteType),
      pagesIncluded,
      featuresIncluded,
    }),
    heroMeta: [createdAt ? `Scoped ${createdAt}` : null, validUntil ? `Valid until ${validUntil}` : null]
      .filter(Boolean)
      .join(" · "),
    projectLabel,
    investmentIntro:
      variant === "deep"
        ? "We have a strong working range, but we want to confirm the final fixed scope on a short call before we take a deposit."
        : variant === "warm"
        ? "This is a fixed-price engagement. We would like to do a quick alignment call before you commit, then the deposit starts the build."
        : "This is a fixed-price engagement. No hourly billing, no surprise line items. You pay a 50% deposit to start and the remaining balance at launch.",
    contextNote:
      variant === "warm"
        ? "We'd like to do a quick call before you commit."
        : variant === "deep"
        ? "A call is required before we lock the final fixed quote."
        : null,
    contextDetails: triggerDetails,
    callToBook,
    existingCallNote,
    messageUrl: buildPortalMessageUrl(portalToken),
    acceptUrl:
      variant === "deep"
        ? null
        : `/api/estimate/accept`,
    acceptLabel:
      variant === "warm"
        ? "Accept as-is"
        : variant === "fast"
        ? "Accept & pay deposit"
        : null,
    scopeRows,
    scopeCaveat,
    price: {
      target,
      min,
      max,
      deposit,
      balance,
      tierLabel,
      tierKey: currentTier,
      priceNote:
        variant === "deep"
          ? "Range based on current scope. Final fixed quote confirmed after the call."
          : `${tierLabel} tier · fixed price · 50% deposit to start`,
    },
    included: buildIncludedColumns(featuresIncluded),
    process: buildProcess({
      variant,
      deposit,
      callLabel: callToBook?.label || null,
    }),
    tierIntro: `For context, ${businessName} fits our ${tierLabel} tier because of the scope, page count, and feature load we see in the intake.`,
    tierCards: buildTierCards(currentTier),
    faq: buildFaq(variant),
    closing: {
      title:
        variant === "deep"
          ? "Ready to lock the final scope?"
          : variant === "warm"
          ? "Ready to align before kickoff?"
          : "Ready to make this happen?",
      body:
        variant === "deep"
          ? "Book the call and we will turn the range into a final fixed quote you can approve with confidence."
          : variant === "warm"
          ? "A short call keeps the quote honest, confirms the details that matter, and lets us move into kickoff without guesswork."
          : "Accept the estimate and pay the deposit to kick off your project. Your project workspace will be ready right away so we can move into planning without delay.",
      fineprint:
        validUntil != null
          ? `Estimate valid for 14 days · expires ${validUntil}`
          : "Estimate valid for 14 days from issue date",
    },
  };
}
