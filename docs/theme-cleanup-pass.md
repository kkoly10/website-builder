# Theme Cleanup Pass (Prototype Theme Migration)

Date: 2026-04-13

## 1) Remaining migration gaps (audit)

- Product/app surfaces were still heavily inline-styled in portal/admin/e-commerce intake flows, reducing consistency and reuse.
- Support pages used mixed layout patterns and did not share a common shell, so visual quality varied compared with the homepage.
- Shared product primitives (panel framing, drawer rows, form fields, chips, summary cards) were inconsistent or missing in global styles.
- Token migration status:
  - Core paper/ink tokens are active.
  - Legacy aliases still exist in `app/globals.css` as a deliberate compatibility layer for untouched legacy surfaces.
  - The focused cleanup targets were migrated to paper/ink-first usage and shared primitives.

## 2) Files with stale token usage (inspected)

Inspected specifically for old variable aliases (`--fg`, `--stroke`, `--panel`, `--muted2`, etc.) and theme mismatch risk:

- `app/portal/page.tsx` (no stale alias usage; refactored to shared product primitives)
- `app/portal/[token]/PortalClient.tsx` (paper/ink tokens used; no stale alias usage)
- `app/internal/admin/AdminPipelineClient.tsx` (paper/ink tokens used; no stale alias usage)
- `app/internal/admin/[id]/ProjectControlClient.tsx` (paper/ink tokens used; no stale alias usage)
- `app/ecommerce/intake/page.tsx` (paper/ink tokens used; no stale alias usage)

## 3) Files needing product-expression cleanup

- `app/portal/page.tsx` (lane/project card consistency, reduced inline style load)
- `app/internal/admin/AdminPipelineClient.tsx` (metric/admin panel framing via shared primitives)
- `app/internal/admin/[id]/ProjectControlClient.tsx` (stat cards aligned to product primitives)
- `app/ecommerce/intake/page.tsx` (review rows and shell spacing moved toward shared classes)
- `app/globals.css` (expanded product/app primitives)

## 4) Files needing support-page polish

- `app/process/page.tsx`
- `app/faq/page.tsx`
- `app/contact/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- plus shared shell component: `components/site/SupportPageShell.tsx`

## 5) Exact file list edited in this pass

- `app/globals.css`
- `app/portal/page.tsx`
- `app/internal/admin/AdminPipelineClient.tsx`
- `app/internal/admin/[id]/ProjectControlClient.tsx`
- `app/ecommerce/intake/page.tsx`
- `app/process/page.tsx`
- `app/faq/page.tsx`
- `app/contact/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `components/site/SupportPageShell.tsx`
