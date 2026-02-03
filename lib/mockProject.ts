import { Project } from "./projectTypes";

export function getMockProject(): Project {
  return {
    id: "proj_demo_001",
    clientName: "Client",
    projectName: "Business Website Build",
    websiteType: "Business website",
    platform: "Wix",
    startDateLabel: "Feb 2, 2026",
    estimatedLaunchLabel: "1–3 weeks",
    status: "in_progress",

    milestones: [
      { key: "deposit_received", title: "Deposit Received" },
      { key: "design_in_progress", title: "Design in Progress" },
      { key: "design_review", title: "Design Review (Revision 1)" },
      { key: "final_build", title: "Final Build" },
      { key: "launch", title: "Launch" },
    ],
    activeMilestoneKey: "design_in_progress",

    payment: {
      totalPrice: 450,
      amountPaid: 100,
      nextPaymentDueLabel: "At design approval",
    },

    revisions: {
      included: 2,
      used: 0,
    },

    references: {
      referenceUrl: "https://example.com",
      clientNotes:
        "Client wants a similar layout to the reference site. 4 pages and a contact form.",
      internalNotes:
        "Keep copy simple, mobile-first. Confirm images/logo availability early.",
    },
  };
}