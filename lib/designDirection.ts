// Website Design Direction — types, constants, defaults, validation.
//
// Storage lives at customer_portal_projects.scope_snapshot.designDirection
// (MVP: no dedicated table). See CRECYSTUDIO_LAUNCH_AND_PORTAL_PLAN.md
// § Phase 2 for the full plan.
//
// Operating rule: Design Direction is a decision checkpoint, not a design
// menu. Client chooses the lane. CrecyStudio drives the design.

export type WebsiteDesignDirectionStatus =
  | "not_started"
  | "waiting_on_client"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "locked";

export type DesignControlLevel =
  | "crecystudio_led"
  | "guided_direction"
  | "brand_guided"
  | "premium_concept_review";

export type BrandColorsKnown = "yes" | "no" | "not_sure";
export type HasLogo = "yes" | "no" | "in_progress";
export type HasBrandGuide = "yes" | "no";

export type ReferenceWebsite = {
  url: string;
  reason: string;
};

export type WebsiteDesignDirection = {
  status: WebsiteDesignDirectionStatus;

  controlLevel: DesignControlLevel;

  brandMood: string[];
  visualStyle: string;

  brandColorsKnown: BrandColorsKnown;
  preferredColors: string;
  colorsToAvoid: string;
  letCrecyChoosePalette: boolean;

  typographyFeel: string;
  imageryDirection: string[];

  likedWebsites: ReferenceWebsite[];
  dislikedWebsites: ReferenceWebsite[];

  contentTone: string[];
  hasLogo: HasLogo;
  hasBrandGuide: HasBrandGuide;
  brandAssetsNotes: string;
  clientNotes: string;

  approvedDirectionTerms: boolean;

  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  lockedAt: string | null;
  changesRequestedAt: string | null;

  adminPublicNote: string | null;
  adminInternalNote: string | null;
};

// Subset of fields the client sends on submission. Status and timestamps
// are server-managed.
export type WebsiteDesignDirectionInput = Omit<
  WebsiteDesignDirection,
  | "status"
  | "submittedAt"
  | "reviewedAt"
  | "approvedAt"
  | "lockedAt"
  | "changesRequestedAt"
  | "adminPublicNote"
  | "adminInternalNote"
>;

// ─── Option lists ────────────────────────────────────────────────────────
// Single source of truth for both client form and admin display.

export const BRAND_MOOD_OPTIONS = [
  "Clean",
  "Premium",
  "Friendly",
  "Bold",
  "Minimal",
  "Modern",
  "Luxury",
  "Warm",
  "Technical",
  "Trustworthy",
  "Energetic",
  "Creative",
] as const;

export const VISUAL_STYLE_OPTIONS = [
  "Clean & Professional",
  "Bold & Premium",
  "Warm & Friendly",
  "Modern & Tech",
  "Luxury / Editorial",
  "Local Business / Trust-first",
  "Creative / Portfolio-style",
] as const;

export const TYPOGRAPHY_FEEL_OPTIONS = [
  "Modern and clean",
  "Elegant and premium",
  "Bold and strong",
  "Friendly and approachable",
  "Technical and minimal",
  "Follow existing brand fonts",
  "Let CrecyStudio choose",
] as const;

export const IMAGERY_DIRECTION_OPTIONS = [
  "Real photography",
  "Stock photography",
  "Founder/team photos",
  "Product/service photos",
  "Before/after images",
  "Icons",
  "Illustrations",
  "App screenshots/mockups",
  "Minimal imagery",
] as const;

export const CONTENT_TONE_OPTIONS = [
  "Professional",
  "Friendly",
  "Direct",
  "Luxury",
  "Technical",
  "Calm",
  "Inspirational",
  "Playful",
] as const;

export const CONTROL_LEVEL_OPTIONS: {
  value: DesignControlLevel;
  label: string;
  description: string;
  recommendedTier: string;
}[] = [
  {
    value: "crecystudio_led",
    label: "CrecyStudio-led direction",
    description:
      "I trust CrecyStudio to choose the best visual direction based on my business, audience, and goals.",
    recommendedTier: "Starter",
  },
  {
    value: "guided_direction",
    label: "Guided direction",
    description:
      "I want to give input and approve the direction before the full build.",
    recommendedTier: "Growth",
  },
  {
    value: "brand_guided",
    label: "Brand-guided build",
    description:
      "I already have a logo, colors, fonts, or brand guidelines. Please follow those.",
    recommendedTier: "Growth / Premium",
  },
  {
    value: "premium_concept_review",
    label: "Premium concept review",
    description: "I want to compare up to 2 visual directions before full build.",
    recommendedTier: "Premium only",
  },
];

// ─── Defaults ────────────────────────────────────────────────────────────

export const DEFAULT_WEBSITE_DESIGN_DIRECTION: WebsiteDesignDirection = {
  status: "waiting_on_client",
  controlLevel: "crecystudio_led",
  brandMood: [],
  visualStyle: "",
  brandColorsKnown: "not_sure",
  preferredColors: "",
  colorsToAvoid: "",
  letCrecyChoosePalette: true,
  typographyFeel: "Let CrecyStudio choose",
  imageryDirection: [],
  likedWebsites: [],
  dislikedWebsites: [],
  contentTone: [],
  hasLogo: "no",
  hasBrandGuide: "no",
  brandAssetsNotes: "",
  clientNotes: "",
  approvedDirectionTerms: false,
  submittedAt: null,
  reviewedAt: null,
  approvedAt: null,
  lockedAt: null,
  changesRequestedAt: null,
  adminPublicNote: null,
  adminInternalNote: null,
};

// ─── Validation ──────────────────────────────────────────────────────────

export type DesignDirectionValidationResult =
  | { ok: true; value: WebsiteDesignDirectionInput }
  | { ok: false; error: string };

const URL_RE = /^https?:\/\//i;

function asString(value: unknown, max = 4000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function asStringArray(value: unknown, max = 20): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function asReferenceList(
  value: unknown,
  max: number,
): ReferenceWebsite[] | { error: string } {
  if (!Array.isArray(value)) return [];
  const out: ReferenceWebsite[] = [];
  for (const item of value.slice(0, max)) {
    if (!item || typeof item !== "object") continue;
    const url = asString((item as { url?: unknown }).url, 500);
    const reason = asString((item as { reason?: unknown }).reason, 500);
    if (!url) continue;
    if (!URL_RE.test(url)) {
      return { error: "Reference websites must be valid http(s) URLs." };
    }
    out.push({ url, reason });
  }
  return out;
}

// Accept the loose payload from the client and produce the strict input
// shape, or an error message suitable for surfacing in the API response.
export function validateDesignDirectionInput(
  raw: unknown,
): DesignDirectionValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Design direction payload is required." };
  }
  const r = raw as Record<string, unknown>;

  const controlLevel = asString(r.controlLevel) as DesignControlLevel;
  if (!CONTROL_LEVEL_OPTIONS.some((o) => o.value === controlLevel)) {
    return { ok: false, error: "Choose a design direction control level." };
  }

  const brandMood = asStringArray(r.brandMood);
  if (brandMood.length === 0) {
    return { ok: false, error: "Pick at least one brand mood word." };
  }
  if (brandMood.length > 3) {
    return {
      ok: false,
      error: "Choose up to 3 brand mood words so the direction stays focused.",
    };
  }
  if (!brandMood.every((m) => (BRAND_MOOD_OPTIONS as readonly string[]).includes(m))) {
    return { ok: false, error: "Brand mood values are out of range." };
  }

  const visualStyle = asString(r.visualStyle, 200);
  if (!visualStyle) {
    return { ok: false, error: "Choose a visual style." };
  }
  if (!(VISUAL_STYLE_OPTIONS as readonly string[]).includes(visualStyle)) {
    return { ok: false, error: "Visual style is out of range." };
  }

  const typographyFeel = asString(r.typographyFeel, 200);
  if (!typographyFeel) {
    return { ok: false, error: "Choose a typography feel." };
  }
  if (!(TYPOGRAPHY_FEEL_OPTIONS as readonly string[]).includes(typographyFeel)) {
    return { ok: false, error: "Typography feel is out of range." };
  }

  const contentTone = asStringArray(r.contentTone, 2);
  if (contentTone.length === 0) {
    return { ok: false, error: "Choose at least one content tone." };
  }
  if (contentTone.length > 2) {
    return { ok: false, error: "Choose up to 2 content tone words." };
  }
  if (!contentTone.every((t) => (CONTENT_TONE_OPTIONS as readonly string[]).includes(t))) {
    return { ok: false, error: "Content tone values are out of range." };
  }

  const imageryDirection = asStringArray(r.imageryDirection);
  if (
    imageryDirection.length > 0 &&
    !imageryDirection.every((i) => (IMAGERY_DIRECTION_OPTIONS as readonly string[]).includes(i))
  ) {
    return { ok: false, error: "Imagery direction values are out of range." };
  }

  const liked = asReferenceList(r.likedWebsites, 3);
  if ("error" in liked) return { ok: false, error: liked.error };

  const disliked = asReferenceList(r.dislikedWebsites, 2);
  if ("error" in disliked) return { ok: false, error: disliked.error };

  const brandColorsKnownRaw = asString(r.brandColorsKnown);
  const brandColorsKnown: BrandColorsKnown =
    brandColorsKnownRaw === "yes" || brandColorsKnownRaw === "no"
      ? brandColorsKnownRaw
      : "not_sure";

  const hasLogoRaw = asString(r.hasLogo);
  const hasLogo: HasLogo =
    hasLogoRaw === "yes" || hasLogoRaw === "in_progress" ? hasLogoRaw : "no";

  const hasBrandGuideRaw = asString(r.hasBrandGuide);
  const hasBrandGuide: HasBrandGuide = hasBrandGuideRaw === "yes" ? "yes" : "no";

  if (r.approvedDirectionTerms !== true) {
    return {
      ok: false,
      error: "Please approve the design direction terms before submitting.",
    };
  }

  return {
    ok: true,
    value: {
      controlLevel,
      brandMood,
      visualStyle,
      brandColorsKnown,
      preferredColors: asString(r.preferredColors, 2000),
      colorsToAvoid: asString(r.colorsToAvoid, 2000),
      letCrecyChoosePalette: r.letCrecyChoosePalette !== false,
      typographyFeel,
      imageryDirection,
      likedWebsites: liked,
      dislikedWebsites: disliked,
      contentTone,
      hasLogo,
      hasBrandGuide,
      brandAssetsNotes: asString(r.brandAssetsNotes, 4000),
      clientNotes: asString(r.clientNotes, 4000),
      approvedDirectionTerms: true,
    },
  };
}

// Merge a validated input on top of an existing direction record (for
// resubmissions after changes_requested). Status, timestamps, and admin
// notes are managed by the caller.
export function mergeDesignDirection(
  existing: Partial<WebsiteDesignDirection> | null | undefined,
  input: WebsiteDesignDirectionInput,
): WebsiteDesignDirection {
  return {
    ...DEFAULT_WEBSITE_DESIGN_DIRECTION,
    ...(existing ?? {}),
    ...input,
  };
}

// Read whatever lives at scope_snapshot.designDirection and produce a
// full WebsiteDesignDirection (filling missing fields with defaults).
// Tolerates legacy / partial records.
export function readDesignDirection(
  scopeSnapshot: unknown,
): WebsiteDesignDirection {
  const snap =
    scopeSnapshot && typeof scopeSnapshot === "object"
      ? (scopeSnapshot as Record<string, unknown>)
      : {};
  const raw = snap.designDirection;
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_WEBSITE_DESIGN_DIRECTION };
  }
  return {
    ...DEFAULT_WEBSITE_DESIGN_DIRECTION,
    ...(raw as Partial<WebsiteDesignDirection>),
  };
}
