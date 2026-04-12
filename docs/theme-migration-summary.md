# Theme Migration Summary

## What changed
- Replaced the global visual language with the new prototype-inspired token system (paper/ink/accent, Inter Tight + Inter + JetBrains Mono), and updated shared shell primitives for nav, typography, cards, panels, buttons, footer, and motion behavior.
- Rebuilt the homepage as a **website-first sales page** with a stronger hero, trust strip, problem-led interactive selection, workspace journey interaction, pricing explorer interaction, FAQ preview, and secondary links.
- Refreshed service page styling to match the new design system while preserving existing data-driven content and route behavior.
- Updated supporting public pages (`/process`, `/faq`, `/contact`, `/privacy`, `/terms`) into the new marketing expression.
- Aligned portal/product visual primitives in global CSS for a clearer product expression without touching auth/portal access logic.

## Components created
- `components/home/ProblemSwitcher.tsx`
- `components/home/WorkspaceStory.tsx`
- `components/home/PricingExplorer.tsx`
- Supporting CSS modules for each interactive homepage component.

## Pages migrated
- `/` homepage
- `/websites` (via shared service-page system restyle)
- `/process`
- `/faq`
- `/contact`
- `/privacy`
- `/terms`

## Preserved intentionally
- Existing URLs and route structure.
- Root auth-aware layout behavior.
- Portal entry behavior and tokenized dynamic portal routing (`/portal/[token]`).
- Existing CTA destinations and tracking hooks used on primary homepage CTAs.
- Existing business logic and data flow in portal/admin/API routes.

## Still left to refine
- Deeper page-by-page product-surface polish (especially very dense portal/admin sub-screens) can be expanded with additional component extraction.
- More portal-specific interaction states (drawers, upload micro-states, messaging refinements) can be incrementally layered on top of this base system.
