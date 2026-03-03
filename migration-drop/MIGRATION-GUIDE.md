# Phase 2 Migration Guide

## What Changed and Why

### 1. Typography: Plus Jakarta Sans
System fonts say "I didn't make a choice." Plus Jakarta Sans is clean, modern, geometric, and has excellent weight range (400-800). It is distinctive without being weird. The font is imported via Google Fonts at the top of globals.css and applied through --font-display and --font-body variables.

### 2. Spacing Scale (8-point)
Every spacing value now maps to one of 8 tokens:

- --sp-2 = 4px (tiny gaps, icon margins)
- --sp-4 = 8px (pill gaps, tight spacing)
- --sp-8 = 16px (card padding, element gaps)
- --sp-12 = 24px (section inner spacing)
- --sp-16 = 32px (section header margins)
- --sp-24 = 48px (section padding, default)
- --sp-32 = 64px (large section padding)
- --sp-48 = 96px (hero top padding)

Rule: Never use a raw pixel value for margin or padding. Always use a spacing token.

### 3. Inline Styles to Classes
The old page.tsx had around 50 inline style declarations. The new one has ZERO. Here are the key mappings:

- Hero section padding/centering -> .heroSection
- Hero max-width container -> .heroContainer
- Hero subtitle sizing -> .heroSubtitle
- CTA button rows -> .heroActions
- Centered pills -> .pills .heroPills or .pillsCenter
- Section headers -> .sectionHead
- Section intros (narrow centered) -> .sectionIntro
- Banded background sections -> .sectionBand
- Stretched grid -> .grid2stretch
- 4-column auto grid -> .grid4
- Service cards (tall flex) -> .serviceCard, .serviceCardBody, .serviceCardTitle, .serviceCardDesc, .serviceCardList, .serviceCardPills, .serviceCardCta
- Image cards -> .cardMedia, .cardMediaBody, .cardMediaTitle, .cardMediaDesc
- Process cards -> .processCard, .processNum, .processTitle
- Testimonial cards -> .testimonialCard, .testimonialQuote, .testimonialAuthor, .testimonialRole
- Bottom CTA card -> .ctaCard
- Large buttons -> .btnLg

### 4. Scroll Animations
Three animation classes are available:

- .fadeUp: fades in and slides up 24px. Use on most section content.
- .heroFadeUp: bigger motion (32px), slower. Use only in hero.
- .scaleIn: fades in and scales from 96%. Good for cards.

Elements start invisible. The ScrollReveal component uses IntersectionObserver to add .inView when an element enters the viewport. The animation plays once.

Staggering: Add .stagger-1 through .stagger-4 to delay sibling animations sequentially (60ms increments).

Setup: Import ScrollReveal once per page:

```tsx
import ScrollReveal from "@/components/site/ScrollReveal";
// Inside component return:
<ScrollReveal />
```

### 5. Enhanced Interactions
- Card hover now includes an orange glow (--shadow-glow)
- Buttons have :active states for a tactile press feel
- Image cards have a subtle zoom on hover
- Mobile menu slides in with a keyframe animation
- Focus states on inputs have smooth transitions


## Migrating Other Pages

### Systems page (/systems)
1. Replace hero inline styles with .heroSection or create .systemsHero
2. Replace section headers with .sectionHead
3. Replace border-top sections with .sectionBand
4. Replace all inline flex/grid with utility classes
5. Wrap sections in .fadeUp or .scaleIn
6. Add ScrollReveal at top

### Build/Intro page (/build/intro)
1. Replace inline padding/margin with spacing tokens
2. Quiz option cards use .card + .cardHover
3. Add entrance animations to quiz steps

### FAQ page (/faq)
1. Use .sectionHead for the page title
2. FAQ items use .card styling
3. Add .fadeUp with staggering to each FAQ item

### General rules for any page
- No style={{}} prop unless truly dynamic (computed at runtime)
- No raw pixel values, always use a spacing token
- Every section gets a .fadeUp or .scaleIn
- Every section header uses .sectionHead
- Every banded section uses .sectionBand


## File Placement

```
app/
  globals.css          <- replace with new globals.css
  page.tsx             <- replace with new page.tsx
  layout.tsx           <- no changes needed

components/
  site/
    ScrollReveal.tsx   <- new file
    SiteFooter.tsx     <- no changes needed
  brand/
    BrandLogo.tsx      <- no changes needed
```

## Quick Checklist
- Replace globals.css
- Replace app/page.tsx
- Add components/site/ScrollReveal.tsx
- Test on desktop and mobile
- Verify font loads (Plus Jakarta Sans)
- Apply same pattern to /systems page
- Apply same pattern to /build/intro page
- Apply same pattern to /faq page
- Search codebase for remaining style={{ and migrate them
