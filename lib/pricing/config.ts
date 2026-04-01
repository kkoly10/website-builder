import type { EcommerceTierKey, OpsTierKey, WebsiteTierKey } from "@/lib/pricing/types";

export const PRICING_VERSION = "startup-v2-2026-04";

export const PRICING_MESSAGES = {
  depositPolicy: "50% deposit to start, 50% on completion.",
  websiteCustom: "Custom scope — strategy call required.",
  opsCustom: "Custom ops scope — strategy call required.",
  ecommerceCustom: "Custom e-commerce scope — strategy call required.",
};

export const WEBSITE_TIER_CONFIG: Record<
  Exclude<WebsiteTierKey, "custom_scope">,
  { label: string; min: number; max: number }
> = {
  starter_site: {
    label: "Starter Site",
    min: 1500,
    max: 2200,
  },
  growth_site: {
    label: "Growth Site",
    min: 2300,
    max: 3400,
  },
  premium_build: {
    label: "Premium Build",
    min: 3500,
    max: 5200,
  },
};

export const OPS_TIER_CONFIG: Record<
  Exclude<OpsTierKey, "custom_ops_scope">,
  { label: string; min: number; max: number; monthly?: boolean }
> = {
  quick_workflow_fix: {
    label: "Quick Workflow Fix",
    min: 1000,
    max: 1800,
  },
  ops_system_build: {
    label: "Ops System Build",
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
    label: "Growth Store Build",
    billingModel: "project",
    projectMin: 3200,
    projectMax: 5200,
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
