# Phase 1 Launch QA Runbook

**Use:** Manual QA pass required before paid traffic.
**Time:** ~30 minutes for the full pass.
**Source:** `CRECYSTUDIO_LAUNCH_AND_PORTAL_PLAN.md` § Phase 1.5.

This runbook is the human gate for shipping Phase 1. The smoke tests (`npm run test:smoke`) cover route-level health; this runbook covers the **money path** end-to-end, plus the new security headers and the Design Direction prereq.

Run it on production (or a Vercel preview pointing at production Supabase + Stripe test mode). Capture screenshots / network HARs of each step into a private folder so you have receipts if something regresses later.

---

## 0. Prerequisites

- [ ] You have a Stripe test-mode account configured in env.
- [ ] You have `ADMIN_NOTIFICATION_EMAIL` set so admin alerts arrive.
- [ ] The CSP violations migration `supabase/migrations/20260507_create_csp_violations.sql` has been applied to the live Supabase project.
- [ ] You can log in with both an admin account and a fresh customer account.

---

## 1. Security headers verification

Run from your local terminal (not the browser console — some browsers strip headers from devtools view):

```bash
curl -sI https://crecystudio.com/ | grep -i -E "x-content-type|x-frame|referrer|strict-transport|permissions|content-security"
```

Expected output (in any order):

```
content-security-policy-report-only: default-src 'self'; ...
permissions-policy: geolocation=(), microphone=(), camera=(), payment=(self)
referrer-policy: strict-origin-when-cross-origin
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
```

- [ ] All six headers present.
- [ ] CSP is **report-only** (not enforcing). If it shows `content-security-policy:` instead of `content-security-policy-report-only:`, something promoted CSP early — investigate before continuing.

Then load `https://crecystudio.com/` in a browser. Open devtools → Network → click the document request → Response Headers. Confirm headers are sent on the navigation response.

---

## 2. Open-redirect hardening

Try each of these URLs. Each must redirect to `/` (not the external domain) or stay on the current page without changing origin. If any redirects you to `evil.example.com`, the fix is broken.

- [ ] `https://crecystudio.com/login?next=//evil.example.com` → safe
- [ ] `https://crecystudio.com/login?next=/\evil.example.com` → safe
- [ ] `https://crecystudio.com/login?next=%2F%2Fevil.example.com` → safe (URL-encoded `//`)
- [ ] `https://crecystudio.com/login?next=https://evil.example.com` → safe
- [ ] `https://crecystudio.com/login?next=/portal/foo` → goes to `/portal/foo` after login

---

## 3. CSP report endpoint

Trigger a violation (any inline script that the CSP report-only doesn't allow). Easiest: open devtools console on the live site and look for `Refused to ...` warnings — those are CSP report-only violations being reported.

- [ ] Visit `https://crecystudio.com/`, then in Supabase Studio run:
  ```sql
  select count(*), violated_directive
    from csp_violations
   where received_at > now() - interval '5 minutes'
   group by violated_directive
   order by count(*) desc;
  ```
- [ ] At least one row returned (Stripe / fonts / analytics may legitimately violate the report-only policy).
- [ ] Spot-check `raw->>'document-uri'` on a few rows to verify they're real reports and not garbage.

> If you see zero rows, either the CSP isn't loading (re-check step 1), the migration hasn't run, or the report endpoint is broken. Check Vercel logs for `[csp-report]`.

---

## 4. Conversion shell visual pass

Walk through each auth page in a private browser window. Confirm the visual frame matches across all four:

- [ ] `/login` — card with kicker, title, subtitle, form, footer links
- [ ] `/signup` — same shell, signup form, "have account → sign in" footer
- [ ] `/forgot-password` — same shell, single-field form, "back to login" footer
- [ ] `/reset-password` (visit via `/forgot-password` flow first if you need a real token) — same shell

Also confirm the loading fallbacks render in the same shell (briefly visible during slow connections — throttle to Slow 3G in devtools).

---

## 5. Money path — end-to-end Stripe test

Run each lane in order. After each, check:
1. Resend confirmation email arrived
2. Admin alert email arrived
3. Quote row in Supabase has expected `project_type`
4. Stripe test session was created (if you reached deposit)

### 5.1 Website lane

- [ ] Submit `/build/intro` choosing **Website**, complete intake, land on `/estimate`.
- [ ] In Supabase: `select project_type, status from quotes order by created_at desc limit 1` → `project_type = 'website'`.
- [ ] Click "Accept" / deposit CTA on `/estimate`.
- [ ] Stripe Checkout opens with the right amount.
- [ ] Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC.
- [ ] Redirected back to portal after success.
- [ ] In Supabase: `quotes.deposit_status = 'paid'`, `customer_portal_projects.deposit_status = 'paid'`.
- [ ] Webhook log in Vercel shows the `checkout.session.completed` event was processed.
- [ ] `/portal/[token]` renders the workspace (the website-only one — Phase 3 will generalize this).

### 5.2 Custom web app lane

- [ ] Submit `/build/intro` choosing **Custom web app**, complete intake.
- [ ] Quote row has `project_type = 'web_app'`.
- [ ] **Note:** as of this PR the portal still renders the website-only workspace for non-website lanes — this is expected and resolves in Phase 3. Verify the quote `project_type` is correct so the data is right when the unified engine ships.

### 5.3 E-commerce lane

- [ ] Same flow choosing **E-commerce**.
- [ ] Quote row has `project_type = 'ecommerce'`.

### 5.4 Rescue lane

- [ ] Same flow choosing **Website rescue**.
- [ ] Quote row has `project_type = 'rescue'`.

### 5.5 Automation / ops lane

- [ ] Same flow choosing **Workflow / automation**.
- [ ] Quote row has `project_type = 'automation'`.

---

## 6. Auth claim flow

- [ ] Submit a website quote with email `test+claim-$(date +%s)@example.com` (use a real inbox you control).
- [ ] Sign up at `/signup` with the same email.
- [ ] Verify email + complete signup.
- [ ] Land on `/portal` and confirm the new portal entry appears there (claim succeeded).

---

## 7. Admin dashboard

- [ ] Log in as admin via `/login`.
- [ ] Land on `/internal/admin`.
- [ ] Recent quote from step 5.1 appears in the queue with deposit status, client status, and link to workspace.
- [ ] Open the workspace, verify messages, agreement, scope snapshot all load.

---

## 8. Smoke + e2e regression

```bash
npm run test:smoke
```

- [ ] All 15 smoke tests pass (each route returns < 500 and renders a heading).

Optionally run the full intake e2e if you have time:

```bash
npm run test:e2e
```

---

## 9. Post-pass

If every box above is checked:

- [ ] Tag the deploy `phase-1-launch-ready-YYYY-MM-DD`.
- [ ] Update `CRECYSTUDIO_LAUNCH_AND_PORTAL_PLAN.md` Phase 1 acceptance criteria as completed.
- [ ] Watch CSP report-only violations for the next two weeks. Once the violation set stabilizes (only known-good sources), promote CSP to enforcing by changing `Content-Security-Policy-Report-Only` → `Content-Security-Policy` in `next.config.js`.

If anything fails, file an issue or fix in place before declaring Phase 1 done.

---

## Phase 1 follow-ups (deliberately deferred)

- `/estimate` empty-state visual rebrand (out of ConversionShell scope — needs its own marketing-style refresh).
- Promote CSP from report-only to enforcing once the violation log is clean.
- Backfill admin-auth-setup.ts as a real e2e helper so authenticated tests run in CI.
