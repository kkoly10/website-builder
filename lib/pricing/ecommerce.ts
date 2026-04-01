import {
  ECOMMERCE_TIER_CONFIG,
  PRICING_MESSAGES,
  PRICING_VERSION,
  formatRange,
  formatSetupAndMonthlyRange,
  targetFromBand,
} from "@/lib/pricing/config";
import type {
  EcommercePricingInput,
  EcommerceTierKey,
  PricingReason,
  PricingResult,
} from "@/lib/pricing/types";

function choosePosition(score: number): "low" | "middle" | "high" {
  if (score >= 5) return "high";
  if (score >= 2) return "middle";
  return "low";
}

function parseApproxNumber(value: string) {
  const matches = String(value || "").match(/\d+/g);
  if (!matches?.length) return 0;
  const nums = matches.map((item) => Number(item)).filter(Number.isFinite);
  if (!nums.length) return 0;
  if (String(value).includes("+")) return nums[0];
  if (nums.length === 1) return nums[0];
  return Math.max(...nums);
}

function isUrgent(timeline: string) {
  return /asap|urgent|this week|immediately/i.test(String(timeline || ""));
}

function detectMode(input: EcommercePricingInput): "build" | "run" | "fix" {
  if (input.entryPath) return input.entryPath;
  const services = input.serviceTypes.map((item) => item.toLowerCase());
  if (services.some((item) => /build|design|setup/.test(item))) return "build";
  if (services.some((item) => /fix|audit|optimiz|overhaul|abandonment/.test(item))) return "fix";
  return "run";
}

export function getEcommercePricing(
  input: EcommercePricingInput
): PricingResult<EcommerceTierKey> {
  const reasons: PricingReason[] = [];
  const flags: string[] = [];
  let complexityScore = 0;

  const mode = detectMode(input);
  const channelCount = input.salesChannels.length;
  const serviceCount = input.serviceTypes.length;
  const skuCount = parseApproxNumber(input.skuCount);
  const monthlyOrders = parseApproxNumber(input.monthlyOrders);
  const peakOrders = parseApproxNumber(input.peakOrders);
  const urgent = isUrgent(input.timeline);
  const hasMarketplace = input.salesChannels.some((item) =>
    /amazon|etsy|ebay|walmart/i.test(item)
  );
  const hasExistingStore = !!String(input.storeUrl || "").trim();
  const customPlatform = /custom/i.test(String(input.platform || ""));
  const noPlatformYet = /don't have one yet/i.test(String(input.platform || ""));

  if (serviceCount >= 4) {
    complexityScore += 2;
    flags.push("Several service needs");
    reasons.push({
      label: "Multi-part scope",
      note: "More requested service types usually means more coordination, QA, and delivery depth.",
      impact: "upward",
    });
  }

  if (channelCount >= 3) {
    complexityScore += 2;
    flags.push("Multi-channel store");
    reasons.push({
      label: "Multiple sales channels",
      note: "Each additional sales channel adds configuration, consistency, and operations overhead.",
      impact: "upward",
    });
  }

  if (skuCount >= 100) {
    complexityScore += 2;
    flags.push("Large catalog");
    reasons.push({
      label: "Large product catalog",
      note: "Larger product counts usually increase content loading, QA, and maintenance effort.",
      impact: "upward",
    });
  }

  if (monthlyOrders >= 250 || peakOrders >= 500) {
    complexityScore += 2;
    flags.push("Higher order volume");
    reasons.push({
      label: "Operational order volume",
      note: "Higher order volume increases the complexity of managed service, reporting, and issue handling.",
      impact: "upward",
    });
  }

  if (hasMarketplace) {
    complexityScore += 1;
    flags.push("Marketplace operations");
  }

  if (urgent) {
    complexityScore += 1;
    flags.push("Urgent timeline");
    reasons.push({
      label: "Urgency",
      note: "Fast delivery windows reduce discovery time and increase coordination pressure.",
      impact: "upward",
    });
  }

  if (customPlatform) {
    complexityScore += 2;
    flags.push("Custom platform");
  }

  if (mode === "build") {
    if (!hasExistingStore && noPlatformYet) {
      reasons.push({
        label: "Net-new store build",
        note: "A new store build needs platform setup, information architecture, product setup, and launch readiness.",
        impact: "supporting",
      });
    }

    const isCustom =
      skuCount > 300 ||
      channelCount >= 4 ||
      customPlatform ||
      (urgent && serviceCount >= 4);

    if (isCustom) {
      reasons.unshift({
        label: "Custom build threshold reached",
        note: "This store build should be scoped on a call because platform, catalog, or delivery complexity is above the instant-range tier.",
        impact: "custom",
      });

      return {
        version: PRICING_VERSION,
        lane: "ecommerce",
        tierKey: "custom_ecommerce_scope",
        tierLabel: "Custom E-commerce Scope",
        position: "custom",
        isCustomScope: true,
        band: { min: 5200, max: 5200, target: 5200 },
        billingModel: "project",
        displayRange: PRICING_MESSAGES.ecommerceCustom,
        publicMessage: PRICING_MESSAGES.ecommerceCustom,
        summary: "This e-commerce scope needs manual review before final pricing.",
        estimatorSummary: "Custom e-commerce build triggered by scale, channel count, or platform complexity.",
        reasons,
        complexityFlags: flags,
        complexityScore: Math.max(complexityScore, 7),
      };
    }

    const tierKey =
      skuCount <= 50 && channelCount <= 2 && serviceCount <= 3 && !urgent
        ? "store_launch_build"
        : "growth_store_build";

    const band = ECOMMERCE_TIER_CONFIG[tierKey];
    const position = choosePosition(complexityScore);
    const target = targetFromBand(band.projectMin!, band.projectMax!, position);

    if (!reasons.length) {
      reasons.push({
        label: "Store build fit",
        note: "This request fits a standard e-commerce build engagement.",
        impact: "fit",
      });
    }

    return {
      version: PRICING_VERSION,
      lane: "ecommerce",
      tierKey,
      tierLabel: band.label,
      position,
      isCustomScope: false,
      billingModel: "project",
      band: { min: band.projectMin!, max: band.projectMax!, target },
      displayRange: formatRange(band.projectMin!, band.projectMax!),
      publicMessage: formatRange(band.projectMin!, band.projectMax!),
      summary: `This request fits the ${band.label} range based on catalog size, channels, timeline, and build depth.`,
      estimatorSummary: `${band.label} selected at a ${position} position inside the project band.`,
      reasons,
      complexityFlags: flags,
      complexityScore,
    };
  }

  if (mode === "fix") {
    const issueHeavy = serviceCount >= 4 || channelCount >= 3 || monthlyOrders >= 500;
    const isCustom = issueHeavy && (customPlatform || skuCount >= 400 || monthlyOrders >= 1500);

    if (isCustom) {
      reasons.unshift({
        label: "Custom repair threshold reached",
        note: "The current store issues are broad enough that they should be scoped manually before quoting.",
        impact: "custom",
      });

      return {
        version: PRICING_VERSION,
        lane: "ecommerce",
        tierKey: "custom_ecommerce_scope",
        tierLabel: "Custom E-commerce Scope",
        position: "custom",
        isCustomScope: true,
        band: { min: 4200, max: 4200, target: 4200 },
        billingModel: "project",
        displayRange: PRICING_MESSAGES.ecommerceCustom,
        publicMessage: PRICING_MESSAGES.ecommerceCustom,
        summary: "This repair request needs manual scoping before final pricing.",
        estimatorSummary: "Custom e-commerce repair triggered by issue spread, order volume, or platform complexity.",
        reasons,
        complexityFlags: flags,
        complexityScore: Math.max(complexityScore, 7),
      };
    }

    const tierKey = issueHeavy ? "commerce_growth_repair" : "commerce_repair_sprint";
    const band = ECOMMERCE_TIER_CONFIG[tierKey];
    const position = choosePosition(complexityScore);
    const target = targetFromBand(band.projectMin!, band.projectMax!, position);

    reasons.unshift({
      label: "Store optimization / repair scope",
      note: "This pricing is shaped by the number of issues, scale of the store, and how risky the fixes appear.",
      impact: "fit",
    });

    return {
      version: PRICING_VERSION,
      lane: "ecommerce",
      tierKey,
      tierLabel: band.label,
      position,
      isCustomScope: false,
      billingModel: "project",
      band: { min: band.projectMin!, max: band.projectMax!, target },
      displayRange: formatRange(band.projectMin!, band.projectMax!),
      publicMessage: formatRange(band.projectMin!, band.projectMax!),
      summary: `This request fits the ${band.label} range based on issue depth, channel spread, and store complexity.`,
      estimatorSummary: `${band.label} selected at a ${position} price position inside the project band.`,
      reasons,
      complexityFlags: flags,
      complexityScore,
    };
  }

  const isCustom =
    monthlyOrders > 2000 ||
    channelCount >= 5 ||
    serviceCount >= 5 ||
    customPlatform;

  if (isCustom) {
    reasons.unshift({
      label: "Custom managed-ops threshold reached",
      note: "This managed e-commerce request should be scoped manually because volume or operational spread is above the instant-range model.",
      impact: "custom",
    });

    return {
      version: PRICING_VERSION,
      lane: "ecommerce",
      tierKey: "custom_ecommerce_scope",
      tierLabel: "Custom E-commerce Scope",
      position: "custom",
      isCustomScope: true,
      band: { min: 3200, max: 3200, target: 3200 },
      setupBand: { min: 2200, max: 2200, target: 2200 },
      monthlyBand: { min: 3200, max: 3200, target: 3200 },
      billingModel: "hybrid",
      displayRange: PRICING_MESSAGES.ecommerceCustom,
      publicMessage: PRICING_MESSAGES.ecommerceCustom,
      summary: "This managed-commerce request needs manual scoping before final pricing.",
      estimatorSummary: "Custom managed-commerce scope triggered by channel spread, volume, or complexity.",
      reasons,
      complexityFlags: flags,
      complexityScore: Math.max(complexityScore, 7),
    };
  }

  const tierKey =
    monthlyOrders <= 200 && channelCount <= 2 && serviceCount <= 3
      ? "ecommerce_ops_support"
      : "managed_commerce_partner";

  const band = ECOMMERCE_TIER_CONFIG[tierKey];
  const position = choosePosition(complexityScore);
  const setupBand = {
    min: band.setupMin!,
    max: band.setupMax!,
    target: targetFromBand(band.setupMin!, band.setupMax!, position),
  };
  const monthlyBand = {
    min: band.monthlyMin!,
    max: band.monthlyMax!,
    target: targetFromBand(band.monthlyMin!, band.monthlyMax!, position),
  };

  reasons.unshift({
    label: "Managed operations scope",
    note: "This range is driven by channel coverage, order volume, and how much hands-on store management is needed.",
    impact: "fit",
  });

  return {
    version: PRICING_VERSION,
    lane: "ecommerce",
    tierKey,
    tierLabel: band.label,
    position,
    isCustomScope: false,
    band: monthlyBand,
    setupBand,
    monthlyBand,
    billingModel: "hybrid",
    displayRange: formatSetupAndMonthlyRange({
      setupMin: band.setupMin,
      setupMax: band.setupMax,
      monthlyMin: band.monthlyMin,
      monthlyMax: band.monthlyMax,
    }),
    publicMessage: formatSetupAndMonthlyRange({
      setupMin: band.setupMin,
      setupMax: band.setupMax,
      monthlyMin: band.monthlyMin,
      monthlyMax: band.monthlyMax,
    }),
    summary: `This request fits the ${band.label} range based on store volume, channel count, and the amount of ongoing operational support required.`,
    estimatorSummary: `${band.label} selected at a ${position} position inside the setup and monthly bands.`,
    reasons,
    complexityFlags: flags,
    complexityScore,
  };
}
