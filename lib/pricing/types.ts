// Pricing lanes mirror the workflow ProjectType enum. The deprecated
// "ops" lane has been removed from the type union — all engine code
// emits "automation" — but normalizePricingLane below still accepts
// "ops" on read to handle stored quote / pricingTruth / Stripe metadata
// from before the rename.
export type PricingLane =
  | "website"
  | "automation"
  | "ecommerce"
  | "web_app"
  | "rescue";

// Normalize a stored lane string to the canonical PricingLane. Accepts
// the legacy "ops" value (returns "automation") so old persisted data
// still compares equal to current code's "automation" reads. Anything
// not in the canonical set falls back to "website".
export function normalizePricingLane(lane: string | null | undefined): PricingLane {
  if (lane === "ops" || lane === "automation") return "automation";
  if (lane === "website" || lane === "ecommerce" || lane === "web_app" || lane === "rescue") {
    return lane;
  }
  return "website";
}

export type PricingPosition = "low" | "middle" | "high" | "custom";

export type WebsiteTierKey =
  | "starter_site"
  | "growth_site"
  | "premium_build"
  | "custom_scope";

export type OpsTierKey =
  | "quick_workflow_fix"
  | "ops_system_build"
  | "ongoing_systems_partner"
  | "custom_ops_scope";

// Same tier set as OpsTierKey — automation is the canonical name; ops
// is a deprecated alias that still works for existing callers.
export type AutomationTierKey = OpsTierKey;

export type EcommerceTierKey =
  | "store_launch_build"
  | "growth_store_build"
  | "commerce_repair_sprint"
  | "commerce_growth_repair"
  | "ecommerce_ops_support"
  | "managed_commerce_partner"
  | "custom_ecommerce_scope";

// Phase 4 — new web_app lane. Prices reflect the audit's recommended
// raises (custom apps and client portals were 30–50% under market).
export type WebAppTierKey =
  | "small_internal_tool"
  | "portal_dashboard_mvp"
  | "saas_mvp"
  | "full_client_portal"
  | "custom_web_app_scope";

// Phase 4 — new rescue lane.
export type RescueTierKey =
  | "basic_rescue"
  | "full_rescue_sprint"
  | "custom_rescue_scope";

export type PricingReasonImpact = "supporting" | "upward" | "custom" | "fit";

export type PricingReason = {
  label: string;
  note: string;
  impact: PricingReasonImpact;
};

export type PricingBand = {
  min: number;
  max: number;
  target: number;
};

export type PricingBillingModel = "project" | "monthly" | "hybrid";

export type PricingResult<TTier extends string = string> = {
  version: string;
  lane: PricingLane;
  tierKey: TTier;
  tierLabel: string;
  position: PricingPosition;
  isCustomScope: boolean;
  band: PricingBand;
  setupBand?: PricingBand;
  monthlyBand?: PricingBand;
  billingModel?: PricingBillingModel;
  displayRange: string;
  publicMessage: string;
  summary: string;
  estimatorSummary: string;
  reasons: PricingReason[];
  complexityFlags: string[];
  complexityScore: number;
};

export type WebsitePricingInput = {
  websiteType: "business" | "ecommerce" | "portfolio" | "landing";
  pages: "1" | "1-3" | "4-6" | "6-8" | "9+";
  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;
  wantsAutomation: "yes" | "no";
  automationTypes: string[];
  integrations: string[];
  integrationOther: string;
  contentReady: "ready" | "some" | "not_ready";
  domainHosting: "yes" | "no";
  timeline: string;
  intent: string;
  budget?: string;
  hasLogo?: "yes" | "no";
  hasBrandGuide?: "yes" | "no";
};

export type OpsPricingInput = {
  companyName: string;
  industry: string;
  teamSize: string;
  jobVolume: string;
  monthlyRevenue: string;
  budgetRange: string;
  currentTools: string[];
  painPoints: string[];
  triedBefore: string;
  workflowsNeeded: string[];
  urgency: string;
  readiness: string;
  notes: string;
};

// Phase 4 — web_app pricing engine input. Mirrors the fields collected
// in CustomAppIntakeClient. The engine uses these to pick the right
// tier (small_internal_tool / portal_dashboard_mvp / saas_mvp /
// full_client_portal).
export type WebAppPricingInput = {
  projectDescription: string;
  targetUsers: string;          // "internal-team" | "paying-customers" | "both"
  userScale: string;
  stage: string;
  scopePreference: string;
  timeline: string;
  integrations: string[];
  integrationNotes: string;
  compliance: string[];
  budget: string;
  budgetFlexibility: string;
};

// Phase 4 — rescue pricing engine input. Mirrors RescueIntakeClient.
export type RescuePricingInput = {
  siteUrl: string;
  platform: string;
  issues: string[];
  urgency: string;              // "critical" | "soon" | "low"
  builtWhen: string;
  builtBy: string;
  previousVendorStatus: string;
  alreadyTried: string;
  assetAccess: string[];
  seoPreservation: string;
  urlsToPreserve: string;
  budget: string;
  notes: string;
};

export type EcommercePricingInput = {
  entryPath?: "build" | "run" | "fix" | null;
  businessName: string;
  platform: string;
  salesChannels: string[];
  serviceTypes: string[];
  skuCount: string;
  monthlyOrders: string;
  peakOrders: string;
  budgetRange: string;
  timeline: string;
  storeUrl: string;
  notes: string;
};
