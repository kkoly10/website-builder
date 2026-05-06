# CrecyStudio Website Workspace — Design Direction Implementation Plan

**Document purpose:**  
This file defines how the **Design Direction** checkpoint should be designed and implemented inside the CrecyStudio client workspace for **website projects only**. Custom web apps, portals, e-commerce, automation, and rescue projects should get their own adapted versions later.

---

## 1. Why this exists

CrecyStudio currently has a client workspace with project status, milestones, assets, messages, revisions, invoices, preview links, launch readiness, agreement status, and handoff tracking. That is a strong foundation, but website clients still need one clearer step before the full build starts:

> **Design Direction Approval**

This checkpoint gives clients structured input into the look and feel without letting them micromanage typography, spacing, layouts, animations, and every UI decision.

The goal is:

> **Client chooses direction. CrecyStudio makes design decisions. Client approves the result.**

This matches common agency/studio practice. Agencies often use language such as **creative direction**, **visual direction**, **style tiles**, **moodboards**, **design concepts**, or **visual language**. Style Tiles are a known web-design deliverable that use fonts, colors, and interface elements to communicate the essence of a visual brand and create a shared visual language between designers and stakeholders. The Design Council's Double Diamond also supports moving through discovery/definition before developing and delivering the final design.

---

## 2. What Design Direction should NOT become

Do **not** turn this into a full design-control panel.

Clients should **not** choose:

- Exact font families from a giant picker
- Exact typography scale
- Button border radius
- Shadows, padding, margins, spacing systems
- Every page section order
- Animation style
- Component-level layout decisions
- Unlimited inspiration links
- “Mix concept A, B, and C together” style requests
- New brand direction after build has already started

The workspace should make the client feel involved, but not make the client the designer.

---

## 3. Where it belongs in the website timeline

Current broad milestone structure:

1. Kickoff & scope confirmation
2. Content/assets received
3. First build draft
4. Revision round
5. Launch & handoff

Recommended website milestone structure:

1. **Scope confirmed**
2. **Design direction approved**
3. **Content/assets received**
4. **First preview ready**
5. **Client feedback submitted**
6. **Revisions complete**
7. **Launch approved**
8. **Launch & handoff**

### Recommended default milestone constant

```ts
const DEFAULT_MILESTONES = [
  { title: "Scope confirmed", status: "todo", sort_order: 10 },
  { title: "Design direction approved", status: "todo", sort_order: 20 },
  { title: "Content/assets received", status: "todo", sort_order: 30 },
  { title: "First preview ready", status: "todo", sort_order: 40 },
  { title: "Client feedback submitted", status: "todo", sort_order: 50 },
  { title: "Revisions complete", status: "todo", sort_order: 60 },
  { title: "Launch approved", status: "todo", sort_order: 70 },
  { title: "Launch & handoff", status: "todo", sort_order: 80 },
];
```

### Timeline placement

Design Direction should unlock after:

- Scope/quote is approved, or
- Deposit is paid, depending on how strict the project workflow should be.

For most paid website projects:

> Deposit paid → Scope confirmed → Design Direction waiting on client → Design Direction approved/locked → Build begins

---

## 4. Client-facing workspace card

### Card title

**Design Direction**

### Card subtitle

> Choose the visual direction before the full website build begins.

### Card description

Use this copy:

> Design Direction helps us align on the look and feel before the full build begins. You choose the brand mood, visual style, tone, color preferences, and example websites. CrecyStudio then makes the professional design decisions around layout, spacing, typography, responsiveness, and visual hierarchy.

### Support copy

> You do not need to design the website yourself. Your role is to guide the direction. CrecyStudio’s role is to turn that direction into a polished, functional website.

---

## 5. Design Direction form fields

### A. Design control level

This is the most important field. It controls how involved the client wants to be.

| Option | Internal value | Description | Recommended tier |
|---|---|---|---|
| CrecyStudio-led direction | `crecystudio_led` | I trust CrecyStudio to choose the best visual direction based on my business, audience, and goals. | Starter |
| Guided direction | `guided_direction` | I want to give input and approve the direction before the full build. | Growth |
| Brand-guided build | `brand_guided` | I already have logo, colors, fonts, or brand guidelines. Please follow those. | Growth / Premium |
| Premium concept review | `premium_concept_review` | I want to compare up to 2 visual directions before full build. | Premium only |

Default:

```ts
controlLevel: "crecystudio_led"
```

Do **not** offer “I want to control all design details.”

---

### B. Brand mood

Client chooses up to 3.

Options:

```ts
const BRAND_MOOD_OPTIONS = [
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
];
```

Validation:

- Minimum: 1
- Maximum: 3

Client helper text:

> Pick up to 3 words that best describe how the website should feel.

---

### C. Visual style

Client chooses one primary direction.

Options:

```ts
const VISUAL_STYLE_OPTIONS = [
  "Clean & Professional",
  "Bold & Premium",
  "Warm & Friendly",
  "Modern & Tech",
  "Luxury / Editorial",
  "Local Business / Trust-first",
  "Creative / Portfolio-style",
];
```

Client helper text:

> Choose the closest overall design direction. CrecyStudio will refine the exact layout and visual system.

---

### D. Color guidance

Fields:

```ts
brandColorsKnown: "yes" | "no" | "not_sure";
preferredColors: string;
colorsToAvoid: string;
letCrecyChoosePalette: boolean;
```

Client copy:

> If you already have brand colors, share them. If not, CrecyStudio can choose a professional color direction based on your business and audience.

Do not add a full color palette builder at this stage.

---

### E. Typography feel

Client chooses one.

Options:

```ts
const TYPOGRAPHY_FEEL_OPTIONS = [
  "Modern and clean",
  "Elegant and premium",
  "Bold and strong",
  "Friendly and approachable",
  "Technical and minimal",
  "Follow existing brand fonts",
  "Let CrecyStudio choose",
];
```

Client helper text:

> This guides the feel of the typography. CrecyStudio will choose the exact font system.

Do not add a font picker.

---

### F. Imagery direction

Client chooses multiple.

Options:

```ts
const IMAGERY_DIRECTION_OPTIONS = [
  "Real photography",
  "Stock photography",
  "Founder/team photos",
  "Product/service photos",
  "Before/after images",
  "Icons",
  "Illustrations",
  "App screenshots/mockups",
  "Minimal imagery",
];
```

Client helper text:

> Choose the types of visuals that feel appropriate for your business.

---

### G. Reference websites

Fields:

```ts
likedWebsites: [
  {
    url: string;
    reason: string;
  }
];

dislikedWebsites: [
  {
    url: string;
    reason: string;
  }
];
```

Recommended UI:

- Up to 3 liked websites
- Up to 2 disliked websites

Helper text:

> Share what you like or dislike specifically: layout, colors, tone, photography, simplicity, premium feel, etc.

This prevents vague feedback like “make it pop.”

---

### H. Content tone

Client chooses one or two.

Options:

```ts
const CONTENT_TONE_OPTIONS = [
  "Professional",
  "Friendly",
  "Direct",
  "Luxury",
  "Technical",
  "Calm",
  "Inspirational",
  "Playful",
];
```

Helper text:

> This helps guide headlines, CTA language, and overall copy tone.

---

### I. Existing brand assets

Fields:

```ts
hasLogo: "yes" | "no" | "in_progress";
hasBrandGuide: "yes" | "no";
brandAssetsNotes: string;
```

Helper text:

> If you already have a logo, fonts, colors, or brand guide, upload them in the Assets section and mention them here.

---

### J. Client notes

Field:

```ts
clientNotes: string;
```

Helper text:

> Anything else CrecyStudio should know before choosing the design direction?

---

### K. Approval checkbox

Required before submission:

```ts
approvedDirectionTerms: boolean;
```

Approval copy:

> I approve this design direction. I understand CrecyStudio will make professional decisions around layout, spacing, typography, responsive behavior, and visual hierarchy based on this direction. Major style changes after approval may affect the timeline or require a change order.

---

## 6. Status model

Recommended statuses:

```ts
type DesignDirectionStatus =
  | "not_started"
  | "waiting_on_client"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "locked";
```

### Status meaning

| Status | Meaning |
|---|---|
| `not_started` | Design Direction is not available yet. |
| `waiting_on_client` | Client needs to complete the form. |
| `submitted` | Client submitted preferences. |
| `under_review` | CrecyStudio is reviewing the direction. |
| `changes_requested` | CrecyStudio needs clarification or updated input. |
| `approved` | Direction has been accepted. |
| `locked` | Build has started; major visual changes require change order/timeline adjustment. |

### Client status messages

#### Waiting on client

> Action needed: Choose your design direction.  
> Before the full build starts, choose the visual direction that best matches your business.

#### Submitted

> Design direction submitted.  
> CrecyStudio is reviewing your direction and will lock the visual path before the build begins.

#### Changes requested

> Clarification needed.  
> CrecyStudio needs a little more detail before the direction can be locked.

#### Approved

> Design direction approved.  
> CrecyStudio will use this direction to guide the design system and first preview.

#### Locked

> Design direction locked.  
> Your project is now in build. Major visual direction changes may affect timeline or require a change order.

---

## 7. Data model

### Recommended MVP storage

For the first version, store Design Direction inside:

```ts
customer_portal_projects.scope_snapshot.designDirection
```

This avoids creating a new table immediately and fits the existing `scope_snapshot` workflow.

### Suggested TypeScript shape

```ts
type WebsiteDesignDirection = {
  status:
    | "not_started"
    | "waiting_on_client"
    | "submitted"
    | "under_review"
    | "changes_requested"
    | "approved"
    | "locked";

  controlLevel:
    | "crecystudio_led"
    | "guided_direction"
    | "brand_guided"
    | "premium_concept_review";

  brandMood: string[];
  visualStyle: string;

  brandColorsKnown: "yes" | "no" | "not_sure";
  preferredColors: string;
  colorsToAvoid: string;
  letCrecyChoosePalette: boolean;

  typographyFeel: string;
  imageryDirection: string[];

  likedWebsites: {
    url: string;
    reason: string;
  }[];

  dislikedWebsites: {
    url: string;
    reason: string;
  }[];

  contentTone: string[];
  hasLogo: "yes" | "no" | "in_progress";
  hasBrandGuide: "yes" | "no";
  brandAssetsNotes: string;
  clientNotes: string;

  approvedDirectionTerms: boolean;

  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  lockedAt: string | null;
  changesRequestedAt: string | null;

  adminPublicNote: string | null;
  adminInternalNote?: string | null;
};
```

### Default value

```ts
const DEFAULT_WEBSITE_DESIGN_DIRECTION: WebsiteDesignDirection = {
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
```

---

## 8. Longer-term database option

Later, if this becomes central to operations, create a dedicated table.

```sql
create table customer_portal_design_direction (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references customer_portal_projects(id) on delete cascade,

  status text not null default 'waiting_on_client',
  control_level text not null default 'crecystudio_led',

  brand_mood text[] default '{}',
  visual_style text,

  brand_colors_known text default 'not_sure',
  preferred_colors text,
  colors_to_avoid text,
  let_crecy_choose_palette boolean default true,

  typography_feel text,
  imagery_direction text[] default '{}',

  liked_websites jsonb default '[]'::jsonb,
  disliked_websites jsonb default '[]'::jsonb,

  content_tone text[] default '{}',
  has_logo text default 'no',
  has_brand_guide text default 'no',
  brand_assets_notes text,
  client_notes text,

  approved_direction_terms boolean default false,

  admin_public_note text,
  admin_internal_note text,

  submitted_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  locked_at timestamptz,
  changes_requested_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

For now, use the MVP storage approach unless reporting/querying becomes important.

---

## 9. API design

### Client submit action

Add a new portal action:

```ts
type: "design_direction_submit"
```

Payload:

```ts
{
  type: "design_direction_submit",
  designDirection: {
    controlLevel,
    brandMood,
    visualStyle,
    brandColorsKnown,
    preferredColors,
    colorsToAvoid,
    letCrecyChoosePalette,
    typographyFeel,
    imageryDirection,
    likedWebsites,
    dislikedWebsites,
    contentTone,
    hasLogo,
    hasBrandGuide,
    brandAssetsNotes,
    clientNotes,
    approvedDirectionTerms
  }
}
```

Server behavior:

1. Validate token.
2. Reject demo workspace.
3. Validate required fields.
4. Validate max brand mood count.
5. Validate URLs.
6. Merge into `scope_snapshot.designDirection`.
7. Set status to `submitted`.
8. Set `submittedAt`.
9. Add activity event `design_direction_submitted`.
10. Return updated portal bundle.

### Admin actions

Add internal/admin actions:

```ts
design_direction_mark_under_review
design_direction_request_changes
design_direction_approve
design_direction_lock
```

#### Approve behavior

When admin approves:

1. Set status to `approved`.
2. Set `approvedAt`.
3. Add admin public note if provided.
4. Log `design_direction_approved`.

#### Lock behavior

When admin locks:

1. Set status to `locked`.
2. Set `lockedAt`.
3. Mark milestone **Design direction approved** as done.
4. Change `waitingOn` to CrecyStudio build step.
5. Log `design_direction_locked`.

---

## 10. Activity feed events

Add these events:

```ts
design_direction_requested
design_direction_submitted
design_direction_under_review
design_direction_changes_requested
design_direction_approved
design_direction_locked
```

Example activity summaries:

```ts
{
  eventType: "design_direction_submitted",
  summary: "Client submitted website design direction."
}
```

```ts
{
  eventType: "design_direction_locked",
  summary: "Design direction was approved and locked for the build."
}
```

---

## 11. Client UI layout

### Card states

#### Waiting state

Show:

- Title: Design Direction
- Description
- CTA: Complete Design Direction
- Status pill: Waiting on client

#### Form state

Sections:

1. Design control level
2. Brand mood
3. Visual style
4. Color guidance
5. Typography feel
6. Imagery direction
7. Reference websites
8. Content tone
9. Brand assets
10. Notes
11. Approval checkbox

#### Submitted summary state

Show a clean summary:

| Field | Value |
|---|---|
| Direction | CrecyStudio-led |
| Mood | Premium, Clean, Trustworthy |
| Style | Clean & Professional |
| Colors | Navy, white, gold |
| Colors to avoid | Neon colors |
| Typography | Modern and clean |
| Imagery | Real photography, icons |
| Tone | Professional, direct |
| Liked sites | Example URLs |
| Status | Submitted / Approved / Locked |

#### Locked state

Show:

> Design direction is locked. Feedback should now focus on content accuracy, clarity, missing information, bugs, and functionality. Major visual style changes may affect timeline or require a change order.

---

## 12. Admin UI layout

Inside the admin quote/project detail page, add a section:

## Design Direction

Admin should see:

- Status
- Control level
- Brand mood
- Visual style
- Color preferences
- Typography feel
- Imagery direction
- Reference websites
- Content tone
- Client notes
- Existing brand asset notes
- Approval terms accepted
- Submitted timestamp
- Approved timestamp
- Locked timestamp

Admin buttons:

- Mark under review
- Request changes
- Approve direction
- Approve & lock direction
- Add public note
- Add internal note

### Admin public note examples

> Direction looks clear. I will use this to guide the first preview.

> I need one more example website before locking the direction.

> Direction approved and locked. The project is moving into build.

---

## 13. Tier rules

### Starter website — $1,800 to $2,400

Include:

- CrecyStudio-led direction only
- Client can provide mood, examples, and colors to avoid
- No multiple concepts
- No separate moodboard round

Workspace copy:

> Starter projects include CrecyStudio-led design direction. You provide brand mood, references, and preferences. CrecyStudio chooses the final visual system.

### Growth website — $3,500 to $4,500

Include:

- Guided design direction
- Client completes full Design Direction form
- You approve and lock direction before build
- One direction, not multiple full concepts

Workspace copy:

> Growth projects include guided design direction. Your preferences shape the visual system before the first preview is built.

### Premium website — $6,500 to $10,000+

Include:

- Up to 2 visual directions before full build
- More detailed creative direction review
- Optional style tile/moodboard summary
- Stronger brand/content strategy

Workspace copy:

> Premium projects may include up to two visual directions before the full build. Once one direction is approved, the design is locked for production.

---

## 14. Revision protection copy

Put this near the feedback/revision area:

> Please submit feedback in one complete batch per revision round. Feedback after the design direction is locked should focus on content accuracy, clarity, missing information, functionality, and reasonable polish. Major changes to the approved visual style may require a timeline adjustment or change order.

Also add:

> Design Direction approval does not lock every small visual detail. It locks the overall creative lane so the project can move forward without repeated redesign.

---

## 15. Waiting-on logic

Update `deriveWaitingOn` logic conceptually:

```ts
if (depositStatus !== "paid") return "Client deposit step";
if (designDirection.status === "waiting_on_client") return "Client design direction";
if (designDirection.status === "submitted") return "CrecyStudio design direction review";
if (designDirection.status === "changes_requested") return "Client design clarification";
if (assetsCount === 0) return "Client assets / content";
if (previewUrl && clientReviewStatus === "Pending review") return "Client preview review";
if (clientReviewStatus === "Changes requested") return "CrecyStudio revisions";
return "CrecyStudio next build step";
```

This makes the workspace more useful because the client knows exactly what is blocking progress.

---

## 16. Validation rules

### Required fields

For all website projects:

- `controlLevel`
- At least 1 `brandMood`
- `visualStyle`
- `typographyFeel`
- At least 1 `contentTone`
- `approvedDirectionTerms === true`

### Optional fields

- Preferred colors
- Colors to avoid
- Imagery direction
- Liked websites
- Disliked websites
- Brand assets notes
- Client notes

### URL validation

Reference websites should be valid `http` or `https` URLs.

If invalid:

> Please enter a valid website URL starting with https:// or http://.

### Brand mood limit

If more than 3:

> Choose up to 3 brand mood words so the direction stays focused.

---

## 17. Recommended implementation phases

### Phase 1 — Client UI MVP

- Add Design Direction card to `PortalClient`.
- Show form when status is `waiting_on_client` or `changes_requested`.
- Show summary when submitted/approved/locked.
- Add design locked copy.

### Phase 2 — Save to scope snapshot

- Add `design_direction_submit` action to `/api/portal/[token]/route.ts`.
- Save into `customer_portal_projects.scope_snapshot.designDirection`.
- Return updated bundle.

### Phase 3 — Update milestones

- Replace default milestones with the new 8-step website milestone structure.
- Existing projects can keep old milestones unless regenerated manually.

### Phase 4 — Admin controls

- Add admin section to review submitted direction.
- Add approve, lock, request changes, and notes controls.

### Phase 5 — Activity feed

- Add design direction events.
- Show submitted/approved/locked events in project activity.

### Phase 6 — Tier-based behavior

- Starter: CrecyStudio-led only
- Growth: guided direction
- Premium: two-direction option

---

## 18. Suggested file changes

Likely files to touch:

```txt
lib/customerPortal.ts
app/portal/[token]/PortalClient.tsx
app/api/portal/[token]/route.ts
app/api/internal/portal/admin-update/route.ts
messages/en.json
messages/fr.json
messages/es.json
app/internal/admin/...project detail route/page if applicable
```

Optional new files:

```txt
lib/designDirection.ts
components/portal/DesignDirectionCard.tsx
components/portal/DesignDirectionSummary.tsx
```

Recommended approach:

- Put constants/types/helpers in `lib/designDirection.ts`.
- Keep `PortalClient` from becoming too large by extracting `DesignDirectionCard`.
- Keep form options centralized so admin/client translations stay consistent.

---

## 19. Suggested component structure

```txt
components/portal/
  DesignDirectionCard.tsx
  DesignDirectionForm.tsx
  DesignDirectionSummary.tsx
  DesignDirectionStatusPill.tsx
```

### Props

```ts
type DesignDirectionCardProps = {
  value: WebsiteDesignDirection;
  tier: string;
  saving: boolean;
  onSubmit: (value: WebsiteDesignDirectionSubmitInput) => Promise<void>;
};
```

---

## 20. Client-facing copy block

Use this in the actual workspace:

> **Design Direction**
>
> Before we begin the full website build, choose the visual direction that best fits your business. You do not need to choose technical design details like exact fonts, spacing, layouts, or animations. CrecyStudio will use your input to make professional decisions around the final visual system.

After approval:

> **Design Direction Approved**
>
> Your design direction has been approved. CrecyStudio will use this direction to guide the first preview, including layout, typography, color usage, spacing, visual hierarchy, and mobile behavior.

After lock:

> **Design Direction Locked**
>
> Your project is now in build. Feedback should focus on content accuracy, clarity, missing information, bugs, and functionality. Major changes to the approved visual style may affect the timeline or require a change order.

---

## 21. Acceptance criteria

Design Direction is complete when:

- Client can submit a design direction form from the workspace.
- The form saves successfully.
- The workspace shows a clean submitted summary.
- Admin can review the submitted direction.
- Admin can approve and lock the direction.
- The “Design direction approved” milestone can be marked complete.
- The activity feed records submission and approval.
- Waiting-on logic reflects whether the project is waiting on client or CrecyStudio.
- Locked copy clearly protects against late-stage redesign.
- Starter/Growth/Premium behavior is tier-aware.

---

## 22. Final operating rule

Use this rule internally:

> **Design Direction is not a design menu. It is a decision checkpoint.**

The client chooses the lane. CrecyStudio drives the design.

---

## 23. References

- Design Council — Framework for Innovation / Double Diamond: https://www.designcouncil.org.uk/our-work/skills-learning/tools-frameworks/framework-for-innovation-design-councils-evolved-double-diamond/
- Style Tiles — Visual Web Design Process for Clients & Responsive Web: https://styletil.es/
- Digital.gov — Establishing a common visual language / Style tiles: https://digital.gov/guides/research-collaboration/designing/visual-language
- Digital.gov — Wireframes: https://digital.gov/guides/research-collaboration/designing/wireframing
- Open Design Kit — Style Tiles: https://opendesignkit.org/methods/style-tiles/
