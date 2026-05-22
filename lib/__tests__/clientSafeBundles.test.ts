import "./_envSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeClientSafeOpsBundle, type EnrichedOpsWorkspaceBundle } from "../opsWorkspace/state";
import { makeClientSafeEcommerceBundle, type EcommerceWorkspaceBundle } from "../ecommerce/workspace";

// These tests pin the contract that customer-facing portals MUST NOT
// receive proposal-style content (diagnosis, implementation plan,
// SOPs, KPIs, internal pricing reasoning, etc.) via the bundle JSON.
// The proposal is delivered as a PDF; the portal carries only status,
// progress, and the narrow set of fields the client component
// actually renders.
//
// If you're here because you added a field to a bundle and a test
// failed, the bundle is doing its job — decide whether the new field
// is customer-safe and add it to the whitelist/blocklist accordingly.
// Don't disable the test.

function makeOpsFixture(): EnrichedOpsWorkspaceBundle {
  return {
    intake: {
      id: "intake-1",
      companyName: "Acme Co",
      contactName: "Jane",
      email: "jane@acme.co",
      industry: "manufacturing",
      teamSize: "10-50",
      createdAt: "2026-01-01T00:00:00Z",
      painPoints: ["slow onboarding"],
      workflowsNeeded: [],
      currentTools: [],
      urgency: "soon",
      readiness: "ready",
      monthlyRevenue: "",
      budgetRange: "",
      jobVolume: "",
      triedBefore: "",
      recommendationTier: "growth",
      recommendationPriceRange: "$2k-$5k",
      notes: "ADMIN-ONLY: client seemed cautious about pricing",
    },
    ghostAdmin: {
      bestTool: "Make",
      bestFirstFix: "automate intake",
      mainBottleneck: "manual data entry",
      businessObjective: "scale ops",
      starterPrompts: ["ADMIN HINT: ask about budget"],
    },
    workspace: {
      phase: "planning",
      waitingOn: "",
      adminPublicNote: "Welcome — we'll kick off next week.",
      internalDiagnosisNote: "ADMIN-ONLY: complex tech stack, watch scope",
      adminNotes: { stage1: "ADMIN-ONLY note" },
      chatMessages: [{ role: "admin", content: "ADMIN scratch" }],
      automationBacklog: [],
      liveAutomations: [],
      currentProcess: [],
      futureProcess: [],
      approvals: [],
      nextActions: [],
      depositStatus: "pending",
      depositAmount: null,
      depositUrl: "",
      depositSessionId: "",
      depositPaidAt: "",
      depositNotice: "",
      agreementStatus: "",
      agreementAcceptedAt: "",
      pipelineStatus: "intake",
    } as unknown as EnrichedOpsWorkspaceBundle["workspace"],
    pie: {
      exists: true,
      id: "pie-1",
      status: "completed",
      summary: "ADMIN-PERSPECTIVE writeup of strategy",
      confidence: "high",
      recommendedOffer: {
        primaryPackage: "Growth Build",
        projectRange: "$8k-$12k",
        retainerRange: "$1k-$2k/mo",
        why: "ADMIN-ONLY rationale for the offer",
      },
      diagnosis: [{ problem: "X", impact: "Y", evidence: "Z", priority: "high" }],
      quickWins: [{ title: "Q", why: "W", steps: [], owner: "studio", eta: "1wk" }],
      implementationPlan: [{ phase: "1", goal: "G", deliverables: [], automations: [], techStack: [], dataFields: [], acceptanceCriteria: [], estimateDays: "5" }],
      sops: [{ workflow: "W", trigger: "T", steps: [], exceptions: [], metrics: [] }],
      kpis: [{ name: "K", target: "T", why: "W" }],
      clientQuestions: ["What's your monthly volume?"],
      risks: [{ risk: "R", mitigation: "M" }],
      nextActions: ["ADMIN: send the proposal"],
    } as EnrichedOpsWorkspaceBundle["pie"],
    callRequest: { exists: false } as EnrichedOpsWorkspaceBundle["callRequest"],
  } as unknown as EnrichedOpsWorkspaceBundle;
}

test("ops client-safe bundle strips proposal content + admin fields", () => {
  const safe = makeClientSafeOpsBundle(makeOpsFixture(), { isAdmin: false });

  // Proposal content — must NOT appear on the customer wire payload.
  assert.equal("diagnosis" in safe.pie, false, "pie.diagnosis must be stripped");
  assert.equal("quickWins" in safe.pie, false, "pie.quickWins must be stripped");
  assert.equal("implementationPlan" in safe.pie, false, "pie.implementationPlan must be stripped");
  assert.equal("sops" in safe.pie, false, "pie.sops must be stripped");
  assert.equal("kpis" in safe.pie, false, "pie.kpis must be stripped");
  assert.equal("risks" in safe.pie, false, "pie.risks must be stripped");
  assert.equal("nextActions" in safe.pie, false, "pie.nextActions must be stripped");
  assert.equal("summary" in safe.pie, false, "pie.summary must be stripped");
  assert.equal("confidence" in safe.pie, false, "pie.confidence must be stripped");
  assert.equal("id" in safe.pie, false, "pie.id must be stripped");
  assert.equal("status" in safe.pie, false, "pie.status must be stripped");
  assert.equal("why" in (safe.pie.recommendedOffer ?? {}), false, "recommendedOffer.why must be stripped");

  // Admin fields — must NOT appear.
  assert.equal("internalDiagnosisNote" in safe.workspace, false);
  assert.equal("adminNotes" in safe.workspace, false);
  assert.equal("chatMessages" in safe.workspace, false);
  assert.equal("starterPrompts" in safe.ghostAdmin, false);
  assert.equal("notes" in safe.intake, false);

  // Customer-visible fields the client component renders — MUST stay.
  assert.equal(safe.pie.exists, true);
  assert.deepEqual(safe.pie.clientQuestions, ["What's your monthly volume?"]);
  assert.equal(safe.pie.recommendedOffer?.primaryPackage, "Growth Build");
  assert.equal(safe.pie.recommendedOffer?.projectRange, "$8k-$12k");
  assert.equal(safe.pie.recommendedOffer?.retainerRange, "$1k-$2k/mo");
  assert.equal(safe.workspace.adminPublicNote, "Welcome — we'll kick off next week.");
  assert.equal(safe.intake.companyName, "Acme Co");
  assert.equal(safe.ghostAdmin.bestTool, "Make");
});

test("ops bundle: admin caller gets the full unstripped bundle", () => {
  const full = makeClientSafeOpsBundle(makeOpsFixture(), { isAdmin: true });
  assert.ok(full.pie.diagnosis, "admin must see pie.diagnosis");
  assert.ok(full.workspace.internalDiagnosisNote, "admin must see internalDiagnosisNote");
  assert.ok(full.intake.notes, "admin must see intake.notes");
  assert.ok(full.ghostAdmin.starterPrompts, "admin must see starterPrompts");
});

function makeEcomFixture(): EcommerceWorkspaceBundle {
  return {
    intake: {
      id: "ecom-1",
      created_at: "2026-01-01T00:00:00Z",
      business_name: "Shop",
      contact_name: "Sam",
      email: "sam@shop.co",
      store_url: "https://shop.co",
      monthly_orders: "100-500",
      sales_channels: ["Shopify"],
      budget_range: "$5k-$10k",
      timeline: "2 months",
      // FIELDS BELOW MUST NOT appear in customer bundle —
      auth_user_id: "user-uuid",
      owner_email_norm: "sam@shop.co",
      admin_internal_note: "ADMIN-ONLY note",
      future_admin_only_column: "leaks if not whitelisted",
    },
    quote: {
      id: "quote-1",
      status: "draft",
      quote_json: { deposit: { amount: 5000, paid_at: null } },
      estimate_setup_fee: 5000,
      ecom_intake_id: "ecom-1",
    },
    call: null,
    recommendation: {
      version: "v1",
      lane: "ecommerce",
      tierKey: "growth_store_build",
      tierLabel: "Growth Store Build",
      position: "middle",
      isCustomScope: false,
      band: { min: 8000, max: 12000, target: 10000 },
      displayRange: "$8k-$12k",
      publicMessage: "Public-safe message",
      summary: "Customer-visible summary",
      // INTERNAL pricing reasoning — must NEVER reach the customer:
      estimatorSummary: "ADMIN-ONLY estimator notes",
      reasons: [{ label: "ADMIN flag", note: "ADMIN-ONLY", impact: "fit" }],
      complexityFlags: ["high_volume", "custom_platform"],
      complexityScore: 7,
    },
    workspace: {
      mode: "build",
      phase: "planning",
      waitingOn: "",
      adminPublicNote: "Welcome",
      internalNotes: "ADMIN-ONLY notes",
      serviceSummary: "",
      onboardingSummary: "",
      previewUrl: "",
      productionUrl: "",
      agreementStatus: "",
      agreementText: "",
      agreementAcceptedAt: "",
      depositStatus: "pending",
      depositAmount: null,
      depositUrl: "",
      depositSessionId: "",
      depositPaidAt: "",
      depositNotice: "",
      depositNoticeSentAt: "",
      deliverables: [],
      milestones: [],
      approvals: [],
      assetsNeeded: [],
      requests: [],
      issues: [],
      tasks: [],
      metrics: [],
      nextActions: [],
      monthlyPlan: [],
      lastSavedAt: "",
      lastSavedBy: "system",
    },
    isAdmin: false,
  };
}

test("ecom client-safe bundle narrows intake + quote and strips recommendation", () => {
  const safe = makeClientSafeEcommerceBundle(makeEcomFixture(), { isAdmin: false });

  // intake — only the whitelisted fields should appear.
  const intakeKeys = Object.keys(safe.intake).sort();
  assert.deepEqual(intakeKeys, [
    "budget_range",
    "business_name",
    "contact_name",
    "created_at",
    "email",
    "id",
    "monthly_orders",
    "sales_channels",
    "store_url",
    "timeline",
  ], "intake must be narrowed to the whitelist");

  // quote — only `status` should remain.
  assert.deepEqual(Object.keys(safe.quote ?? {}), ["status"], "quote must be narrowed to { status }");

  // recommendation — must NOT be present on the customer bundle. The
  // TS type still claims it exists, but the runtime delete strips it.
  assert.equal("recommendation" in safe, false, "recommendation must be deleted at runtime");

  // workspace — internalNotes must be stripped.
  assert.equal("internalNotes" in safe.workspace, false);
  assert.equal(safe.workspace.adminPublicNote, "Welcome");
});

test("ecom bundle: admin caller gets the full unstripped bundle", () => {
  const full = makeClientSafeEcommerceBundle(makeEcomFixture(), { isAdmin: true });
  assert.ok(full.recommendation, "admin must see recommendation");
  assert.ok((full.recommendation as { reasons: unknown[] }).reasons, "admin must see recommendation.reasons");
  assert.ok((full.intake as { auth_user_id: string }).auth_user_id, "admin must see intake.auth_user_id");
  assert.ok(full.workspace.internalNotes !== undefined, "admin must see internalNotes");
});
