import { test } from "node:test";
import assert from "node:assert/strict";
import { getPortalPricing } from "../pricing/portal";
import type { PortalPricingInput } from "../pricing/types";

function baseInput(overrides: Partial<PortalPricingInput> = {}): PortalPricingInput {
  return {
    accessType: "clients",
    userCount: "1-10",
    featureCount: 2,
    integrationCount: 0,
    isMultiTenant: false,
    hasCompliance: false,
    budget: "5k_10k",
    techTeam: "none",
    isAddOn: true,
    hasWhiteLabel: false,
    hasCustomDomain: false,
    ...overrides,
  };
}

test("lowest-scope, isAddOn=true → portal_add_on tier", () => {
  const result = getPortalPricing(baseInput());
  assert.equal(result.tierKey, "portal_add_on");
  assert.equal(result.tierLabel, "Portal add-on");
  assert.equal(result.band.min, 5000);
  assert.equal(result.band.max, 10000);
  assert.equal(result.lane, "client_portal");
});

test("not isAddOn → standalone_portal even at low scope", () => {
  const result = getPortalPricing(baseInput({ isAddOn: false }));
  assert.equal(result.tierKey, "standalone_portal");
  assert.equal(result.band.min, 22000);
});

test("multi-tenant + compliance → enterprise_portal", () => {
  const result = getPortalPricing(
    baseInput({ isMultiTenant: true, hasCompliance: true, isAddOn: false }),
  );
  assert.equal(result.tierKey, "enterprise_portal");
  assert.equal(result.band.min, 75000);
  assert.ok(result.complexityFlags.includes("Discovery sprint required"));
});

test("white-label + multi-tenant → enterprise_portal", () => {
  const result = getPortalPricing(
    baseInput({ isMultiTenant: true, hasWhiteLabel: true, isAddOn: false }),
  );
  assert.equal(result.tierKey, "enterprise_portal");
});

test("200+ users → enterprise regardless of other signals", () => {
  const result = getPortalPricing(
    baseInput({ userCount: "200+", isAddOn: false }),
  );
  assert.equal(result.tierKey, "enterprise_portal");
});

test("100k+ budget → enterprise", () => {
  const result = getPortalPricing(
    baseInput({ budget: "100k_plus", isAddOn: false }),
  );
  assert.equal(result.tierKey, "enterprise_portal");
});

test("add-on signal blocked by white-label requirement", () => {
  // Even with isAddOn=true, white-label is a contradiction → standalone
  const result = getPortalPricing(baseInput({ hasWhiteLabel: true }));
  // No multi-tenant so not enterprise; falls to standalone
  assert.equal(result.tierKey, "standalone_portal");
});

test("add-on signal blocked by too many features", () => {
  const result = getPortalPricing(baseInput({ featureCount: 6 }));
  assert.equal(result.tierKey, "standalone_portal");
});

test("add-on signal blocked by too many integrations", () => {
  const result = getPortalPricing(baseInput({ integrationCount: 4 }));
  assert.equal(result.tierKey, "standalone_portal");
});

test("compliance alone (no multi-tenant) → standalone, not enterprise", () => {
  const result = getPortalPricing(
    baseInput({ hasCompliance: true, isAddOn: false }),
  );
  assert.equal(result.tierKey, "standalone_portal");
});

test("complexity score escalates position from low → high", () => {
  const heavyResult = getPortalPricing(
    baseInput({
      isMultiTenant: true,
      hasCompliance: true,
      integrationCount: 4,
      hasWhiteLabel: true,
      featureCount: 8,
      isAddOn: false,
    }),
  );
  assert.equal(heavyResult.tierKey, "enterprise_portal");
  assert.equal(heavyResult.position, "high");

  const lightResult = getPortalPricing(baseInput());
  assert.equal(lightResult.position, "low");
});

test("displayRange + summary populate", () => {
  const result = getPortalPricing(baseInput());
  assert.match(result.displayRange, /\$/);
  assert.ok(result.summary.includes("Portal add-on"));
  assert.ok(result.estimatorSummary.includes("Estimated investment"));
});

test("tier labels match the /client-portals landing page", () => {
  // The landing page at lib/service-pages.ts:1232-1255 advertises
  // "Portal add-on" / "Standalone portal" / "Enterprise build".
  // The pricing engine MUST return these exact labels.
  assert.equal(getPortalPricing(baseInput()).tierLabel, "Portal add-on");
  assert.equal(
    getPortalPricing(baseInput({ isAddOn: false })).tierLabel,
    "Standalone portal",
  );
  assert.equal(
    getPortalPricing(baseInput({ isMultiTenant: true, hasCompliance: true, isAddOn: false }))
      .tierLabel,
    "Enterprise build",
  );
});
