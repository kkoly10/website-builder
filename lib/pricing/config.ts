import type {
  AiIntakeTierKey,
  EcommerceTierKey,
  OpsTierKey,
  RescueTierKey,
  WebAppTierKey,
  WebsiteTierKey,
} from "@/lib/pricing/types";

export const PRICING_VERSION = "startup-v2-2026-04";
export const INTERNAL_HOURLY_RATE = 85;

export const PRICING_MESSAGES = {
  depositPolicy: "50% deposit to start, 50% on completion.",
  websiteCustom: "Custom scope — strategy call required.",
  opsCustom: "Custom ops scope — strategy call required.",
  // Phase 4: alias for opsCustom — same copy, canonical lane name.
  automationCustom: "Custom automation scope — strategy call required.",
  ecommerceCustom: "Custom e-commerce scope — strategy call required.",
  webAppCustom: "Custom web app scope — strategy call required.",
  rescueCustom: "Custom rescue scope — strategy call required.",
  aiIntakeCustom: "Custom AI integration scope — discovery call required.",
};

export const WEBSITE_TIER_CONFIG: Record<
  Exclude<WebsiteTierKey, "custom_scope">,
  { label: string; min: number; max: number }
> = {
  starter_site: {
    label: "Starter Site",
    min: 1800,
    max: 2400,
  },
  growth_site: {
    label: "Growth Site",
    min: 3500,
    max: 4500,
  },
  premium_build: {
    label: "Premium Build",
    min: 6500,
    max: 10000,
  },
};

// Workflow automation pricing tiers. Renamed from OPS_TIER_CONFIG —
// canonical name is AUTOMATION_TIER_CONFIG (lane "automation"). The
// deprecated OPS_TIER_CONFIG export below is a value alias for callers
// that haven't been updated yet.
export const AUTOMATION_TIER_CONFIG: Record<
  Exclude<OpsTierKey, "custom_ops_scope">,
  { label: string; min: number; max: number; monthly?: boolean }
> = {
  quick_workflow_fix: {
    label: "Quick Workflow Fix",
    min: 1000,
    max: 1800,
  },
  ops_system_build: {
    label: "Automation System Build",
    min: 2000,
    max: 3800,
  },
  ongoing_systems_partner: {
    label: "Ongoing Systems Partner",
    min: 500,
    max: 1250,
    monthly: true,
  },
};

// Deprecated alias. Same object — labels updated to canonical names.
export const OPS_TIER_CONFIG = AUTOMATION_TIER_CONFIG;

export const ECOMMERCE_TIER_CONFIG: Record<
  Exclude<EcommerceTierKey, "custom_ecommerce_scope">,
  {
    label: string;
    billingModel: "project" | "monthly" | "hybrid";
    projectMin?: number;
    projectMax?: number;
    setupMin?: number;
    setupMax?: number;
    monthlyMin?: number;
    monthlyMax?: number;
  }
> = {
  store_launch_build: {
    label: "Launch Store Build",
    billingModel: "project",
    projectMin: 1800,
    projectMax: 3200,
  },
  growth_store_build: {
    // Phase 4: bumped from $3,200–$5,200 per the audit's market check.
    // Industry agency-led custom Shopify builds are $5k–$15k+; our
    // previous floor was at the low edge of the freelance band even for
    // a fully-custom theme. New range is still solo-studio competitive.
    label: "Growth Store Build",
    billingModel: "project",
    projectMin: 3500,
    projectMax: 6500,
  },
  commerce_repair_sprint: {
    label: "Commerce Repair Sprint",
    billingModel: "project",
    projectMin: 1200,
    projectMax: 2200,
  },
  commerce_growth_repair: {
    label: "Commerce Growth Repair",
    billingModel: "project",
    projectMin: 2300,
    projectMax: 4200,
  },
  ecommerce_ops_support: {
    label: "E-commerce Ops Support",
    billingModel: "hybrid",
    setupMin: 500,
    setupMax: 900,
    monthlyMin: 900,
    monthlyMax: 1800,
  },
  managed_commerce_partner: {
    label: "Managed Commerce Partner",
    billingModel: "hybrid",
    setupMin: 1200,
    setupMax: 2200,
    monthlyMin: 1800,
    monthlyMax: 3200,
  },
};

// Phase 4 — Custom web app pricing. Audit found Phase 1 prices were
// 30–50% under market median; these match the audit's recommended ranges
// (industry MVP floor $8k, subscription SaaS $28k–$42k industry standard,
// medium client portal $40k–$80k industry — solo studio can be cheaper
// but not as cheap as the original $5k–$9k / $8k–$18k bands).
export const WEB_APP_TIER_CONFIG: Record<
  Exclude<WebAppTierKey, "custom_web_app_scope">,
  { label: string; min: number; max: number }
> = {
  small_internal_tool: {
    label: "Small Internal Tool",
    min: 8000,
    max: 15000,
  },
  portal_dashboard_mvp: {
    label: "Portal / Dashboard MVP",
    min: 15000,
    max: 30000,
  },
  saas_mvp: {
    label: "SaaS MVP / Multi-tenant",
    min: 25000,
    max: 50000,
  },
  full_client_portal: {
    // Audit's strongest pricing recommendation — the portal is
    // CrecyStudio's main differentiator and was severely underpriced.
    label: "Full Client Portal (payments + files + messaging + admin)",
    min: 22000,
    max: 45000,
  },
};

// Phase 4 — Website rescue pricing.
export const RESCUE_TIER_CONFIG: Record<
  Exclude<RescueTierKey, "custom_rescue_scope">,
  { label: string; min: number; max: number }
> = {
  basic_rescue: {
    label: "Basic Rescue",
    min: 800,
    max: 1500,
  },
  full_rescue_sprint: {
    label: "Full Rescue Sprint",
    min: 1500,
    max: 3500,
  },
};

// Phase 5 — AI integration pricing tiers.
// Bands reflect the architectural complexity: single targeted feature ($8k–$15k),
// production system with safety gates ($18k–$40k), full multi-layer architecture ($45k–$80k).
export const AI_INTAKE_TIER_CONFIG: Record<
  Exclude<AiIntakeTierKey, "custom_ai_scope">,
  { label: string; min: number; max: number }
> = {
  ai_single_integration: {
    label: "AI Feature Integration",
    min: 8000,
    max: 15000,
  },
  ai_production_system: {
    label: "AI Production System",
    min: 18000,
    max: 40000,
  },
  ai_architecture_build: {
    label: "AI Architecture Build",
    min: 45000,
    max: 80000,
  },
};

export function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export function formatRange(min: number, max: number, opts?: { monthly?: boolean }) {
  const suffix = opts?.monthly ? "/mo" : "";
  return `${money(min)} – ${money(max)}${suffix}`;
}

export function formatSetupAndMonthlyRange(input: {
  setupMin?: number;
  setupMax?: number;
  monthlyMin?: number;
  monthlyMax?: number;
}) {
  const setup =
    typeof input.setupMin === "number" && typeof input.setupMax === "number"
      ? `Setup ${formatRange(input.setupMin, input.setupMax)}`
      : "";
  const monthly =
    typeof input.monthlyMin === "number" && typeof input.monthlyMax === "number"
      ? formatRange(input.monthlyMin, input.monthlyMax, { monthly: true })
      : "";

  if (setup && monthly) return `${setup} + ${monthly}`;
  return setup || monthly || "Custom scope — strategy call required.";
}

export function targetFromBand(
  min: number,
  max: number,
  position: "low" | "middle" | "high"
) {
  if (min >= max) return min;

  const spread = max - min;
  if (position === "low") return Math.round(min + spread * 0.22);
  if (position === "high") return Math.round(min + spread * 0.82);
  return Math.round(min + spread * 0.55);
}
