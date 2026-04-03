export type PricingLane = "website" | "ops" | "ecommerce";

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

export type EcommerceTierKey =
  | "store_launch_build"
  | "growth_store_build"
  | "commerce_repair_sprint"
  | "commerce_growth_repair"
  | "ecommerce_ops_support"
  | "managed_commerce_partner"
  | "custom_ecommerce_scope";

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
