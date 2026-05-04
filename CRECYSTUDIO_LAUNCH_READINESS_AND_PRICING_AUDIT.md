# CrecyStudio Launch Readiness & Pricing Audit

**Date:** May 4, 2026  
**Repo:** `kkoly10/website-builder`  
**Live site:** `crecystudio.com`  
**Overall launch-readiness score:** **82 / 100**

---

## Executive Summary

CrecyStudio is **soft-launch ready** and strong enough to send to warm leads, real prospects, and small business owners for direct outreach. It is **not yet fully public-launch polished** for paid ad traffic because several conversion-critical pages and end-to-end payment/portal flows still need live QA.

The biggest improvement is that the homepage now feels like a real independent studio, not just a generic website builder. The positioning is clearer, the founder story adds trust, and the service routing makes it easier for visitors to self-select the right lane.

The remaining gap is not the homepage. The remaining gap is **conversion reliability, old-page cleanup, and pricing clarity across all service lanes**.

---

## Launch Readiness Scorecard

| Area | Score | Notes |
|---|---:|---|
| Homepage / brand | 90% | Strong new studio positioning, better trust, better founder-led story. |
| Service pages | 88% | Websites, e-commerce, systems, and rescue lanes are much stronger. |
| Intake / lead capture | 82% | Multi-lane intake exists and is a real business asset. Needs live QA across all lanes. |
| Quote / estimate backend | 80% | Supabase quote flow, quote tokens, rate limiting, and portal creation are real. |
| Payments / deposit flow | 72% | Code exists, but needs full Stripe checkout + webhook + portal verification. |
| Auth / portal | 75% | Wired, but login/estimate empty states still feel visually older. |
| SEO / i18n | 82% | Good English/French/Spanish route foundation. Search snippets may lag. |
| QA / launch operations | 65% | Thin automated testing. Needs smoke tests and full launch checklist. |

---

## What Is Already Launch-Ready

### 1. Marketing surface

The homepage now clearly communicates:
- What CrecyStudio builds.
- Why the client should trust the studio.
- That the client gets a private project workspace.
- That the founder is the actual builder, not an agency salesperson.
- That the studio has shipped real systems and SaaS products.

This is much stronger for conversion than the older homepage.

### 2. Multi-lane service routing

The homepage and `/build/intro` flow now route visitors by project type:
- Website
- Custom web app
- Client portal
- Workflow automation
- E-commerce
- Website rescue

That makes the site feel more mature and helps prevent every lead from being forced into one generic quote flow.

### 3. Real backend foundation

The quote system is more than a mockup. The backend includes:
- Quote submission route.
- Supabase lead and quote creation.
- Quote token handling.
- Rate limiting.
- Access checks.
- Locale preference handling.
- Analytics event recording.
- Customer portal auto-creation.

This gives CrecyStudio a real operational advantage compared with many small web studios that still rely on a form and email thread.

### 4. International foundation

The repo has English, French, and Spanish routing. That is valuable long-term because CrecyStudio may eventually target international clients, multilingual SaaS founders, or bilingual small businesses.

---

## Main Launch Blockers

### Blocker 1 — Old visual shell still appears on conversion pages

The new homepage and service pages feel premium. However, some conversion-adjacent pages still feel like the older version of the brand.

Priority pages to clean up:
- `/estimate`
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- empty/error states inside portal or estimate views

**Why this matters:**  
A visitor may start on the polished homepage, click into an estimate or auth flow, then see a page that feels like a different generation of the product. This weakens trust.

**Recommended fix:**  
Create one shared `AuthShell` / `ConversionShell` visual system and apply it to all account and quote pages.

---

### Blocker 2 — Full money path still needs live QA

The intended flow is:

`Start project → intake → submit estimate → quote page → accept/deposit → Stripe checkout → webhook → portal/workspace`

The code appears wired, but full public launch requires one clean real-world test.

**Required test cases:**
1. Website intake → quote created → estimate page visible.
2. Custom app intake → quote created → correct project type preserved.
3. E-commerce intake → quote created → correct project type preserved.
4. Rescue intake → quote created → correct project type preserved.
5. Estimate accept button → Stripe checkout opens.
6. Stripe test payment → webhook updates quote/deposit status.
7. Portal/workspace appears after deposit.
8. Client login claims existing quotes by email.
9. Admin dashboard sees quote, client status, messages, and project workspace.

---

### Blocker 3 — Redirect hardening

The auth callback uses a safe-next-path helper, but the helper should explicitly reject:
- `//evil.com`
- `\evil.com`
- encoded external redirects
- any non-internal path that does not match your known route pattern

**Recommended fix:**

```ts
export function safeNextPath(next?: string | null) {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  if (next.includes("\\")) return null;
  return next;
}
```

---

### Blocker 4 — Security headers should be global

The API routes already get some protection, but public pages should also get global headers such as:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options` or frame policy
- Carefully scoped CSP after testing

**Recommended fix:**  
Add global headers in `next.config` or the app proxy/middleware layer.

---

### Blocker 5 — Automated launch QA is too thin

Current scripts are minimal. The repo should have at least:
- `typecheck`
- `lint`
- `build`
- `test:routes`
- `test:e2e`
- `test:smoke`

Minimum smoke test routes:
- `/`
- `/websites`
- `/ecommerce`
- `/systems`
- `/custom-web-apps`
- `/client-portals`
- `/website-rescue`
- `/care-plans`
- `/build/intro`
- `/build`
- `/estimate`
- `/login`
- `/signup`
- `/portal`
- `/internal/admin`

---

## Recommended Pre-Launch Checklist

### Must fix before paid ads

- [ ] Rebrand `/estimate` empty state.
- [ ] Rebrand `/login`, `/signup`, forgot/reset password.
- [ ] Run one live submission through every intake lane.
- [ ] Run Stripe test checkout from estimate accept.
- [ ] Confirm webhook updates quote/deposit status.
- [ ] Confirm workspace/portal auto-creates after deposit.
- [ ] Confirm admin dashboard shows quote, status, and client activity.
- [ ] Add safe redirect hardening.
- [ ] Add global security headers.
- [ ] Add smoke test script.

### Should fix before SEO push

- [ ] Make sure sitemap includes all current service pages.
- [ ] Confirm `/custom-web-apps`, `/client-portals`, `/website-rescue`, and `/care-plans` are crawlable.
- [ ] Add page-specific Open Graph images.
- [ ] Refresh old homepage metadata/search snippets.
- [ ] Add structured data for Organization/LocalBusiness/Service pages.
- [ ] Add internal links from blog/help pages once content exists.

### Nice to have

- [ ] Lightweight “recent work” section.
- [ ] One or two founder-led case studies.
- [ ] Better pricing comparison page.
- [ ] Public FAQ around deposits, ownership, revisions, and timelines.
- [ ] Simple downloadable proposal after quote submission.

---

# Pricing Audit

## Current CrecyStudio Pricing Captured

### Website builds

| Tier | Current Price | Assessment |
|---|---:|---|
| Starter Site | $1,800–$2,400 | Fair, but should stay tightly scoped to single-page or very small sites. |
| Growth Site | $3,500–$4,500 | Strong and fair. This should be your main service-business package. |
| Premium Build | $6,500–$10,000+ | Fair for deeper custom sites, but needs clear “what pushes it premium” language. |

### Workflow automation / systems

| Tier | Current Price | Assessment |
|---|---:|---|
| Quick Workflow Fix | $1,000–$1,800 | Fair, possibly slightly low if custom API work is included. |
| Ops System Build | $2,000–$3,800 | Good entry-market pricing, but underpriced if it includes custom dashboards or multi-system sync. |
| Ongoing Systems Partner | $500–$1,250/mo | Fair for automation support; raise minimum if response expectations are high. |

### E-commerce

| Tier | Current Price | Assessment |
|---|---:|---|
| Launch Store Build | $1,800–$3,200 | Fair for basic Shopify/WooCommerce launch. |
| Growth Store Build | $3,200–$5,200 | Fair but should not include heavy product migration unless scoped. |
| Commerce Repair Sprint | $1,200–$2,200 | Fair; good conversion-friendly entry offer. |
| Commerce Growth Repair | $2,300–$4,200 | Fair for audit + implementation. |
| E-commerce Ops Support | Setup $500–$900 + $900–$1,800/mo | Fair if operations are limited and well-defined. |
| Managed Commerce Partner | Setup $1,200–$2,200 + $1,800–$3,200/mo | Fair if order volume, support channels, and reporting are capped. |

### Website rescue

The public positioning suggests a rescue/fix lane. Keep this as an entry service, not a full rebuild in disguise.

Recommended pricing:
- Basic rescue: **$800–$1,500**
- Full rescue sprint: **$1,500–$3,500**
- Rescue + rebuild: move into website Growth/Premium pricing.

### Custom web apps

The homepage positions this lane as dashboards, portals, internal tools, and MVPs.

Recommended pricing:
- Small internal tool: **$5,000–$9,000**
- Client portal / dashboard MVP: **$8,000–$18,000**
- SaaS MVP or multi-tenant app: **$15,000–$35,000+**

Do **not** price serious custom apps like regular websites. A login system, dashboard, roles, database schema, billing, admin tools, and email workflows can easily exceed website complexity.

### Client portals

Recommended pricing:
- Simple portal add-on to website: **$3,500–$7,500**
- Standalone client portal: **$7,500–$15,000**
- Portal with payments, files, messaging, status, and admin dashboard: **$12,000–$25,000+**

Your portal/workspace advantage is one of your strongest differentiators. Do not underprice this.

### Care plans

Recommended structure:
- Essential Care: **$150–$250/mo**
- Growth Care: **$350–$750/mo**
- Studio Partner: **$900–$1,500+/mo**

If you include actual design/development hours every month, do not price under $300/mo unless the scope is extremely limited.

---

## Pricing Verdict

Your current prices are **fair and generally smart for your position** as an independent full-stack studio.

They are not too high. In several areas, they are actually modest compared with agency pricing. That can be good early on, but only if you keep scope tight.

### Best current pricing decisions

- Website Starter at $1,800–$2,400 is believable and professional.
- Growth Website at $3,500–$4,500 is probably your best conversion package.
- Website Premium at $6,500–$10,000+ gives you room to sell deeper builds.
- Workflow automation starting at $1,000 is a good low-friction entry point.
- E-commerce support retainers are credible if you clearly limit order volume and support scope.

### Main pricing risk

The biggest risk is not that prices are too high. The risk is that **scope can quietly grow beyond the price**.

Protect yourself with:
- Written scope snapshot.
- Revision limits.
- Clear exclusions.
- Change-order language.
- Separate pricing for copywriting, SEO content, integrations, product migration, custom dashboard work, and urgent timelines.

---

## Recommended Price Positioning

Use this public positioning:

> “Small websites start at $1,800. Most serious business websites land between $3,500 and $4,500. Custom systems, portals, and apps are scoped separately because they involve workflows, databases, permissions, and integrations.”

This keeps your entry price accessible while protecting you from people expecting a custom app for website money.

---

## Suggested Next Repo Files

Consider adding these files to the repo:

```txt
docs/launch-readiness-audit-2026-05-04.md
docs/pricing-strategy-2026.md
docs/pre-launch-qa-checklist.md
docs/security-hardening-checklist.md
```

---

## Sources Checked

Industry pricing sources consulted for market context:
- Web Cost Estimator — Web Design Agency Cost in 2026
- Web Cost Estimator — Freelance Web Designer Cost in 2026
- Web Cost Estimator — Ecommerce Website Cost in 2026
- AgencyCluster — Web Development Cost Calculator 2026
- Media Search Group — Website Design Cost 2026
- Bin Bin Ink — Website Maintenance Cost 2026
- Liquid Web Developers — Website Maintenance Packages 2026
- YSR Studio — Website Maintenance Cost for Small Businesses 2026

Repo/live site areas reviewed:
- `package.json`
- `app/[locale]/page.tsx`
- `app/[locale]/build/intro/BuildIntroClient.tsx`
- `app/[locale]/build/BuildClient.tsx`
- `app/api/submit-estimate/route.ts`
- `app/[locale]/estimate/EstimateClient.tsx`
- `app/[locale]/login/LoginClient.tsx`
- `lib/pricing/config.ts`
- `proxy.ts`
- Live pages: `/`, `/websites`, `/ecommerce`, `/systems`, `/estimate`, `/login`
