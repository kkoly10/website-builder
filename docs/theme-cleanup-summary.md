# Theme Cleanup Summary

Date: 2026-04-13

## What was fixed

- Completed a focused migration cleanup on targeted product and support surfaces while preserving all routing/auth/workflow behavior.
- Reduced repeated inline styling and standardized key UI regions with shared product primitives in global CSS.
- Improved support page design consistency by introducing a shared support page shell.

## Files changed

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
- `docs/theme-cleanup-pass.md`

## Stale tokens / legacy patterns removed

- On this cleanup scope, targeted files were aligned to paper/ink token usage and no longer rely on old alias variables.
- Added stronger shared classes for product/app surfaces and form controls so token usage is centralized in CSS instead of scattered inline objects.
- Kept the compatibility aliases in `:root` intentionally for untouched legacy surfaces outside this focused pass.

## Product-side improvements

- Portal index (`/portal`) now uses reusable project/lane card composition rather than repeated per-lane inline style blocks.
- Admin pipeline and project control stats/sections now leverage common card/label primitives for cleaner product expression.
- E-commerce intake review rows and shell spacing now use reusable product classes.
- Added reusable product primitives for:
  - panel framing,
  - drawer/toggle rows,
  - form field presentation,
  - lane summary cards,
  - project summary blocks.

## Support-page improvements

- Added `SupportPageShell` and refactored Process/FAQ/Contact/Privacy/Terms pages to use it.
- Unified kicker/title/description/CTA rhythm across support pages.
- Reduced support page duplication and improved visual consistency with the homepage/service expression.

## Validation

- `npm run lint` passed.
- `npm run build` passed.
