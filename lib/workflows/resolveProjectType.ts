// Resolves the canonical ProjectType from the multiple sources where the
// answer might live (portal row, quote row, intake snapshot). Used by
// portal creation, admin gates, and workflow template selection so all
// callers agree on a single answer.

import { isProjectType, type ProjectType } from "./types";

type WithProjectType = {
  project_type?: string | null;
  projectType?: string | null;
};

type Quote = WithProjectType & {
  quote_json?: { projectType?: string } | null;
};

type Intake = WithProjectType;

// Resolution priority: portal → quote → quote.quote_json.projectType →
// intake → "website" default. The portal column is the source of truth
// once a portal exists; the quote is the source for intake-time decisions.
// Anything that doesn't validate against the canonical enum falls back
// to "website" rather than risking lane bypass via typos.
export function resolveProjectType(input: {
  portal?: WithProjectType | null;
  quote?: Quote | null;
  intake?: Intake | null;
}): ProjectType {
  const candidates: Array<string | null | undefined> = [
    input.portal?.project_type,
    input.portal?.projectType,
    input.quote?.project_type,
    input.quote?.projectType,
    input.quote?.quote_json?.projectType,
    input.intake?.project_type,
    input.intake?.projectType,
  ];

  for (const candidate of candidates) {
    if (isProjectType(candidate)) return candidate;
  }
  return "website";
}
