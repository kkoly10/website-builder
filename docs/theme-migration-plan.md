# Theme Migration Plan

## 1) Prototype design tokens extracted

### Color system
- **Paper background:** `#f3ede1` (primary), `#ebe4d4`, `#e3dcc8`, `#ddd5be` for layered surfaces.
- **Ink text:** `#0c0c0c` primary, `#1a1a1a` secondary.
- **Muted text:** `#6b6457`, `#8a8273`.
- **Rules/borders:** `#d8cfba`, `#c8bfaa`.
- **Brand accent:** `#c2381f` (signal red), with soft variants `#e8c4ba`, `#f4dfd9`.
- **Status accents (product):** success green (`#2d5016`) and success surface (`#d9e3c8`).

### Typography
- **Display:** Inter Tight (bold/semi-bold, tight tracking for headlines).
- **Body:** Inter.
- **Meta/labels:** JetBrains Mono (all-caps metadata labels, breadcrumbs, status).

### Spacing / shape / motion
- 4px baseline spacing scale and roomy section spacing.
- Mostly low-radius corners (`2px–6px`) vs prior pill-heavy style.
- Hairline borders and rule separators as a core motif.
- Subtle transitions (`~0.2s`) and reveal-on-scroll; no heavy animation library.

## 2) Shared patterns to build once and reuse
- Global **tokenized theme** in `app/globals.css`.
- Shared shell primitives: `container`, `section`, `kicker`, `h1/h2/h3`, `btn`, `panel`, `card`, `metaLabel`.
- Marketing and product expressions via body/data selectors and utility classes:
  - `.marketingPage` for editorial/public pages.
  - `.productPage` for portal/workspace/internal pages.
- Shared React interactive modules:
  - `ProblemSwitcher`
  - `WorkspaceStory`
  - `PricingExplorer`
  - upgraded FAQ accordion behavior

## 3) Route/component mapping from prototypes to app
- `crecystudio-prototype-b.html` → `app/page.tsx` (homepage hierarchy + interactions).
- `crecystudio-websites-page.html` → `components/service-page/ServicePage.tsx` + `/websites` data rendering.
- `crecystudio-portal-prototype.html` + `crecystudio-project-workspace.html` → `/portal`, `/portal/[token]`, portal visual language in globals.
- `crecystudio-messaging-prototype.html` → messaging/thread UI classes used by portal client areas.
- `crecystudio-post-quote.html` → quote/estimate handoff visual language for post-intake/product surfaces.

## 4) Marketing vs product ownership
- **Marketing:** `/`, `/websites`, `/process`, `/faq`, `/contact`, `/privacy`, `/terms`, service pages.
- **Product/app:** `/portal`, `/portal/[token]`, internal/admin views, quote/project workspaces, messaging-like surfaces.
- Both share tokens, typography, and button patterns; product prioritizes clarity and dense state communication.

## 5) React interactions to implement
- Homepage `ProblemSwitcher` (problem-led lane prioritization).
- Homepage `WorkspaceStory` milestone journey with active step state.
- Homepage `PricingExplorer` tabbed/segmented estimate exploration.
- FAQ details enhancements (clear open/close affordance + focus states).
- Keep existing `ScrollReveal` + reduced-motion-safe CSS transitions.

## 6) File-by-file migration map

### Edit
- `app/globals.css` (new token system + dual expression foundation).
- `app/layout.tsx` (nav shell classes preserved, visual expression updated).
- `app/page.tsx` and `app/home.module.css` (website-first homepage migration).
- `components/service-page/ServicePage.tsx`
- `components/service-page/service-page.module.css`
- `components/site/SiteFooter.tsx`
- `app/process/page.tsx`
- `app/faq/page.tsx`
- `app/contact/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`

### Create
- `components/home/ProblemSwitcher.tsx`
- `components/home/problem-switcher.module.css`
- `components/home/WorkspaceStory.tsx`
- `components/home/workspace-story.module.css`
- `components/home/PricingExplorer.tsx`
- `components/home/pricing-explorer.module.css`
- `docs/theme-migration-summary.md` (delivery summary)

### Intentionally untouched (logic-critical)
- Auth logic in root layout and login flows.
- Portal access routing, including `app/portal/[token]` behavior.
- API routes, quote calculations, Supabase auth/admin checks.

## 7) Highest-priority routes and rationale
1. `/` homepage — primary revenue page; must be website-first and interactive.
2. `/websites` and shared service page system — core acquisition lane.
3. `/process`, `/faq`, `/contact`, `/privacy`, `/terms` — trust/compliance and conversion support pages.
4. `/portal` and `/portal/[token]` visual integration — preserve functionality while aligning product expression.
