import { getEcommercePricing } from "@/lib/pricing";
import type { EcommercePricingInput, PricingResult } from "@/lib/pricing";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type EcommerceWorkspaceMode = "build" | "run" | "fix";

export type EcommerceWorkspaceItem = {
  id: string;
  title: string;
  status: string;
  notes: string;
};

export type EcommerceWorkspaceMetric = {
  id: string;
  label: string;
  value: string;
  target: string;
  notes: string;
};

export type EcommerceWorkspaceState = {
  mode: EcommerceWorkspaceMode;
  phase: string;
  waitingOn: string;
  adminPublicNote: string;
  internalNotes: string;
  serviceSummary: string;
  onboardingSummary: string;
  previewUrl: string;
  productionUrl: string;
  agreementStatus: string;
  agreementText: string;
  agreementAcceptedAt: string;
  depositStatus: string;
  depositAmount: number | null;
  depositUrl: string;
  depositSessionId: string;
  depositPaidAt: string;
  depositNotice: string;
  depositNoticeSentAt: string;
  deliverables: EcommerceWorkspaceItem[];
  milestones: EcommerceWorkspaceItem[];
  approvals: EcommerceWorkspaceItem[];
  assetsNeeded: EcommerceWorkspaceItem[];
  requests: EcommerceWorkspaceItem[];
  issues: EcommerceWorkspaceItem[];
  tasks: EcommerceWorkspaceItem[];
  metrics: EcommerceWorkspaceMetric[];
  nextActions: string[];
  monthlyPlan: string[];
  lastSavedAt: string;
  lastSavedBy: string;
};

export type EcommerceWorkspaceRecommendation = PricingResult<string>;

export type EcommerceWorkspaceBundle = {
  intake: any;
  quote: any | null;
  call: any | null;
  recommendation: EcommerceWorkspaceRecommendation;
  workspace: EcommerceWorkspaceState;
  isAdmin: boolean;
};

export type EcommerceAdminRow = {
  ecomIntakeId: string;
  createdAt: string | null;
  businessName: string;
  contactName: string;
  email: string;
  status: string;
  callStatus: string;
  quoteStatus: string;
  phase: string;
  waitingOn: string;
  mode: EcommerceWorkspaceMode;
  monthlyOrders: string;
  serviceSummary: string;
  recommendationTier: string;
  recommendationRange: string;
  links: {
    detail: string;
    portal: string;
  };
};

type JsonRecord = Record<string, any>;

function asObj(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

const safeObj = asObj;

function asArray<T = any>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function num(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ensureHttpsOrHttp(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
    return "";
  } catch {
    return "";
  }
}

function normalizeList(value: unknown): string[] {
  return asArray<string>(value).map((item) => str(item)).filter(Boolean);
}

function normalizeItems(value: unknown): EcommerceWorkspaceItem[] {
  return asArray<any>(value).map((item, index) => ({
    id: str(item?.id, `item-${index + 1}`),
    title: str(item?.title, `Item ${index + 1}`),
    status: str(item?.status, "pending"),
    notes: str(item?.notes),
  }));
}

function normalizeMetrics(value: unknown): EcommerceWorkspaceMetric[] {
  return asArray<any>(value).map((item, index) => ({
    id: str(item?.id, `metric-${index + 1}`),
    label: str(item?.label, `Metric ${index + 1}`),
    value: str(item?.value),
    target: str(item?.target),
    notes: str(item?.notes),
  }));
}

function makeId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

export function detectEcommerceMode(intake: any): EcommerceWorkspaceMode {
  const services = (Array.isArray(intake?.service_types) ? intake.service_types : []).map((item: unknown) => str(item).toLowerCase());

  if (services.some((item) => item.includes("build") || item.includes("design") || item.includes("setup"))) {
    return "build";
  }

  if (services.some((item) => item.includes("audit") || item.includes("fix") || item.includes("optimization") || item.includes("overhaul"))) {
    return "fix";
  }

  return "run";
}

export function buildEcommercePricingInputFromIntake(intake: any): EcommercePricingInput {
  return {
    entryPath: detectEcommerceMode(intake),
    businessName: str(intake?.business_name),
    platform: str(intake?.platform),
    salesChannels: Array.isArray(intake?.sales_channels) ? intake.sales_channels : [],
    serviceTypes: Array.isArray(intake?.service_types) ? intake.service_types : [],
    skuCount: str(intake?.sku_count),
    monthlyOrders: str(intake?.monthly_orders),
    peakOrders: str(intake?.peak_orders),
    budgetRange: str(intake?.budget_range),
    timeline: str(intake?.timeline),
    storeUrl: str(intake?.store_url),
    notes: str(intake?.notes),
  };
}

export function getEcommerceRecommendationForIntake(intake: any): EcommerceWorkspaceRecommendation {
  const recommendationJson = asObj(intake?.recommendation_json);
  if (recommendationJson && Object.keys(recommendationJson).length) {
    return recommendationJson as EcommerceWorkspaceRecommendation;
  }

  const quoteJson = asObj(intake?.quote_json);
  if (quoteJson?.pricingRecommendation && typeof quoteJson.pricingRecommendation === "object") {
    return quoteJson.pricingRecommendation as EcommerceWorkspaceRecommendation;
  }

  return getEcommercePricing(buildEcommercePricingInputFromIntake(intake));
}

export function getRecommendedEcommerceQuoteDefaults(recommendation: EcommerceWorkspaceRecommendation) {
  if (recommendation.billingModel === "hybrid") {
    return {
      setupFee: recommendation.setupBand?.target ?? null,
      monthlyFee: recommendation.monthlyBand?.target ?? null,
      label: recommendation.tierLabel,
    };
  }

  return {
    setupFee: recommendation.band?.target ?? null,
    monthlyFee: null,
    label: recommendation.tierLabel,
  };
}

function defaultPhase(mode: EcommerceWorkspaceMode, call: any, quote: any) {
  const quoteStatus = str(quote?.status).toLowerCase();
  if (quoteStatus === "accepted") return mode === "run" ? "onboarding" : "build_ready";
  if (quoteStatus === "sent" || quoteStatus === "review") return "proposal_review";
  if (call?.id) return "discovery";
  return "intake";
}

function defaultWaitingOn(mode: EcommerceWorkspaceMode, call: any, quote: any) {
  const quoteStatus = str(quote?.status).toLowerCase();
  if (quoteStatus === "accepted") return mode === "run" ? "Onboarding details" : "Kickoff and assets";
  if (quoteStatus === "sent" || quoteStatus === "review") return "Client proposal review";
  if (call?.id) return "Planning call completion";
  return "CrecyStudio intake review";
}

function defaultServiceSummary(mode: EcommerceWorkspaceMode, intake: any, recommendation?: EcommerceWorkspaceRecommendation) {
  const services = (Array.isArray(intake?.service_types) ? intake.service_types : []).map((item: unknown) => str(item)).filter(Boolean);
  if (services.length) return services.join(", ");
  if (recommendation?.tierLabel) return recommendation.tierLabel;
  if (mode === "build") return "Store build and launch support";
  if (mode === "fix") return "Store optimization and issue resolution";
  return "Managed e-commerce operations";
}

function defaultOnboardingSummary(mode: EcommerceWorkspaceMode) {
  if (mode === "build") return "Collect brand assets, product data, checkout preferences, and launch requirements.";
  if (mode === "fix") return "Confirm current problems, access needs, and the order of fixes before rollout.";
  return "Confirm channels, order flow, customer service process, and recurring reporting expectations.";
}

function defaultDeliverables(mode: EcommerceWorkspaceMode): EcommerceWorkspaceItem[] {
  if (mode === "build") {
    return [
      { id: makeId("deliverable", 0), title: "Store structure defined", status: "pending", notes: "Collections, navigation, and platform setup." },
      { id: makeId("deliverable", 1), title: "Product catalog loaded", status: "pending", notes: "Products, variants, media, and pricing." },
      { id: makeId("deliverable", 2), title: "Checkout + shipping configured", status: "pending", notes: "Tax, shipping, and payment setup." },
      { id: makeId("deliverable", 3), title: "Launch review completed", status: "pending", notes: "Final QA and go-live approval." },
    ];
  }

  if (mode === "fix") {
    return [
      { id: makeId("deliverable", 0), title: "Audit findings documented", status: "pending", notes: "Performance, UX, or conversion issues." },
      { id: makeId("deliverable", 1), title: "Priority fixes implemented", status: "pending", notes: "Top issues resolved first." },
      { id: makeId("deliverable", 2), title: "Post-fix QA completed", status: "pending", notes: "Validate improvements before closing." },
    ];
  }

  return [
    { id: makeId("deliverable", 0), title: "Operations scope confirmed", status: "pending", notes: "Define channels, service windows, and handoff rules." },
    { id: makeId("deliverable", 1), title: "Monthly task cadence active", status: "pending", notes: "Routine updates, merchandising, reporting, and support." },
    { id: makeId("deliverable", 2), title: "Reporting dashboard shared", status: "pending", notes: "KPIs and monthly business review." },
  ];
}

function defaultMilestones(mode: EcommerceWorkspaceMode): EcommerceWorkspaceItem[] {
  const common = [
    { id: makeId("milestone", 0), title: "Intake received", status: "done", notes: "Lead captured in the workspace." },
    { id: makeId("milestone", 1), title: "Planning call", status: "pending", notes: "Review business goals and required scope." },
    { id: makeId("milestone", 2), title: "Proposal review", status: "pending", notes: "Confirm pricing and service path." },
  ];

  if (mode === "build") {
    return [...common,
      { id: makeId("milestone", 3), title: "Build kickoff", status: "pending", notes: "Start setup after approval." },
      { id: makeId("milestone", 4), title: "Preview review", status: "pending", notes: "Client reviews the first build." },
      { id: makeId("milestone", 5), title: "Launch", status: "pending", notes: "Go live after final approval." },
    ];
  }

  if (mode === "fix") {
    return [...common,
      { id: makeId("milestone", 3), title: "Audit delivered", status: "pending", notes: "Problems ranked by impact." },
      { id: makeId("milestone", 4), title: "Fixes shipped", status: "pending", notes: "Priority improvements rolled out." },
      { id: makeId("milestone", 5), title: "Results verified", status: "pending", notes: "Post-fix review and closeout." },
    ];
  }

  return [...common,
    { id: makeId("milestone", 3), title: "Operations onboarding", status: "pending", notes: "Tools, access, and ownership mapped." },
    { id: makeId("milestone", 4), title: "Monthly rhythm active", status: "pending", notes: "Regular execution begins." },
    { id: makeId("milestone", 5), title: "Performance review", status: "pending", notes: "KPIs and improvements reviewed." },
  ];
}

function defaultApprovals(mode: EcommerceWorkspaceMode): EcommerceWorkspaceItem[] {
  return [
    { id: makeId("approval", 0), title: "Scope approval", status: "pending", notes: `Confirm the ${mode} scope before execution.` },
    { id: makeId("approval", 1), title: "Agreement approval", status: "pending", notes: "Accept agreement before kickoff." },
    { id: makeId("approval", 2), title: mode === "build" ? "Launch approval" : "Delivery signoff", status: "pending", notes: mode === "build" ? "Approve go-live." : "Approve completion of current work." },
  ];
}

function defaultAssets(mode: EcommerceWorkspaceMode): EcommerceWorkspaceItem[] {
  if (mode === "build") {
    return [
      { id: makeId("asset", 0), title: "Brand assets", status: "pending", notes: "Logo, colors, fonts, and references." },
      { id: makeId("asset", 1), title: "Product data", status: "pending", notes: "Titles, descriptions, pricing, and variants." },
      { id: makeId("asset", 2), title: "Product media", status: "pending", notes: "Images and video if applicable." },
    ];
  }

  if (mode === "fix") {
    return [
      { id: makeId("asset", 0), title: "Store access", status: "pending", notes: "Required access to diagnose and implement fixes." },
      { id: makeId("asset", 1), title: "Problem examples", status: "pending", notes: "Screenshots, tickets, or user complaints." },
    ];
  }

  return [
    { id: makeId("asset", 0), title: "Operations access", status: "pending", notes: "Platform, marketplace, and reporting access." },
    { id: makeId("asset", 1), title: "Priority list", status: "pending", notes: "Monthly priorities and focus areas." },
  ];
}

function defaultTasks(mode: EcommerceWorkspaceMode): EcommerceWorkspaceItem[] {
  if (mode === "build") {
    return [
      { id: makeId("task", 0), title: "Confirm storefront structure", status: "planned", notes: "Pages, navigation, and customer journey." },
      { id: makeId("task", 1), title: "Load first product batch", status: "planned", notes: "Catalog import and QA." },
      { id: makeId("task", 2), title: "Prepare launch checklist", status: "planned", notes: "Payments, shipping, policies, and test orders." },
    ];
  }

  if (mode === "fix") {
    return [
      { id: makeId("task", 0), title: "Reproduce top issues", status: "planned", notes: "Validate the current problem state." },
      { id: makeId("task", 1), title: "Implement priority fixes", status: "planned", notes: "Start with the highest-impact issues." },
      { id: makeId("task", 2), title: "Retest affected flows", status: "planned", notes: "Ensure fixes stick after deployment." },
    ];
  }

  return [
    { id: makeId("task", 0), title: "Confirm monthly ops cadence", status: "planned", notes: "Define recurring updates and reporting." },
    { id: makeId("task", 1), title: "Review channel priorities", status: "planned", notes: "Marketplace, storefront, merchandising, and support." },
    { id: makeId("task", 2), title: "Publish first reporting cycle", status: "planned", notes: "KPI review and next-step plan." },
  ];
}

function defaultMetrics(mode: EcommerceWorkspaceMode): EcommerceWorkspaceMetric[] {
  if (mode === "build") {
    return [
      { id: makeId("metric", 0), label: "Launch readiness", value: "0%", target: "100%", notes: "Overall setup completion before launch." },
      { id: makeId("metric", 1), label: "Products loaded", value: "0", target: "Catalog ready", notes: "Track catalog import progress." },
    ];
  }

  if (mode === "fix") {
    return [
      { id: makeId("metric", 0), label: "Critical issues open", value: "0", target: "0", notes: "Priority issues remaining." },
      { id: makeId("metric", 1), label: "Fixes shipped", value: "0", target: "All priorities", notes: "Completed improvements shipped." },
    ];
  }

  return [
    { id: makeId("metric", 0), label: "Orders handled", value: "—", target: "Steady execution", notes: "Monthly operations throughput." },
    { id: makeId("metric", 1), label: "Response quality", value: "—", target: "Improving", notes: "Customer support and task completion quality." },
  ];
}

function defaultNextActions(mode: EcommerceWorkspaceMode): string[] {
  if (mode === "build") return ["Confirm brand assets", "Approve scope and pricing", "Prepare kickoff checklist"];
  if (mode === "fix") return ["Confirm the main store problems", "Approve the first repair batch", "Validate post-fix QA"];
  return ["Confirm monthly priorities", "Approve service cadence", "Align on reporting expectations"];
}

function defaultMonthlyPlan(mode: EcommerceWorkspaceMode): string[] {
  if (mode === "run") {
    return ["Weekly merchandising update", "Monthly KPI review", "Customer support / operations sweep"];
  }
  return [];
}

export function normalizeEcommerceWorkspaceState(input: { intake: any; quote: any | null; call: any | null; recommendation?: EcommerceWorkspaceRecommendation }): EcommerceWorkspaceState {
  const mode = detectEcommerceMode(input.intake);
  const quoteJson = asObj(input.quote?.quote_json);
  const workspace = asObj(quoteJson.workspace);
  const deposit = asObj(quoteJson.deposit);
  const recommendation = input.recommendation;

  return {
    mode,
    phase: str(workspace.phase, defaultPhase(mode, input.call, input.quote)),
    waitingOn: str(workspace.waitingOn, defaultWaitingOn(mode, input.call, input.quote)),
    adminPublicNote: str(workspace.adminPublicNote),
    internalNotes: str(workspace.internalNotes),
    serviceSummary: str(workspace.serviceSummary, defaultServiceSummary(mode, input.intake, recommendation)),
    onboardingSummary: str(workspace.onboardingSummary, defaultOnboardingSummary(mode)),
    previewUrl: ensureHttpsOrHttp(workspace.previewUrl),
    productionUrl: ensureHttpsOrHttp(workspace.productionUrl) || ensureHttpsOrHttp(input.intake?.store_url),
    agreementStatus: str(workspace.agreementStatus || quoteJson.agreement_status, "pending"),
    agreementText: str(workspace.agreementText),
    agreementAcceptedAt: str(workspace.agreementAcceptedAt || quoteJson.agreement_accepted_at),
    depositStatus: str(workspace.depositStatus || deposit.status, "pending"),
    depositAmount: num(workspace.depositAmount ?? deposit.amount),
    depositUrl: str(workspace.depositUrl || deposit.url),
    depositSessionId: str(workspace.depositSessionId || deposit.session_id),
    depositPaidAt: str(workspace.depositPaidAt || deposit.paid_at),
    depositNotice: str(workspace.depositNotice || quoteJson.deposit_notice),
    depositNoticeSentAt: str(workspace.depositNoticeSentAt || quoteJson.deposit_notice_sent_at || deposit.created_at),
    deliverables: normalizeItems(workspace.deliverables).length ? normalizeItems(workspace.deliverables) : defaultDeliverables(mode),
    milestones: normalizeItems(workspace.milestones).length ? normalizeItems(workspace.milestones) : defaultMilestones(mode),
    approvals: normalizeItems(workspace.approvals).length ? normalizeItems(workspace.approvals) : defaultApprovals(mode),
    assetsNeeded: normalizeItems(workspace.assetsNeeded).length ? normalizeItems(workspace.assetsNeeded) : defaultAssets(mode),
    requests: normalizeItems(workspace.requests),
    issues: normalizeItems(workspace.issues),
    tasks: normalizeItems(workspace.tasks).length ? normalizeItems(workspace.tasks) : defaultTasks(mode),
    metrics: normalizeMetrics(workspace.metrics).length ? normalizeMetrics(workspace.metrics) : defaultMetrics(mode),
    nextActions: normalizeList(workspace.nextActions).length ? normalizeList(workspace.nextActions) : defaultNextActions(mode),
    monthlyPlan: normalizeList(workspace.monthlyPlan).length ? normalizeList(workspace.monthlyPlan) : defaultMonthlyPlan(mode),
    lastSavedAt: str(workspace.lastSavedAt),
    lastSavedBy: str(workspace.lastSavedBy),
  };
}

async function getLatestQuote(intakeId: string) {
  const { data, error } = await supabaseAdmin.from("ecom_quotes").select("*").eq("ecom_intake_id", intakeId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

async function ensureQuote(intakeId: string) {
  const existing = await getLatestQuote(intakeId);
  if (existing) return existing;

  const { data, error } = await supabaseAdmin.from("ecom_quotes").insert({ ecom_intake_id: intakeId, status: "draft", quote_json: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getEcommerceWorkspaceBundle(intakeId: string, options?: { isAdmin?: boolean }): Promise<EcommerceWorkspaceBundle | null> {
  const [{ data: intake, error: intakeError }, { data: call, error: callError }, quote] = await Promise.all([
    supabaseAdmin.from("ecom_intakes").select("*").eq("id", intakeId).maybeSingle(),
    supabaseAdmin.from("ecom_call_requests").select("*").eq("ecom_intake_id", intakeId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    getLatestQuote(intakeId),
  ]);

  if (intakeError) throw new Error(intakeError.message);
  if (callError) throw new Error(callError.message);
  if (!intake) return null;

  const recommendation = getEcommerceRecommendationForIntake(intake);

  return {
    intake,
    quote,
    call: call ?? null,
    recommendation,
    workspace: normalizeEcommerceWorkspaceState({ intake, quote, call, recommendation }),
    isAdmin: !!options?.isAdmin,
  };
}

export async function saveEcommerceWorkspaceState(args: { ecomIntakeId: string; patch: Partial<EcommerceWorkspaceState>; savedBy?: string }) {
  const { data: intake, error: intakeError } = await supabaseAdmin.from("ecom_intakes").select("*").eq("id", args.ecomIntakeId).maybeSingle();
  if (intakeError) return { ok: false as const, error: intakeError.message };
  if (!intake) return { ok: false as const, error: "E-commerce intake not found." };

  const quote = await ensureQuote(args.ecomIntakeId);
  const recommendation = getEcommerceRecommendationForIntake(intake);
  const current = normalizeEcommerceWorkspaceState({ intake, quote, call: null, recommendation });

  const next: EcommerceWorkspaceState = {
    ...current,
    ...args.patch,
    previewUrl: ensureHttpsOrHttp(args.patch.previewUrl ?? current.previewUrl),
    productionUrl: ensureHttpsOrHttp(args.patch.productionUrl ?? current.productionUrl),
    deliverables: args.patch.deliverables ?? current.deliverables,
    milestones: args.patch.milestones ?? current.milestones,
    approvals: args.patch.approvals ?? current.approvals,
    assetsNeeded: args.patch.assetsNeeded ?? current.assetsNeeded,
    requests: args.patch.requests ?? current.requests,
    issues: args.patch.issues ?? current.issues,
    tasks: args.patch.tasks ?? current.tasks,
    metrics: args.patch.metrics ?? current.metrics,
    nextActions: args.patch.nextActions ?? current.nextActions,
    monthlyPlan: args.patch.monthlyPlan ?? current.monthlyPlan,
    lastSavedAt: new Date().toISOString(),
    lastSavedBy: args.savedBy || current.lastSavedBy || "admin",
  };

  const existingQuoteJson = asObj(quote?.quote_json);
  const nextQuoteJson = {
    ...existingQuoteJson,
    pricingRecommendation: recommendation,
    agreement_status: next.agreementStatus,
    agreement_accepted_at: next.agreementAcceptedAt || null,
    deposit_notice: next.depositNotice || null,
    deposit_notice_sent_at: next.depositNoticeSentAt || null,
    deposit: {
      ...safeObj(existingQuoteJson.deposit),
      session_id: next.depositSessionId || null,
      url: next.depositUrl || null,
      amount: next.depositAmount ?? null,
      paid_at: next.depositPaidAt || null,
      status: next.depositStatus || null,
    },
    workspace: next,
  };

  const payload: Record<string, unknown> = { quote_json: nextQuoteJson, updated_at: new Date().toISOString() };
  const { error } = await supabaseAdmin.from("ecom_quotes").update(payload).eq("id", quote.id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export function makeClientSafeEcommerceBundle(bundle: EcommerceWorkspaceBundle, options?: { isAdmin?: boolean }): EcommerceWorkspaceBundle {
  if (options?.isAdmin) return bundle;
  return { ...bundle, workspace: { ...bundle.workspace, internalNotes: "" } };
}

export async function getEcommerceAdminRows(): Promise<EcommerceAdminRow[]> {
  const [{ data: intakes, error: intakeError }, { data: calls, error: callError }, { data: quotes, error: quoteError }] = await Promise.all([
    supabaseAdmin.from("ecom_intakes").select("*").order("created_at", { ascending: false }).limit(150),
    supabaseAdmin.from("ecom_call_requests").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("ecom_quotes").select("*").order("created_at", { ascending: false }),
  ]);

  if (intakeError) throw new Error(intakeError.message);
  if (callError) throw new Error(callError.message);
  if (quoteError) throw new Error(quoteError.message);

  const latestCallByIntake = new Map<string, any>();
  for (const call of calls ?? []) {
    if (!latestCallByIntake.has(call.ecom_intake_id)) latestCallByIntake.set(call.ecom_intake_id, call);
  }

  const latestQuoteByIntake = new Map<string, any>();
  for (const quote of quotes ?? []) {
    if (!latestQuoteByIntake.has(quote.ecom_intake_id)) latestQuoteByIntake.set(quote.ecom_intake_id, quote);
  }

  return ((intakes ?? []) as any[]).map((intake) => {
    const call = latestCallByIntake.get(intake.id) ?? null;
    const quote = latestQuoteByIntake.get(intake.id) ?? null;
    const recommendation = getEcommerceRecommendationForIntake(intake);
    const workspace = normalizeEcommerceWorkspaceState({ intake, quote, call, recommendation });
    return {
      ecomIntakeId: intake.id,
      createdAt: intake.created_at || null,
      businessName: str(intake.business_name, "E-commerce lead"),
      contactName: str(intake.contact_name, "Unknown contact"),
      email: str(intake.email, "No email"),
      status: str(intake.status, "new"),
      callStatus: str(call?.status, "not requested"),
      quoteStatus: str(quote?.status, "not started"),
      phase: workspace.phase,
      waitingOn: workspace.waitingOn,
      mode: workspace.mode,
      monthlyOrders: str(intake.monthly_orders, "—"),
      serviceSummary: workspace.serviceSummary,
      recommendationTier: recommendation.tierLabel,
      recommendationRange: recommendation.displayRange,
      links: { detail: `/internal/admin/ecommerce/${intake.id}`, portal: `/portal/ecommerce/${intake.id}` },
    };
  });
}
