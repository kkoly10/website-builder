# Theme Cleanup Pass Audit

## Remaining migration gaps
- Product/app surfaces still rely heavily on legacy variable names (`--fg`, `--panel`, `--stroke`, `--muted2`) and dense inline style objects.
- Portal and admin experiences use repeated panel/card/chip framing patterns without shared product-surface primitives.
- Supporting public pages (`/process`, `/faq`, `/contact`, `/privacy`, `/terms`) are functional but still minimally restyled with avoidable inline style blocks.
- Token usage is inconsistent between paper/ink token definitions in `app/globals.css` and app/product pages that still reference old variable names.

## Files with stale token usage
- `app/portal/page.tsx`
- `app/portal/[token]/PortalClient.tsx`
- `app/internal/admin/AdminPipelineClient.tsx`
- `app/internal/admin/[id]/ProjectControlClient.tsx`
- `app/ecommerce/intake/page.tsx`

## Files needing product-expression cleanup
- `app/portal/page.tsx`
- `app/portal/[token]/PortalClient.tsx`
- `app/internal/admin/AdminPipelineClient.tsx`
- `app/internal/admin/[id]/ProjectControlClient.tsx`
- `app/ecommerce/intake/page.tsx`
- `app/globals.css` (shared product primitives)

## Files needing support-page polish
- `app/process/page.tsx`
- `app/faq/page.tsx`
- `app/contact/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`

## Exact file list to edit in this cleanup pass
- `app/globals.css`
- `app/portal/page.tsx`
- `app/portal/[token]/PortalClient.tsx`
- `app/internal/admin/AdminPipelineClient.tsx`
- `app/internal/admin/[id]/ProjectControlClient.tsx`
- `app/ecommerce/intake/page.tsx`
- `app/process/page.tsx`
- `app/faq/page.tsx`
- `app/contact/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `docs/theme-cleanup-summary.md`
