import { getEcommercePricing } from "@/lib/pricing";
import type { EcommercePricingInput, PricingResult } from "@/lib/pricing";

export type EcommerceRecommendation = PricingResult<string>;

function str(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function detectEcommerceModeFromIntake(intake: any): "build" | "run" | "fix" {
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
    entryPath: detectEcommerceModeFromIntake(intake),
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

export function getEcommerceRecommendationForIntake(intake: any): EcommerceRecommendation {
  const recommendationJson = intake?.recommendation_json;
  if (recommendationJson && typeof recommendationJson === "object") {
    return recommendationJson as EcommerceRecommendation;
  }
  return getEcommercePricing(buildEcommercePricingInputFromIntake(intake));
}

export function getRecommendedEcommerceQuoteDefaults(recommendation: EcommerceRecommendation) {
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
