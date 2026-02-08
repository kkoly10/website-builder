export type MockProject = {
  id: string;
  clientName: string;
  status: "new" | "in_progress" | "review" | "completed";
  total: number;
  paid: number;
  remaining: number;
  pages: string;
  features: string[];
  milestones: { label: string; percent: number; paid: boolean }[];
  references: { label: string; url: string }[];
  revisions: { phase: "50%" | "90%"; included: number; used: number }[];
};

export function getMockProject(): MockProject {
  return {
    id: "mock-001",
    clientName: "Sample Client",
    status: "in_progress",
    total: 600,
    paid: 300,
    remaining: 300,
    pages: "4–5",
    features: ["Contact form", "Booking form"],
    milestones: [
      { label: "Deposit", percent: 10, paid: true },
      { label: "50% completion", percent: 50, paid: true },
      { label: "90% completion", percent: 90, paid: false },
      { label: "Launch", percent: 100, paid: false },
    ],
    references: [
      { label: "Reference website", url: "https://example.com" },
    ],
    revisions: [
      { phase: "50%", included: 1, used: 0 },
      { phase: "90%", included: 1, used: 0 },
    ],
  };
}