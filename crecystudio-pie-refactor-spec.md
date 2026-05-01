# PIE Engine Refactor — Specification

> **Status: current source of truth for PIE engine implementation.** Strategic and positioning context for CrecyStudio lives in `opportunities_to_build_on_current_repo_to_better_expose_crecys_potential.md`, which references this spec for big-ticket routing logic (the fast/warm/deep paths). Phase 1 (config and cleanup) and the tier bands are already shipped (`lib/pricing/tiers.ts`, `lib/pricing/config.ts`). Phases 2–7 remain the implementation roadmap.

Reference spec for refactoring the Project Intelligence Engine from labor-cost pricing to tier/value-based pricing. This is the target state. Implementation is separate work.

---

## Problem summary

The current PIE engine in `lib/pie/ensurePie.ts` has four problems:

1. **Hourly rate hardcoded at $40/hr** — freelancer-marketplace pricing, not boutique-studio pricing
2. **Hours model is 30–50% too lean** — missing QA, revisions, communication, discovery, launch coordination
3. **Pricing signal thresholds flag boutique pricing as "premium"** — psychologically training the operator to apologize for fair prices
4. **Two parallel PIE engine files exist** (`lib/pie/ensurePie.ts` and `lib/pie.ts`) — tech debt, unclear which is called

## Target model — tier/value pricing

Instead of calculating a labor cost and comparing quotes against it, the engine recommends a **tier** based on project complexity, and hours are used only for **capacity math** (will this fit in my next 3 weeks given current load?).

### Core principle
**Clients don't buy hours from you — they buy outcomes.** Tiers represent value delivered. Hours represent studio capacity consumed. These two things should never be confused.

### Tier bands (authoritative)

| Tier | Price band | Hours band | Typical project shape |
|---|---|---|---|
| **Starter** | $1,800 – $2,400 | 20 – 30 hrs | 1–3 pages, single conversion goal, minimal integrations |
| **Growth** | $3,500 – $4,500 | 35 – 55 hrs | 4–6 pages, booking/forms/CMS, Google Business setup |
| **Premium** | $6,500 – $10,000+ | 65 – 120 hrs | 7+ pages, e-commerce/member area/custom integrations |

These numbers should live in one config file (`lib/pricing/tiers.ts`) and be imported everywhere — marketing pages, PIE engine, quote generator, admin controls. No more hardcoded prices scattered through the codebase.

### Internal hourly rate

**$85/hr** — used ONLY for:
1. Capacity math (does this fit my schedule?)
2. Profit margin sanity checks (at $85/hr, does this project earn enough to be worth the time?)
3. Admin-side adjustment calculations (if you want to offer a discount, what does that do to effective hourly rate?)

**Never exposed to clients.** Never appears in quotes, proposals, contracts, or the portal. Only visible inside the admin pipeline.

---

## New PIE payload shape

```typescript
type PiePayloadV3 = {
  version: "3.0";

  // ─── COMPLEXITY (what kind of project is this?) ───
  complexity: {
    score: number;           // 0-100
    label: "Low" | "Moderate" | "High" | "Very High";
    drivers: Array<{
      label: string;
      impact: "low" | "medium" | "high";
      points: number;
      note: string;
    }>;
    confidence: "Low" | "Medium" | "High";
  };

  // ─── TIER RECOMMENDATION (what should we charge?) ───
  tier: {
    recommended: "Starter" | "Growth" | "Premium";
    priceBand: { min: number; max: number };  // from tier config
    targetPrice: number;                       // specific price within the band
    rationale: string;                         // "6 pages + booking integration + content help puts this solidly in Growth"
    upsellNote?: string;                       // "Add e-commerce and this becomes Premium"
    downsellNote?: string;                     // "Strip booking and this could fit Starter"
  };

  // ─── CAPACITY (can I fit this in my schedule?) ───
  capacity: {
    estimatedHours: {
      min: number;      // best case — everything goes smoothly
      target: number;   // realistic — normal feedback cycles
      max: number;      // worst case — stuck revisions, content delays
    };
    breakdown: {
      discovery: number;      // 10% of target
      build: number;          // 55% of target
      revisions: number;      // 20% of target
      qa: number;             // 10% of target
      launch: number;         // 5% of target
    };
    estimatedWeeks: { min: number; target: number; max: number };
    effectiveHourlyRate: number;  // targetPrice / targetHours — internal only
    profitSignal: "healthy" | "tight" | "unprofitable";
    profitMessage: string;
  };

  // ─── LEAD QUALITY (how good is this lead?) ───
  lead: {
    score: number;            // 0-100
    priority: "high" | "normal" | "low";
    signals: Array<{ label: string; weight: number; note: string }>;
    notes: string;
  };

  // ─── RISKS & MITIGATIONS ───
  risks: Array<{
    flag: string;
    impact: "low" | "medium" | "high";
    mitigation: string;
  }>;

  // ─── SCOPE DEFAULTS (what the quote should include) ───
  scope: {
    pagesIncluded: string[];
    featuresIncluded: string[];
    assumptions: string[];
    exclusions: string[];
    deliverables: string[];
    revisionRounds: number;
  };

  // ─── DISCOVERY QUESTIONS (what to ask before finalizing) ───
  discoveryQuestions: string[];

  // ─── NEGOTIATION TOOLKIT (if the client pushes back) ───
  negotiation: {
    lowerCostOptions: string[];   // "Launch with 3 pages, add rest post-launch"
    upsellOptions: string[];      // "Add monthly maintenance"
    priceDefense: string[];       // "Pricing includes 30 days post-launch support"
  };

  // ─── ROUTING (fast / warm / deep path decision) ───
  routing: {
    path: "fast" | "warm" | "deep";
    reason: string;
    triggers: string[];
    triggerDetails: Array<{
      rule: string;
      matched: string;
      note: string;
    }>;
    recommendedCallLength: null | 15 | 30;
    manualOverride: null | "fast" | "warm" | "deep";
    finalPath: "fast" | "warm" | "deep";
  };
};
```

---

## New hours model

Replace the current formula with a layered model that accounts for the full project lifecycle, not just build time.

### Formula

```typescript
// Base build hours from scope
const baseBuildHours = 
  (pagesEstimate * 4) +              // 4 hrs per page (was 3)
  (featuresPoints) +                  // from keyword analysis
  (complexityScore * 0.25);           // complexity adds build time

// Lifecycle multipliers (research-based)
const discoveryHours = baseBuildHours * 0.18;  // scope, kickoff, planning
const revisionHours = baseBuildHours * 0.25;   // includes all rounds
const qaHours = baseBuildHours * 0.15;         // pre-launch testing
const commsHours = baseBuildHours * 0.12;      // client communication
const launchHours = baseBuildHours * 0.08;     // deployment, handoff

const targetHours = 
  baseBuildHours + 
  discoveryHours + 
  revisionHours + 
  qaHours + 
  commsHours + 
  launchHours;

// Bands
const minHours = targetHours * 0.85;   // best case
const maxHours = targetHours * 1.35;   // worst case (stuck content, heavy revisions)
```

### Example — Sunrise Dental recalculated

- 6 pages, 4 features, complexity 72
- Base build: (6 × 4) + 15 + (72 × 0.25) = 24 + 15 + 18 = **57 hours**
- Discovery: 10 hrs
- Revisions: 14 hrs
- QA: 9 hrs
- Comms: 7 hrs
- Launch: 5 hrs
- **Target total: ~102 hours**
- Min: 87 hrs, Max: 138 hrs
- At $85/hr effective rate, $3,800 quote = **$37/hr effective** → ⚠️ profit signal: **TIGHT**

This is the kind of feedback you actually need. The current engine would have said "premium pricing." The new engine says "this is underpriced for the scope, consider raising to $5,200 or phasing delivery."

---

## New tier recommendation logic

Replace the simple complexity→tier mapping with a multi-signal recommendation.

```typescript
function recommendTier(input): Tier {
  const pageCount = parsePagesWanted(intake.pagesWanted);
  const hasEcomOrAuth = features.some(f => 
    /ecommerce|checkout|portal|member|auth/i.test(f)
  );
  const hasBooking = features.some(f => /booking|calendar/i.test(f));
  const complexityScore = calculateComplexity(input);

  // Premium triggers
  if (hasEcomOrAuth) return "Premium";
  if (pageCount >= 7) return "Premium";
  if (complexityScore >= 75) return "Premium";
  if (features.length >= 6) return "Premium";

  // Starter triggers  
  if (pageCount <= 2 && features.length <= 2 && complexityScore < 30) {
    return "Starter";
  }

  // Everything else is Growth (the default sweet spot)
  return "Growth";
}
```

### Target price within the band

Don't just return the band — return a specific recommended price within it based on complexity.

```typescript
function targetPriceWithinTier(tier: Tier, complexity: number): number {
  const band = TIER_BANDS[tier];
  
  // Normalize complexity to 0-1 within the tier's expected range
  const tierRanges = { Starter: [0, 30], Growth: [25, 70], Premium: [60, 100] };
  const [lo, hi] = tierRanges[tier];
  const normalized = Math.max(0, Math.min(1, (complexity - lo) / (hi - lo)));
  
  // Higher complexity = higher price within band
  return Math.round(band.min + (band.max - band.min) * normalized);
}
```

So a Growth project at complexity 40 lands at ~$3,700, and a Growth project at complexity 65 lands at ~$4,300. Both are in the Growth band — both are real boutique prices.

---

## New pricing signal logic

Replace the current "underpriced / healthy / premium" logic with tier-band-aware checks.

```typescript
function analyzePricingSignal(
  currentQuote: number, 
  recommendedTier: Tier, 
  targetHours: number
): PricingSignal {
  const band = TIER_BANDS[recommendedTier];
  const internalRate = 85;
  const effectiveRate = currentQuote / targetHours;

  // Tier-band check (the primary signal)
  if (currentQuote < band.min) {
    return {
      status: "below_tier",
      message: `This quote is below the ${recommendedTier} tier floor. Consider raising to at least $${band.min} or trimming scope to match Starter.`,
    };
  }
  if (currentQuote > band.max) {
    return {
      status: "above_tier",
      message: `This quote exceeds the ${recommendedTier} tier ceiling. Either this should be Premium or you need to justify the scope expansion.`,
    };
  }

  // Profit check (secondary signal, internal-only)
  if (effectiveRate < internalRate * 0.7) {
    return {
      status: "in_tier_but_tight",
      message: `Quote is in the ${recommendedTier} band, but effective rate is $${Math.round(effectiveRate)}/hr vs. target $85/hr. Margin is tight — watch for scope creep.`,
    };
  }
  if (effectiveRate > internalRate * 1.3) {
    return {
      status: "in_tier_profitable",
      message: `Quote is in the ${recommendedTier} band with a healthy $${Math.round(effectiveRate)}/hr effective rate. Strong margin.`,
    };
  }

  return {
    status: "healthy",
    message: `Quote is in the ${recommendedTier} band at ~$${Math.round(effectiveRate)}/hr effective rate. Healthy match.`,
  };
}
```

Note the language: **never apologetic, never warning the operator off fair prices.** The signal is a collaborator, not a censor.

---

## Routing logic — deciding when to require a call

Not every quote should be auto-accepted. Some projects have enough ambiguity or scope risk that a call is the right move before committing to a fixed price. PIE should decide which of three paths a quote takes based on triggers, then the client-facing page renders the appropriate variant.

### The three paths

**FAST PATH — firm quote, no call (target: ~60% of quotes)**
Clean scope, confident PIE, client can accept and pay immediately. The post-quote page shows the firm price with an "Accept & pay deposit" primary CTA.

**WARM PATH — firm quote with recommended call (target: ~30% of quotes)**
Doable project with some uncertainty. Firm price is still shown, but the hero copy acknowledges the recommendation to talk first, and the CTAs swap — "Schedule a 15-min call" becomes primary, "Accept as-is" becomes secondary. A context block explains *why* the call is recommended (pulled from the matched triggers).

**DEEP PATH — range only, call required (target: ~10% of quotes)**
Scope is too ambiguous or too large to commit to a fixed price without a real conversation. Price block shows a range instead of a fixed number. The only CTA is "Schedule a 30-minute call to finalize." Every scope field gets a "to be confirmed" caveat.

### Deep-path triggers (any ONE fires → deep path)

These are hard gates. Each one alone is enough because each represents genuine scope risk the engine can't resolve without conversation.

- E-commerce with real inventory (more than ~10 products or any physical shipping)
- Auth, login, or member areas
- Custom API integrations (CRM sync, custom databases, non-Stripe payment processors)
- Migration from a complex existing site (legacy CMS, WordPress with custom plugins, custom app)
- Multi-language requirement
- Multi-role user system (3+ roles like admin/staff/customer)
- Compliance requirements in the client's industry (HIPAA, legal, financial, accessibility-certified)
- Custom design system or full brand creation from scratch (not a refresh)
- 3 or more "I don't know" answers in the intake
- No budget provided AND total feature count is 6 or more
- Free-text fields contain explicit language asking for a call or discovery

### Warm-path triggers (2 or more fire → warm path)

These are additive. Each one alone is fine, but the combination creates enough uncertainty that a call is worth recommending.

- Page count is 5 or 6 (at the edge of the Growth tier)
- 4 to 5 features requested, including at least one ambiguous one
- Content is "partial" or "some of it ready" (not "ready")
- Budget provided but doesn't match PIE's recommendation (too low OR too high by more than 25%)
- Copywriting help requested
- Logo or branding help requested
- Multiple stakeholders mentioned in intake ("my partner and I will review")
- Free-text fields contain uncertainty language ("not sure," "we'll see," "depends," "maybe," "probably")
- Timeline is under 2 weeks (rush) or more than 3 months out (lukewarm)
- 1 or 2 "I don't know" answers in the intake
- Client's industry is new to CrecyStudio's portfolio (no prior projects in that vertical)

### Fast-path conditions (all must be true)

- No deep-path triggers fired
- Fewer than 2 warm-path triggers fired
- Page count is 1 to 4
- 3 or fewer features
- No ambiguous features
- Content is "ready" or "mostly ready"
- Budget provided and matches PIE recommendation
- No "I don't know" answers
- Client did NOT explicitly request a call

### Important — confidence is about ambiguity, not size

A 7-page site with crystal-clear scope can be fast path. A 3-page site with half the intake fields marked "I don't know" should be warm or deep path. The routing measures *how well PIE understands the project*, not *how big the project is*. The tier recommendation already handles size. Don't double-count.

### Evaluation order

```typescript
function routeQuote(input: PieInput): RoutingDecision {
  // Check deep-path triggers first — any match means deep path
  const deepTriggers = evaluateDeepTriggers(input);
  if (deepTriggers.length > 0) {
    return {
      path: "deep",
      reason: `${deepTriggers.length} deep-path trigger(s) fired`,
      triggers: deepTriggers,
      recommendedCallLength: 30,
    };
  }

  // Check warm-path triggers — need 2 or more to fire
  const warmTriggers = evaluateWarmTriggers(input);
  if (warmTriggers.length >= 2) {
    return {
      path: "warm",
      reason: `${warmTriggers.length} warm-path triggers combined`,
      triggers: warmTriggers,
      recommendedCallLength: 15,
    };
  }

  // Default to fast path
  return {
    path: "fast",
    reason: "Clean scope, confident recommendation",
    triggers: [],
    recommendedCallLength: null,
  };
}
```

### Routing field in the PIE payload

Add this to the v3 payload shape:

```typescript
routing: {
  path: "fast" | "warm" | "deep";
  reason: string;
  triggers: string[];                // which rules matched
  triggerDetails: Array<{            // human-readable for display
    rule: string;
    matched: string;
    note: string;
  }>;
  recommendedCallLength: null | 15 | 30;
  manualOverride: null | "fast" | "warm" | "deep";
  finalPath: "fast" | "warm" | "deep"; // override if set, otherwise path
};
```

### Manual override

The admin can always override PIE's routing decision on the project control panel. Three reasons this matters:

1. **You know something PIE doesn't** — recognized the client from LinkedIn, worked with their industry before, spotted a red flag in a free-text field PIE couldn't parse
2. **Capacity concerns** — even a low-complexity quote should route to warm path if you're slammed and need to screen more carefully
3. **Pull a deep-path project into warm** — sometimes a complex project has an enthusiastic buyer and you're confident enough to quote a fixed price without full discovery

The admin UI should show PIE's recommendation clearly with the triggers that fired, then offer override buttons. PIE's decision is a default, not a rule.

### Tuning against real data

Once the routing is live, track these metrics to tune the triggers:

- **Fast-path conversion rate** — how often do fast-path quotes get accepted? Should be above 40%. If lower, the fast path is too aggressive (quotes aren't firm enough) or the tier recommendation is wrong.
- **Warm-path call-to-accept rate** — how often do warm-path clients actually take the call vs. just clicking "Accept as-is"? If most just accept, the warm path is over-triggering. If most take the call, it's correctly calibrated.
- **Deep-path call-to-project rate** — how often do deep-path calls convert into actual projects? This is your qualified lead rate. Below 30% and the deep path is too generous with its range.
- **Override frequency** — how often are you manually overriding PIE? If it's more than 20% of quotes, one or more of the triggers needs tuning.

Review these metrics every 20 quotes or so for the first 100, then every 50 quotes after that. The triggers will shift based on what you learn.

---

## Implementation plan

Order matters. Don't touch the client-facing surfaces until the internal engine is solid.

### Phase 1 — Config and cleanup (1–2 hrs)
1. Create `lib/pricing/tiers.ts` with the authoritative tier bands
2. Create `lib/pricing/config.ts` with `INTERNAL_HOURLY_RATE = 85`
3. Delete the unused PIE engine file (`lib/pie.ts` or `lib/pie/ensurePie.ts` — keep the one actually called in production)
4. Find and replace all hardcoded `$40` references

### Phase 2 — Hours model refactor (2–3 hrs)
1. Rewrite the hours calculation in `ensurePie.ts` with the layered lifecycle model
2. Add the breakdown by phase
3. Update the `PiePayloadV2` type (or migrate to v3 shape)
4. Recalculate against 5–10 of your real past projects and tune the constants
5. Write unit tests for the formula

### Phase 3 — Tier recommendation refactor (2 hrs)
1. Implement `recommendTier` and `targetPriceWithinTier`
2. Update the scope defaults per tier (pages, features, exclusions)
3. Update the `tierPitch` messages to match value-based language

### Phase 4 — Pricing signal refactor (1–2 hrs)
1. Implement `analyzePricingSignal` with tier-band and profit checks
2. Remove the "premium" warning language
3. Update admin UI to show tier band visually (horizontal range bar with current quote marked)

### Phase 5 — Routing logic (2–3 hrs)
1. Implement `evaluateDeepTriggers` and `evaluateWarmTriggers` functions
2. Implement `routeQuote` with the evaluation order described above
3. Add `routing` field to the v3 payload shape
4. Add admin UI for viewing the recommendation + triggers + override buttons
5. Add override tracking so you can measure how often you disagree with PIE
6. Write unit tests against 10 real past projects to verify the triggers feel right

### Phase 6 — Admin UI updates (3–4 hrs)
1. Update the PIE card in the admin pipeline (use the prototype we designed) to show tier recommendation prominently
2. Add a visual tier-band check to the pricing block
3. Show effective hourly rate as a secondary metric in the admin view
4. Add routing path indicator with override controls
5. Hide internal hourly rate from any client-facing surface

### Phase 7 — Client-facing updates (depends on post-quote prototype)
1. Update `/estimate` page to show tier-based quote
2. Build three variants of the post-quote view (fast / warm / deep)
3. Route clients to the correct variant based on `routing.finalPath`
4. Update portal price block to remove any labor-based language
5. Update marketing pages to reflect tier bands from config

**Total estimated effort: ~15–20 hours** of focused work, spread across ~3–4 days.

---

## Things that stay the same

Not everything about PIE is broken. Keep these parts:

- ✅ Complexity scoring logic (pages, features, keyword analysis)
- ✅ Risk flags with impact ratings
- ✅ Lead quality scoring
- ✅ Discovery questions generation
- ✅ Scope assumptions and exclusions
- ✅ Deliverables list
- ✅ Priority calculation (lead quality + call request signals)

These are the 70% that works. The refactor only touches pricing math.

---

## Migration path for existing quotes

If you have existing quotes in the database with the old v2 payload, don't break them. Options:

1. **Write a migration script** that reads v2 payloads and produces v3 payloads for all existing quotes
2. **Keep v2 reading compatible** in the payload parser so old reports still render
3. **Regenerate on access** — when an admin opens an old quote, regenerate the PIE report with the new engine

Recommended: option 3. Lowest risk, no bulk migration needed, old data just upgrades as you interact with it.

---

## Summary

The PIE engine is 70% right. The 30% that's wrong is concentrated in:
1. The hardcoded $40/hr (should be $85/hr, config-driven)
2. The lean hours formula (missing lifecycle overhead)
3. The pricing signal thresholds (flagging fair prices as "premium")
4. The missing routing logic (every quote is auto-firm regardless of confidence)
5. The duplicate engine file (tech debt)

The refactor is **~15–20 hours of focused work**. It future-proofs your pricing model, matches your boutique positioning, adds a confidence-gated hybrid quote flow (fast / warm / deep) that protects you from bad auto-quotes on ambiguous projects, and directly improves the post-quote client experience because you'll be showing value-based pricing instead of labor-based pricing.

Keep this doc open when you're ready to do the refactor. Everything you need is here.
