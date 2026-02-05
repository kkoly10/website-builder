export type ProjectInput = {
  pages: "1" | "2-3" | "4-5" | "6-10";
  booking: "none" | "external" | "builtin" | "unsure";
  payments: "none" | "link" | "system" | "unsure";
  automation: "none" | "basic" | "advanced" | "unsure";
  integrations: "none" | "1-2" | "3+";
  content: "ready" | "partial" | "not-ready";
  stakeholders: "1" | "2-3" | "4+";
  timeline: "4+ weeks" | "2-3 weeks" | "under-14";
};

export type Tier = "Standard" | "Professional" | "Advanced";

export type PIEReport = {
  score: number;
  tier: Tier;
  confidence: "High" | "Medium" | "Low";
  summary: string;
  pricing: {
    target: number;
    minimum: number;
    buffers: string[];
  };
  risks: string[];
  pitch: {
    recommend: string;
    emphasize: string[];
    objections: string[];
  };
};

export function evaluatePIE(input: ProjectInput): PIEReport {
  let score = 0;
  const risks: string[] = [];
  const buffers: string[] = [];
  let systemCount = 0;

  // Pages
  if (input.pages === "1") score += 5;
  if (input.pages === "2-3") score += 10;
  if (input.pages === "4-5") score += 18;
  if (input.pages === "6-10") score += 30;

  // Booking
  if (input.booking === "external") score += 10;
  if (input.booking === "builtin") { score += 25; systemCount++; }
  if (input.booking === "unsure") { score += 7; buffers.push("Booking scope not finalized"); risks.push("Booking uncertainty"); }

  // Payments
  if (input.payments === "link") score += 12;
  if (input.payments === "system") { score += 28; systemCount++; }
  if (input.payments === "unsure") { score += 7; buffers.push("Payment scope not finalized"); risks.push("Payment uncertainty"); }

  // Automation
  if (input.automation === "basic") score += 10;
  if (input.automation === "advanced") { score += 22; systemCount++; }
  if (input.automation === "unsure") { score += 7; buffers.push("Automation requirements unclear"); risks.push("Automation uncertainty"); }

  // Integrations
  if (input.integrations === "1-2") score += 10;
  if (input.integrations === "3+") score += 18;

  // Content
  if (input.content === "partial") score += 8;
  if (input.content === "not-ready") { score += 15; risks.push("Content not ready"); }

  // Stakeholders
  if (input.stakeholders === "2-3") score += 6;
  if (input.stakeholders === "4+") { score += 12; risks.push("Multiple stakeholders"); }

  // Timeline
  if (input.timeline === "2-3 weeks") score += 8;
  if (input.timeline === "under-14") { score += 15; risks.push("Rush timeline"); }

  // Tier determination (stacked-only for Advanced)
  let tier: Tier = "Standard";
  if (score >= 46) tier = "Professional";
  if (score >= 66 && systemCount >= 2) tier = "Advanced";

  // Confidence
  let confidence: "High" | "Medium" | "Low" = "High";
  if (
    (tier === "Standard" && score >= 41) ||
    (tier === "Professional" && (score <= 51 || score >= 60)) ||
    (tier === "Advanced" && score <= 71)
  ) confidence = "Medium";

  // Pricing
  let target = 550, minimum = 450;
  if (tier === "Professional") { target = 900; minimum = 700; }
  if (tier === "Advanced") { target = 1500; minimum = 1200; }

  // Buffers add small uplift to target
  target += buffers.length * 75;

  const summary =
    `This project is estimated at ${score}/100 complexity with ${tier} scope. ` +
    `Key drivers include pages, feature depth, and readiness.`;

  const pitch = {
    recommend: `Recommend ${tier} due to scope and risk balance.`,
    emphasize: [
      "Clear scope & revisions",
      "Performance and reliability",
      "Upgrade path if needs expand",
    ],
    objections: [
      "Can we start cheaper?",
      "Do we need automation now?",
    ],
  };

  return { score, tier, confidence, summary, pricing: { target, minimum, buffers }, risks, pitch };
}