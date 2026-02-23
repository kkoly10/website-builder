// lib/pie/ops-schema.ts

export type PieOpsInput = {
  submissionId?: string;
  businessName?: string;
  contactName?: string;
  industry?: string;
  location?: string;
  teamSize?: string;
  currentTools?: string[];
  problems?: string[];
  goals?: string[];
  budgetRange?: string;
  urgency?: string;
  notes?: string;
  // Keep this flexible so you can pass your current quote/intake payload directly
  raw?: Record<string, unknown>;
};

export const PIE_OPS_REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "executiveSummary",
    "problemDiagnosis",
    "solutionBlueprint",
    "implementationPlan",
    "automationOpportunities",
    "toolingRecommendations",
    "risksAndConstraints",
    "clientQuestions",
    "pricingAndPackaging",
    "salesStrategy",
    "confidence"
  ],
  properties: {
    executiveSummary: {
      type: "string",
      minLength: 1
    },

    problemDiagnosis: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["problem", "impact", "likelyRootCause", "severity", "confidence"],
        properties: {
          problem: { type: "string" },
          impact: { type: "string" },
          likelyRootCause: { type: "string" },
          severity: {
            type: "string",
            enum: ["low", "medium", "high", "critical"]
          },
          confidence: {
            type: "string",
            enum: ["low", "medium", "high"]
          }
        }
      }
    },

    solutionBlueprint: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["solution", "whyItHelps", "scopeType", "estimatedComplexity"],
        properties: {
          solution: { type: "string" },
          whyItHelps: { type: "string" },
          scopeType: {
            type: "string",
            enum: ["quick-win", "core-build", "advanced-phase"]
          },
          estimatedComplexity: {
            type: "string",
            enum: ["low", "medium", "high"]
          }
        }
      }
    },

    implementationPlan: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["phase", "objective", "tasks", "deliverables", "timelineEstimate"],
        properties: {
          phase: { type: "string" },
          objective: { type: "string" },
          tasks: {
            type: "array",
            minItems: 1,
            items: { type: "string" }
          },
          deliverables: {
            type: "array",
            minItems: 1,
            items: { type: "string" }
          },
          timelineEstimate: { type: "string" }
        }
      }
    },

    automationOpportunities: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["workflow", "automationIdea", "businessImpact", "priority"],
        properties: {
          workflow: { type: "string" },
          automationIdea: { type: "string" },
          businessImpact: { type: "string" },
          priority: {
            type: "string",
            enum: ["now", "next", "later"]
          }
        }
      }
    },

    toolingRecommendations: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tool", "category", "why", "costLevel"],
        properties: {
          tool: { type: "string" },
          category: { type: "string" },
          why: { type: "string" },
          costLevel: {
            type: "string",
            enum: ["free", "low", "medium", "high"]
          }
        }
      }
    },

    risksAndConstraints: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["risk", "whyItMatters", "mitigation"],
        properties: {
          risk: { type: "string" },
          whyItMatters: { type: "string" },
          mitigation: { type: "string" }
        }
      }
    },

    clientQuestions: {
      type: "array",
      minItems: 3,
      items: { type: "string" }
    },

    pricingAndPackaging: {
      type: "object",
      additionalProperties: false,
      required: ["recommendedPackage", "priceRange", "deliveryModel", "pricingRationale"],
      properties: {
        recommendedPackage: { type: "string" },
        priceRange: { type: "string" },
        deliveryModel: { type: "string" },
        pricingRationale: { type: "string" },
        retainerOption: { type: "string" }
      }
    },

    salesStrategy: {
      type: "object",
      additionalProperties: false,
      required: ["positioning", "pitchSummary", "quickWinOffer", "nextStepCTA"],
      properties: {
        positioning: { type: "string" },
        pitchSummary: { type: "string" },
        quickWinOffer: { type: "string" },
        nextStepCTA: { type: "string" }
      }
    },

    confidence: {
      type: "object",
      additionalProperties: false,
      required: ["overall", "reason"],
      properties: {
        overall: {
          type: "string",
          enum: ["low", "medium", "high"]
        },
        reason: { type: "string" }
      }
    }
  }
} as const;

export function buildPieOpsSystemPrompt() {
  return `
You are PIE, an elite business systems and automation strategist.

Your job:
- Analyze a business client's intake and operational pain points
- Diagnose likely root causes
- Propose practical software/automation/system solutions
- Produce a detailed implementation plan the engineer can execute
- Think like a consultant + systems architect + operator

Rules:
1) Be concrete, not generic.
2) Focus on operational fixes: billing, invoicing, CRM, follow-up, scheduling, intake, reporting, internal workflows, customer communication, dashboards, data sync.
3) Prefer staged implementation:
   - quick wins
   - core system
   - advanced improvements
4) If information is missing, do NOT invent exact facts. Add targeted clientQuestions and state assumptions.
5) Recommend tools pragmatically (QuickBooks, Stripe, HubSpot, Airtable, Supabase, Google Workspace, Zapier/Make, etc.) only if relevant.
6) Keep solutions realistic for SMBs.
7) Do not give legal/tax/compliance advice as final advice; frame those as “confirm with CPA/attorney” where relevant.
8) Return ONLY data matching the JSON schema.
`.trim();
}

export function buildPieOpsUserInput(payload: PieOpsInput) {
  return JSON.stringify(payload, null, 2);
}