import { test } from "node:test";
import assert from "node:assert/strict";
import { getPortalPricing } from "../pricing/portal";
import type { PortalPricingInput } from "../pricing/types";

// Mirrors the actual PortalIntakeClient form shape.
function baseInput(overrides: Partial<PortalPricingInput> = {}): PortalPricingInput {
  return {
    accessType: "clients",
    userCount: "under-25",
    features: ["docs"],
    integrations: [],
    compliance: [],
    budget: "15k-25k",
    budgetFlexibility: "",
    hasTechTeam: "no",
    isMultiTenant: false,
    hasWhiteLabel: false,
    hasCustomDomain: false,
    isAddOn: false,
    ...overrides,
  };
}

test("default (small + no addOn flag) → standalone_portal", () => {
  const result = getPortalPricing(baseInput());
  assert.equal(result.tierKey, "standalone_portal");
  assert.equal(result.band.min, 22000);
  assert.equal(result.lane, "client_portal");
});

test("explicit isAddOn=true with light scope → portal_add_on", () => {
  const result = getPortalPricing(baseInput({ isAddOn: true }));
  assert.equal(result.tierKey, "portal_add_on");
  assert.equal(result.tierLabel, "Portal add-on");
  assert.equal(result.band.min, 5000);
  assert.equal(result.band.max, 10000);
});

test("multi-tenant + compliance → enterprise_portal", () => {
  const result = getPortalPricing(
    baseInput({ isMultiTenant: true, compliance: ["HIPAA"] }),
  );
  assert.equal(result.tierKey, "enterprise_portal");
  assert.equal(result.band.min, 75000);
  assert.ok(result.complexityFlags.includes("Discovery sprint required"));
});

test("multi-tenant + white-label → enterprise_portal", () => {
  const result = getPortalPricing(
    baseInput({ isMultiTenant: true, hasWhiteLabel: true }),
  );
  assert.equal(result.tierKey, "enterprise_portal");
});

test("500-2000 users → enterprise (large scale)", () => {
  const result = getPortalPricing(baseInput({ userCount: "500-2000" }));
  assert.equal(result.tierKey, "enterprise_portal");
});

test("2000-plus users → enterprise (very-large scale)", () => {
  const result = getPortalPricing(baseInput({ userCount: "2000-plus" }));
  assert.equal(result.tierKey, "enterprise_portal");
});

test("100k-plus budget → enterprise", () => {
  const result = getPortalPricing(baseInput({ budget: "100k-plus" }));
  assert.equal(result.tierKey, "enterprise_portal");
});

test("50k-100k budget + multi-tenant → enterprise", () => {
  const result = getPortalPricing(
    baseInput({ budget: "50k-100k", isMultiTenant: true }),
  );
  assert.equal(result.tierKey, "enterprise_portal");
});

test("50k-100k budget alone (no multi-tenant) → standalone (large band)", () => {
  // Budget alone doesn't push to enterprise without multi-tenant
  const result = getPortalPricing(baseInput({ budget: "50k-100k" }));
  assert.equal(result.tierKey, "standalone_portal");
});

test("compliance alone (no multi-tenant) → standalone", () => {
  const result = getPortalPricing(baseInput({ compliance: ["GDPR"] }));
  assert.equal(result.tierKey, "standalone_portal");
});

test("add-on signal blocked by white-label", () => {
  // Even with isAddOn=true, white-label is a contradiction → standalone
  const result = getPortalPricing(baseInput({ isAddOn: true, hasWhiteLabel: true }));
  assert.notEqual(result.tierKey, "portal_add_on");
});

test("add-on signal blocked by too many features", () => {
  const result = getPortalPricing(
    baseInput({ isAddOn: true, features: ["docs", "status", "invoicing", "messaging", "uploads"] }),
  );
  assert.notEqual(result.tierKey, "portal_add_on");
});

test("add-on signal blocked by too many integrations", () => {
  const result = getPortalPricing(
    baseInput({ isAddOn: true, integrations: ["Stripe", "Salesforce", "Mailchimp"] }),
  );
  assert.notEqual(result.tierKey, "portal_add_on");
});

test("custom_portal_scope returned when all 4 enterprise signals max out", () => {
  const result = getPortalPricing(
    baseInput({
      isMultiTenant: true,
      hasWhiteLabel: true,
      compliance: ["HIPAA", "SOC 2"],
      integrations: ["Stripe", "Salesforce", "Mailchimp", "Slack", "Twilio"],
      budget: "100k-plus",
    }),
  );
  assert.equal(result.tierKey, "custom_portal_scope");
  assert.equal(result.tierLabel, "Custom portal scope");
  assert.equal(result.isCustomScope, true);
  assert.ok(result.complexityFlags.includes("Custom scope required"));
});

test("custom_portal_scope returned for 2000+ users with 50k-100k budget", () => {
  const result = getPortalPricing(
    baseInput({ userCount: "2000-plus", budget: "50k-100k" }),
  );
  assert.equal(result.tierKey, "custom_portal_scope");
});

test("complexity score escalates position from low → high", () => {
  const heavyResult = getPortalPricing(
    baseInput({
      isMultiTenant: true,
      compliance: ["HIPAA"],
      integrations: ["Stripe", "Salesforce", "Mailchimp", "Slack"],
      hasWhiteLabel: true,
      features: ["docs", "status", "invoicing", "messaging", "uploads", "forms"],
    }),
  );
  assert.equal(heavyResult.position, "high");

  const lightResult = getPortalPricing(baseInput({ isAddOn: true }));
  assert.equal(lightResult.position, "low");
});

test("tier labels match the /client-portals landing page exactly", () => {
  // service-pages.ts:1232-1255 advertises:
  // "Portal add-on" / "Standalone portal" / "Enterprise build".
  // A regression here would make the quote disagree with marketing copy.
  assert.equal(getPortalPricing(baseInput({ isAddOn: true })).tierLabel, "Portal add-on");
  assert.equal(getPortalPricing(baseInput()).tierLabel, "Standalone portal");
  assert.equal(
    getPortalPricing(baseInput({ isMultiTenant: true, compliance: ["HIPAA"] })).tierLabel,
    "Enterprise build",
  );
});

test("displayRange + summary populate for every tier", () => {
  for (const setup of [
    baseInput({ isAddOn: true }),
    baseInput(),
    baseInput({ isMultiTenant: true, compliance: ["HIPAA"] }),
  ]) {
    const r = getPortalPricing(setup);
    assert.match(r.displayRange, /\$/);
    assert.ok(r.summary.length > 0);
    assert.ok(r.estimatorSummary.includes("Estimated investment"));
  }
});

test("integration count drives complexity score", () => {
  const heavy = getPortalPricing(
    baseInput({ integrations: ["A", "B", "C", "D", "E"] }),
  );
  const light = getPortalPricing(baseInput({ integrations: ["A"] }));
  assert.ok(heavy.complexityScore > light.complexityScore);
});

test("tech team availability adds 'supporting' reason", () => {
  const r = getPortalPricing(baseInput({ hasTechTeam: "yes" }));
  const supportingReasons = r.reasons.filter((reason) => reason.impact === "supporting");
  assert.ok(supportingReasons.some((reason) => reason.label.includes("tech team")));
});
