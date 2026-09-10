# CrecyStudio — Brand & Design System

The reference for the CrecyStudio visual identity. Machine-readable copies live
in `tokens.css` and `tokens.json` — **change all three together, or none.**

`tokens.css` is the single source of truth for every value. `app/globals.css`
may only *alias* a token defined there; it must never invent a value.

**Positioning:** an independent studio that ships real systems — websites,
custom web apps, SaaS, AI integration. The site is the portfolio, so it has to
look like the work.

---

## 0. Why this system exists

The previous palette had drifted off the brand entirely:

| | Logo masters | Site before this system |
| --- | --- | --- |
| Ink | `#1a1210` warm near-black | `#0d0d0d` (OpenAI's exact) |
| Accent | `#c43e2b` vermilion | `#a8362b` muted burnt red |
| Muted | `#8a7d74` warm taupe | `#6e6e73` (Apple's exact) |
| Surfaces | — | `#f5f5f7`, `#e5e5e7`, `#d2d2d7` (Apple's exact) |
| Wordmark face | Sora | Inter |

`globals.css` carried those greys with `/* Apple's exact */` written next to
them. Borrowed neutrals plus a single face plus `--shadow: none` is the default
look of an AI-generated landing page — which is precisely why the site read as
generic. **This system puts CrecyStudio back in its own clothes.**

---

## 1. Logo suite

Masters live in `crecysstudio svglogo.zip` (`svg-crecy/`).

| Asset | File | Use |
| --- | --- | --- |
| Horizontal, light bg | `crecy-d1-horizontal-light.svg` | Default: site header, invoices, email signature |
| Horizontal, dark bg | `crecy-d1-horizontal-dark.svg` | On `--cs-ink` or dark imagery |
| Stacked | `crecy-d1-stacked-*.svg` | Square-ish placements |
| Lockup, tracked caps | `crecy-d3-*.svg` | Wide, short spaces |
| Icon / mark | `crecy-icon.svg` | Favicon, app icon, avatar |
| Mono | `crecy-mono-black.svg`, `crecy-mono-white.svg` | One-colour reproduction |

The mark is a cursor arrow with a vermilion dot at its foot. The dot is the
only place pure `--cs-accent` appears in the logo — **never recolour it,** and
never set the wordmark in a face other than Sora.

**Clear space:** the height of the "c" in *crecy* on all four sides.
**Minimum size:** horizontal lockup 150px wide; icon 24px.

---

## 2. Colour

Every value below is verified for contrast, not assumed. Ratios are computed
against the surface named.

### Ink — warm near-black
| Token | Hex | Use | On paper |
| --- | --- | --- | --- |
| `--cs-ink` | `#1a1210` | Headlines, primary text, dark panels | 17.88 |
| `--cs-ink-2` | `#33251f` | Body copy | 14.27 |
| `--cs-ink-3` | `#5c4a42` | Supporting copy | 8.09 |
| `--cs-muted` | `#76675d` | Labels, captions, footer links | 5.26 |
| `--cs-muted-2` | `#958378` | **Large text and UI only** — never body | 3.51 |
| `--cs-brand-taupe` | `#8a7d74` | **Wordmark only** — fails AA at small sizes | 3.86 |

The logo's taupe is too light for small text. It is preserved exactly for the
wordmark; the text ramp is a darker, slightly warmer relative of it.

### Accent — vermilion
| Token | Hex | Use |
| --- | --- | --- |
| `--cs-accent` | `#c43e2b` | The brand accent. Used **sparingly**. |
| `--cs-accent-600` | `#a83324` | Hover / pressed |
| `--cs-accent-700` | `#8c2a1e` | Accent text on `--cs-wash` (7.62) |
| `--cs-accent-300` | `#e8907f` | Rules and quiet marks on dark (7.67 on ink) |
| `--cs-accent-on-ink` | `#d55340` | Accent **text** on dark panels (4.52 on ink) |
| `--cs-wash` | `#fbf0ec` | Tinted card / badge background |

Pure `--cs-accent` is 3.58 on `--cs-ink` — large display and marks only there.
For accent text on a dark panel use `--cs-accent-on-ink`.

**Sparingly means sparingly.** One accent element per viewport is the target:
the primary button, *or* a live indicator, *or* one emphasised word in a
headline. An accent-coloured icon in all eight service cards is not restraint,
it is decoration, and it is how the accent stops meaning anything.

### Paper — warm off-white
| Token | Hex | Use |
| --- | --- | --- |
| `--cs-paper` | `#fdfbf9` | Page canvas |
| `--cs-paper-2` | `#f7f3ef` | Section break |
| `--cs-paper-3` | `#efe9e3` | Tertiary surface |
| `--cs-surface` | `#ffffff` | Cards and fields — they sit *above* the canvas |

**The canvas is never pure white.** White is reserved for surfaces that should
read as lifted off the page. A pure-white canvas with white cards has no depth,
which is why the old site needed a border around everything.

### Rules and status
`--cs-rule` `#e7ded7` · `--cs-rule-2` `#d5c8bf` · `--cs-rule-on-ink`
`rgba(253,251,249,.16)`. Rules are **warm** — a neutral grey hairline on warm
paper reads as a dirty edge.

Success `#2f6d3a` on `#e9f2e7` · Warning `#9a6212` on `#fbf1e0` ·
Error `#b3261e` on `#fbeae8`. All ≥ 4.5.

---

## 3. Typography

Three faces, each with one job. A face used outside its job is a bug.

| Role | Face | Where |
| --- | --- | --- |
| Display | **Fraunces** | Marketing headlines **only**. Never in portal or admin. |
| Body / UI | **Manrope** | Everything else — body, nav, forms, tables, buttons |
| Wordmark | **Sora** | The logo, and nothing else |

Fraunces is a variable serif. The display sizes pin
`font-variation-settings: "opsz" 144, "SOFT" 0, "WONK" 0` — the display
optical cut, with the quirk axes at zero. The goal is a confident editorial
serif, not a whimsical one.

Two things this depends on, both easy to break:

- **Load it as a variable font with `axes: ["SOFT","WONK","opsz"]`.** Requesting
  static weights drops `opsz` from the file, and `font-optical-sizing: auto`
  then silently does nothing — the headline renders at the *text* optical size,
  which is thick, closed and condensed. That is what happened on the first pass
  and it is invisible unless you compare the two side by side.
- **Weight 500, not 600.** Compared at 64px against Fraunces 400/600,
  Instrument Serif and Newsreader; 500 carried the most character while staying
  credible, and set the hero in two lines rather than three.

| Style | Face | Size / leading | Tracking |
| --- | --- | --- | --- |
| H1 | Fraunces 600 | `clamp(2.9rem, 5.2vw, 4.6rem)` / 1.02 | -0.03em |
| H2 | Fraunces 600 | `clamp(2.1rem, 3.6vw, 3.1rem)` / 1.06 | -0.026em |
| H3 | Manrope 700 | `clamp(1.25rem, 1.8vw, 1.5rem)` / 1.24 | -0.016em |
| Lede | Manrope 400 | `clamp(1.06rem, 1.25vw, 1.22rem)` / 1.62 | 0 |
| Body | Manrope 400 | 16px / 1.68 | 0 |
| Small | Manrope 400/500 | 14px / 1.55 | 0 |
| Caption | Manrope 500 | 12.5px / 1.45 | 0 |

The negative tracking on the display sizes is load-bearing. It is most of the
difference between type that is *set in a font* and type that is *typeset*.

**Sentence case for headings. No all-caps headlines.** Uppercase is permitted
only for small operational labels inside forms and admin — and specifically
**not** as a marketing eyebrow: mono-uppercase eyebrows were removed from this
site on purpose (redesign Phase 2) because they are an AI-generated tell. Do
not reintroduce them.

---

## 4. Radius

`sm 6px` · `md 9px` · `lg 12px` · `xl 16px` · `pill 999px`

Capped at 16px. Nothing is pill-shaped except badges and status dots — a
pill-shaped primary button is the single most-copied SaaS-template detail of
the last five years.

---

## 5. Spacing (8pt base)

`4, 8, 12, 16, 24, 32, 40, 64, 80, 96, 128` px.

4–16 inside components · 24–40 between components · 64+ between page sections.

---

## 6. Shadow

`sm 0 1px 2px` · `md 0 4px 14px` · `lg 0 14px 34px -12px` · `xl 0 28px 60px -30px`,
all on `rgba(26,18,16,·)`.

Shadows are **warm-tinted**, never black — a neutral shadow over warm paper
reads as dirt. Prefer a rule to a shadow; use a shadow only where something is
genuinely lifted (a card over a photo, a dropdown, a dark hero panel).

---

## 7. Buttons

- **Primary** — `--cs-ink` fill, paper label, `radius-md`. The workhorse.
- **Accent** — `--cs-accent` fill, white label, `radius-md`. **One per page**,
  on the single most important action.
- **Ghost** — transparent, `--cs-rule-2` border, ink label.
- **Quiet** — no fill or border, ink label with a rule underneath.

No trailing arrows. They were stripped in redesign Phase 3 and are not coming
back — an arrow on every button is decoration, not affordance.

---

## 8. Form fields

`--cs-surface` fill, 1px `--cs-rule-2` outline, `radius-md`, Manrope label
above in `--cs-ink`. Focus swaps the outline to `--cs-accent` and adds a 3px
`--cs-wash` ring. Error swaps to `--cs-error` with the message beneath in the
same colour. Helper text sits below in `--cs-muted` at caption size.

---

## 9. Cards

`--cs-surface` fill on the `--cs-paper` canvas, `radius-lg`, 1px `--cs-rule`
hairline. Interactive cards (`a.card`) lift on hover: `--cs-shadow-md` and the
border to `--cs-rule-2`. **No transform on hover** where reduced motion is set.

Dark cards use `--cs-ink` with `--cs-rule-on-ink` hairlines and
`--cs-accent-on-ink` for any accent text.

---

## 10. Voice

Direct, concrete, unhedged. Name the thing that shipped. Prefer "Fleet
management SaaS, 2–20 vehicles, live with paying users" over "innovative
solutions for modern businesses."

No em-dash trailers, no "—and that's the point" constructions, no
mono-uppercase eyebrows. Those were removed deliberately across redesign
Phases 2–5; reintroducing them undoes that work.

---

## 11. Accessibility

Non-negotiable, and it outranks visual fidelity to any mockup:

- Body text ≥ 4.5:1; large text and UI ≥ 3:1. The ratios in §2 are computed,
  not eyeballed — recompute when you change a value.
- Visible focus on every interactive element.
- 44px minimum touch target.
- No colour-only status — pair every colour with a label, icon or shape.
- `prefers-reduced-motion` suppresses transforms and animation.
- Horizontal page overflow at any width is a hard failure.
