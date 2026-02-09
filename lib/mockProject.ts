import type { Project } from "./projectTypes";

/**
 * Mock data used ONLY for the /dashboard demo page.
 * Must match Project type exactly.
 */
export function getMockProject(): Project {
  return {
    id: "mock-001",
    clientName: "Sample Client",
    projectName: "Sample Client Website",
    websiteType: "Business website",
    platform: "Custom",
    startDateLabel: "Feb 8, 2026",
    estimatedLaunchLabel: "2–3 weeks",
    status: "in_progress",

    milestones: [
      { key: "deposit_received", title: "Deposit received" },
      { key: "design_in_progress", title: "Design in progress" },
      { key: "design_review", title: "Design review" },
      { key: "final_build", title: "Final build" },
      { key: "launch", title: "Launch" },
    ],
    activeMilestoneKey: "design_in_progress",

    payment: {
      totalPrice: 600,
      amountPaid: 300,
      nextPaymentDueLabel: "At design approval",
    },

    revisions: {
      included: 2,
      used: 0,
    },

    references: {
      referenceUrl: "https://example.com",
      clientNotes: "Client provided logo and some content.",
      internalNotes: "Focus on booking flow + mobile speed.",
    },
  };
}
