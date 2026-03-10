import type { OpsTierKey, WebsiteTierKey } from "@/lib/pricing/types";

export const PRICING_VERSION = "startup-v1-2026-03";

export const PRICING_MESSAGES = {
  depositPolicy: "50% deposit to start, 50% on completion.",
  websiteCustom: "Custom scope — strategy call required.",
  opsCustom: "Custom ops scope — strategy call required.",
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

export function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export function formatRange(min: number, max: number, opts?: { monthly?: boolean }) {
  const suffix = opts?.monthly ? "/mo" : "";
  return `${money(min)} – ${money(max)}${suffix}`;
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