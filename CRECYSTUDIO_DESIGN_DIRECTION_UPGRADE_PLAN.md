# CrecyStudio — Design Direction Upgrade Plan (6.5 → 9)

Status: planning · not yet implemented
Owner: Komlan
Scope: the website design-direction module inside the client portal

## Goal

Take the existing website design-direction module from a working-but-text-heavy
questionnaire (~6.5/10) to a best-in-class taste-discovery experience (~9/10),
**without** rebuilding the backbone and **without** adding ongoing studio
workload per project.

Six precise improvements, total ~3-4 focused days of work, layered on the
existing data model and approval machinery.

## What this plan does NOT do (deliberately deferred)

- **"Present 3 to pick" feature** (Track A / Rung 1 of the AI builder). That
  is the layer that sits on top of *this* upgraded module and lifts it to a
  true 10/10. Out of scope here.
- **Decision log** — separate plan; the design-direction approval will feed it
  later but the log itself is a different deliverable.
- **Admin reviewer UX overhaul** — only the *incremental* admin-side updates
  required to display the new fields/options are in scope. A broader
  admin-side refresh is its own track.

## Current state (anchor)

Verified by code read on `lib/designDirection.ts`,
`components/portal/DesignDirectionForm.tsx`, and the admin-side
components.

What's good (don't break):
- Comprehensive data model with controlLevel + brand mood + visual style +
  typography feel + imagery direction + references (with reason) + content
  tone + brand assets
- Full status machine: `not_started → waiting_on_client → submitted →
  under_review → changes_requested → approved → locked`
- Server-side validation in `validateDesignDirectionInput` with URL regex,
  length caps, allowlist checks
- Resubmission flow after `changes_requested`
- Approval-terms language sets expectations professionally

What's weak (what this plan fixes):
1. Inline-styled form, zero media queries — mobile is accidental
2. Form is all text, no visual references for the options being picked
3. `premium_concept_review` option promises something the system doesn't
   deliver
4. No taste-forcing tradeoff mechanic (pills allow mush — "Clean + Premium +
   Modern" can describe nearly the same thing)
5. Bland mood/style word choices
6. No draft save — close the tab, lose everything

## File map

Client-side:
- `lib/designDirection.ts` — types, defaults, options, validation, merge,
  read helpers
- `components/portal/DesignDirectionForm.tsx` — the input form (~495 lines,
  inline styles)
- `components/portal/DesignDirectionCard.tsx` — wrapper, shows form OR
  summary based on status
- `components/portal/DesignDirectionSummary.tsx` — read-only summary view
- `components/portal/directions/DirectionModuleResolver.tsx` — resolves
  module variant by project type
- `app/portal/[token]/PortalClient.tsx` — portal shell that mounts the card
- Submit API: locate during implementation (look in
  `app/api/portal/[token]/...` for the design-direction write endpoint)

Admin-side (**must be kept in sync**):
- `components/internal/DesignDirectionAdminPanel.tsx` — admin reviewer panel
- `components/internal/DesignDirectionPayloadEditor.tsx` — admin payload
  editor
- `app/internal/admin/[id]/ProjectControlClient.tsx` — admin project view
- `app/api/internal/portal/admin-update/route.ts` — admin update API

Translations (every text change must be reflected here):
- `messages/en.json` · `messages/fr.json` · `messages/es.json`
  (the design-direction copy lives under the portal namespaces — locate the
  `portalToken.directionModule.*` keys)

---

## Task 1 — Fix the "premium concept review" broken promise ✅ DONE

**Status:** ✅ shipped (standalone commit)
**Effort:** 10 minutes
**Why:** integrity — the form currently promises *"I want to compare up to
2 visual directions before full build,"* and the system delivers nothing of
the kind. This is the only literal lie on the form.

### Change
- In `lib/designDirection.ts` `CONTROL_LEVEL_OPTIONS` (lines ~146-179),
  rewrite the description of the `premium_concept_review` entry to remove
  the "compare 2 directions" promise. Suggested replacement:
  > "I want extra design depth and a more polished concept handoff before
  > the full build."
- When Track A ("present 3 to pick") ships later, restore the original
  wording.

### Admin-side
- No change. Admin panel just reads `controlLevel` as a string label.

### i18n
- If the description is i18n-keyed (verify in `messages/*.json` for keys
  like `portalToken.directionModule.controlLevel.premiumConceptReview.description`),
  update all three locales.

### Acceptance criteria
- New copy appears in the form's control-level card
- Existing approved records with `controlLevel: "premium_concept_review"`
  still render correctly (the data is unchanged, only the human-readable
  description shifts)

---

## Task 2 — Sharpen mood word choices

**Effort:** 1-2 hours
**Why:** today's mood pills are bland and overlapping (Clean / Premium /
Modern can all describe the same look). Sharper, more contrastive words
force a real taste signal.

### Change
- In `lib/designDirection.ts`, replace `BRAND_MOOD_OPTIONS` (lines ~88-101)
  with a more evocative list. Proposed (negotiable):
  ```ts
  export const BRAND_MOOD_OPTIONS = [
    "Editorial", "Architectural", "Confident", "Inviting",
    "Stripped", "Refined", "Magazine", "Crafted",
    "Quiet", "Daring", "Warm-toned", "Cool-toned",
  ] as const;
  ```
- Validator's allowlist check auto-updates because it reads from
  `BRAND_MOOD_OPTIONS`.

### Backward compatibility
- Existing approved records may have old values ("Clean", "Premium", etc.).
  Two options:
  1. **Permissive read** — admin panel just displays whatever's stored, even
     if not in the new allowlist.
  2. **Strict read** — old values get a one-time migration. Lower priority.
- Recommend option 1: tweak `DesignDirectionSummary` and the admin panel to
  display stored mood strings as-is.

### Admin-side
- `DesignDirectionAdminPanel.tsx` and `DesignDirectionPayloadEditor.tsx`:
  if they list mood options for admin to edit, the new words flow through
  automatically via the imported constant. If they hardcode the old list,
  update.

### i18n
- If mood words are translation-keyed, add the new words and remove the old
  ones from all three locales.

### Acceptance criteria
- New mood words appear on the form, capped at 3
- Old records still render their stored values without errors
- Admin can review submissions with new words intact

---

## Task 3 — Adjective-pair sliders (taste spectrum)

**Effort:** half day
**Why:** the single largest taste-signal improvement. Forces a position on
each of four spectra that the pills can't surface.

### Spectra
- Calm ←→ Energetic
- Traditional ←→ Modern
- Stripped ←→ Layered
- Warm-toned ←→ Cool-toned

Each: 5-point scale, -2 to +2 (no forced neutral; client can sit at 0 if
truly undecided, but the labels are weighted to encourage a real pick).

### Data model — `lib/designDirection.ts`
```ts
export type TasteSpectrum = {
  calmEnergetic: number;        // -2..+2
  traditionalModern: number;    // -2..+2
  strippedLayered: number;      // -2..+2
  warmCool: number;             // -2..+2
};

// Add to WebsiteDesignDirection (and WebsiteDesignDirectionInput)
taste: TasteSpectrum;
```

Default in `DEFAULT_WEBSITE_DESIGN_DIRECTION`:
```ts
taste: { calmEnergetic: 0, traditionalModern: 0, strippedLayered: 0, warmCool: 0 },
```

### Validation
- In `validateDesignDirectionInput`, accept `taste` as an object; for each
  key, coerce to integer and clamp to `[-2, 2]`. Reject if not an object.

### Form UI — `DesignDirectionForm.tsx`
- New section above or below "Brand mood" with four sliders.
- HTML5 `<input type="range" min="-2" max="2" step="1">` — works great on
  mobile, no custom slider library needed.
- Label both ends of each slider clearly.

### Admin-side
- `DesignDirectionAdminPanel.tsx`: render the four spectra as small visual
  bars showing the picked position (e.g., a 5-tick scale with the chosen
  tick highlighted). One-time UI work.
- `DesignDirectionPayloadEditor.tsx`: expose the same four sliders so admin
  can edit if needed.

### i18n
- Add 8 new translation strings (one per slider endpoint label) to all
  three locales.

### Acceptance criteria
- All four sliders appear and are usable on desktop and mobile
- Submitted values appear in the admin reviewer as visual bars
- Validation rejects out-of-range values

---

## Task 4 — Persistent draft save

**Effort:** half day to 1 day
**Why:** today a 12-section form lives in `useState`. Close the tab, lose
everything. For a $1.8k-$10k client that's a real frustration.

### Approach
- Persist a draft under `scope_snapshot.designDirection.draftPayload`
  (keeps it separate from the submitted record).
- Debounced auto-save on every change (800ms after last keystroke).
- Hydrate the form initial value from `draftPayload` if present **AND**
  status is `waiting_on_client` or `changes_requested`.
- On submit, clear `draftPayload` and persist the full record as today.

### Data model — `lib/designDirection.ts`
- Optional field on `WebsiteDesignDirection`:
  ```ts
  draftPayload?: Partial<WebsiteDesignDirectionInput> | null;
  ```
- Add a `draftPayload: null` default in `DEFAULT_WEBSITE_DESIGN_DIRECTION`.
- New helper:
  ```ts
  export function readDesignDirectionDraft(
    direction: WebsiteDesignDirection,
  ): Partial<WebsiteDesignDirectionInput> | null
  ```

### API
- Extend the existing design-direction write endpoint to accept a
  `mode: "draft" | "submit"` flag. `draft` writes only `draftPayload`
  without changing `status` or timestamps; `submit` clears `draftPayload`
  and writes the full record.

### Form UI — `DesignDirectionForm.tsx`
- Add a `useEffect` debouncing draft saves on any state change
- Surface a quiet status line: "Draft saved · 2:18 PM" or "Saving…"
- Don't block submit on a pending draft save (let submit win)

### Admin-side
- `DesignDirectionAdminPanel.tsx`: if a draft exists alongside a non-final
  status, show a small indicator ("Client has a draft in progress, last
  saved [time]"). Optional but nice — helps the admin know whether to nudge
  vs. wait.

### i18n
- Two new strings: "Draft saved · {time}" and "Saving…"

### Acceptance criteria
- Filling out the form, closing the tab, and re-opening it restores the
  in-progress values
- Submitting clears the draft
- The admin reviewer indicates an in-progress draft (if surfaced)
- No accidental writes during the form's initial mount

---

## Task 5 — Mobile pass via CSS module

**Effort:** half day
**Why:** the form is 495 lines of inline `style={{}}` props with zero media
queries. Reference editor's `gridTemplateColumns: "1fr auto"` and the
control-level cards' `"auto 1fr"` will compress poorly on phones.
Foundational for Task 6.

### Approach
- Create `components/portal/design-direction-form.module.css`
- Move ALL inline styles from `DesignDirectionForm.tsx` to the module
- Apply media queries at `≤640px`:
  - Control-level cards: full-width stack, looser padding
  - Pill rows: min-height 44px tap targets, verify wrap
  - Reference editor: URL/reason inputs full-width, "✕" remove button
    moves below the input on phones
  - All `<input>` font-size at 16px (prevents iOS zoom on focus)
  - Radio rows (`brandColorsKnown`, `hasLogo`, `hasBrandGuide`): wrap
    cleanly with 12px gap

### Admin-side
- The admin form (`DesignDirectionPayloadEditor.tsx`) is desktop-focused so
  this is optional there. Skip unless trivially bundled.

### i18n
- No changes.

### Acceptance criteria
- Visual smoke test at 375px / 768px / 1280px widths
- All form actions (pill select, references, submit) work on a real phone
- No iOS auto-zoom when focusing inputs

---

## Task 6 — Visual references next to options

**Effort:** ~1.5 days (curation + UI)
**Why:** the single biggest perception lift. Today the client picks "Bold &
Premium" with zero visual idea of what it looks like. Adding visuals turns
abstraction into a real choice.

### Strategy
- **SVG sketches + rendered type samples — NOT screenshots.** Screenshots
  age, need licensing, and require curation per-project. SVGs and
  type-samples are zero-maintenance.

### What gets a visual
- **Visual style** (7 options) → small layout-sketch SVG per style (clean
  grid vs editorial split vs bold blocks). Designed once, used forever.
- **Typography feel** (7 options) → a short text sample ("Aa — The quick
  brown fox") rendered in the actual font that represents that feel.
  Computed in-browser, no images.
- **Imagery direction** (9 options) → small icon glyph per option (camera,
  illustration, icon, etc.).
- **Brand mood** (12 options) → optional, lower priority; consider tiny
  color/texture swatches per mood. Defer to a v2 if time-constrained.

### Data shape — `lib/designDirection.ts`
Two clean approaches; recommend Approach A:

**Approach A (recommended):** keep options as plain strings, add parallel
visual maps:
```ts
export const VISUAL_STYLE_VISUALS: Record<typeof VISUAL_STYLE_OPTIONS[number], string> = {
  "Clean & Professional": "clean-pro",
  "Bold & Premium":       "bold-prem",
  // …
};
```

**Approach B:** convert options to `{ value, visual }` objects. More
correct but breaks every caller that reads `BRAND_MOOD_OPTIONS` as a
string list.

Use A.

### Form UI — `DesignDirectionForm.tsx`
- Extend `PillSelect` (lines ~28-82) to accept an optional `visual` slot
  rendered to the left of the label, e.g.:
  ```tsx
  <PillSelect
    options={VISUAL_STYLE_OPTIONS}
    visuals={VISUAL_STYLE_VISUALS}
    renderVisual={(key) => <StyleSketch sketch={key} />}
    …
  />
  ```
- Create `components/portal/design-direction/visuals/` with sub-components:
  - `StyleSketch.tsx` — renders the per-style SVG sketch
  - `TypeSample.tsx` — renders a font-family text sample
  - `ImageryIcon.tsx` — renders a small icon
- All SVG assets inline as React components (so no extra HTTP requests).

### Admin-side
- `DesignDirectionAdminPanel.tsx`: show the same small visual next to each
  picked option in the admin's read view, so admin can grasp the
  submission at a glance. This is the "admin-side visibility" the user
  explicitly asked for — must not skip.

### i18n
- No translation strings change (visuals are not text). The labels stay as
  today.

### Acceptance criteria
- Each visual style, typography feel, and imagery direction option shows a
  visual next to its label
- The admin reviewer shows the same visuals next to picked options
- No new image HTTP requests (SVGs inline)
- Renders cleanly on mobile (visuals scale, don't overflow)

---

## Build order

| # | Task | Effort | Notes |
|---|---|---|---|
| 1 | Premium concept review copy fix | 10 min | Standalone commit. Do today. |
| 2 | Adjective-pair sliders | half day | Highest single UX/taste win. |
| 3 | Sharper mood words | 1-2 hours | Bundles cleanly with #2 in one commit. |
| 4 | Persistent draft save | ~1 day | Real client-facing frustration solver. |
| 5 | Mobile pass via CSS module | half day | Foundational; required before #6. |
| 6 | Visual references on options | ~1.5 days | Biggest perception lift. |

Total: ~3-4 focused days.

---

## Cross-cutting: admin-side visibility checklist

For every task above, before marking it done:

- [ ] `components/internal/DesignDirectionAdminPanel.tsx` renders the new
      field/option/visual correctly in the read view
- [ ] `components/internal/DesignDirectionPayloadEditor.tsx` exposes the
      new field/option for admin editing
- [ ] `app/internal/admin/[id]/ProjectControlClient.tsx` doesn't reference
      a stale field name
- [ ] `app/api/internal/portal/admin-update/route.ts` accepts/validates the
      new field shape on admin updates
- [ ] Old records (without the new fields) still render — backward-compat
      verified

Don't ship a client-side change without confirming each of these.

---

## Open questions / decisions still needed

1. **Mood word list** — the proposed 12 words are a starting point.
   Komlan to confirm or counter-propose.
2. **Draft-save indicator placement** — bottom of the form or floating
   header? Default: bottom-right of the submit button area.
3. **Old mood values** — permissive read (recommended) or one-time
   migration? Default: permissive.
4. **Visual style sketches** — design in-house or use a curated icon
   library (e.g. Heroicons / Phosphor + custom)? Default: in-house SVG
   sketches for visual style; library icons for imagery direction.
5. **Brand mood visuals** — include in v1 or defer to v2? Default: defer
   (lower leverage, more curation effort).

---

## Test plan

- [ ] Submit the form on desktop (all sections filled)
- [ ] Submit on a real phone (iOS Safari + Android Chrome)
- [ ] Fill half the form, close the tab, re-open — draft restored
- [ ] Submit a draft, admin requests changes, client resubmits with
      changes — draft + submitted states behave correctly
- [ ] Existing approved record (created before this upgrade) renders in
      summary and admin panel without errors
- [ ] Admin can review a submission containing the new taste sliders + new
      mood words + visuals
- [ ] All three locales (en/fr/es) render the form without missing-key
      errors

---

## After this ships

This puts the design-direction module at ~9/10 on its own. The path from 9
to a true 10/10 is to add the **"present 3 to pick" layer** on top — i.e.,
once the client submits this discovery, the studio (or the AI builder, once
Rung 1 ships) presents 2-3 curated visual directions and the client picks
one with a binding approval that feeds the decision log. That work is
tracked separately under "Track A / AI builder Rung 1."
