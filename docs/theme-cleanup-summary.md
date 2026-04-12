# Theme Cleanup Summary

## What was fixed
- Completed a focused token coherence pass by removing stale legacy variable usage from key product/admin surfaces and normalizing them to paper/ink token variables.
- Added an explicit compatibility alias layer in `app/globals.css` so any remaining low-risk legacy references still resolve consistently during transition.
- Introduced shared support-page and product-surface primitives in global styles to reduce repeated one-off style objects and align visual framing.
- Polished support pages (`/process`, `/faq`, `/contact`, `/privacy`, `/terms`) so they read as intentional themed pages rather than minimally migrated pages.

## Files changed
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
- `docs/theme-cleanup-pass.md`

## Stale tokens / legacy patterns removed
- Replaced stale token references like `--fg`, `--panel`, `--panel2`, `--stroke`, `--stroke2`, `--muted2`, `--accentSoft`, and `--accentStroke` in target migration files with paper/ink token equivalents.
- Reduced scattered layout inline styles in support pages by introducing and applying shared classes (`marketingStackLg`, `marketingActions`, `marketingBody`, `faqSummary`, `faqAnswer`).

## Product-side improvements
- Added reusable product framing utilities in global CSS (`productWrap`, `productGrid3`, `productSection`, `productList`, `productCard`, `productChip`, `productEmpty`, `productBtnSm`).
- Applied these primitives to `app/portal/page.tsx` for lane summary cards, section framing, empty states, and CTA button sizing consistency.
- Kept portal/admin business logic, auth routing, and dynamic route behavior unchanged.

## Support-page improvements
- Updated process/FAQ/contact/privacy/terms pages to use shared spacing/actions/body primitives.
- Reduced avoidable inline styles while preserving routes, metadata, and existing CTA destinations.
- Maintained alignment with the migrated homepage/service visual language.

## Validation
- `npm run lint` passed.
- `npm run build` passed.
