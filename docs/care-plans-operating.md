# Care Plans Operating Doc

## Purpose

Internal operating guide for CrecyStudio's three Care plan tiers. Defines included scope, time-bank rules, response SLAs, exclusions, monthly rituals, escalation, and cancellation policy. Single source of truth for what the operator commits to vs. what's billable separately. Customer-facing surface is the `/care-plans` page; this doc lives behind admin and references from it.

This doc is a Phase 2 prerequisite — the `/care-plans` page does not ship until this exists, per the opportunity doc roadmap.

---

## The three tiers

| Tier | Monthly (USD) | Time bank | Response SLA | Includes |
|---|---|---|---|---|
| **Care** | $400 | 2 hours | 48 business-hour ack / 5 business-day resolve | Monthly health check, monitoring, content updates, plugin/CMS updates |
| **Care+** | $850 | 5 hours | 24 business-hour ack / 3 business-day resolve | Care + small feature work, analytics review, light improvements |
| **Care Pro** | $2,250 | 8 hours + monthly improvement sprint | 4 business-hour ack / 1 business-day resolve | Care+ + monthly improvement sprint (planned dev work), priority response, 30-min monthly strategy call |

Business hours: 9am–6pm Eastern, Monday–Friday. Solo operator does not commit to 24/7 coverage at any tier.

---

## Time bank rules

- Each tier has X hours per month included for ad-hoc work (small fixes, content updates, micro-features).
- **Rollover:** unused hours roll over once. Maximum bank size = 2× monthly allotment. Anything beyond expires at month end.
- **Overage handling:** work beyond bank rolls forward into the next month if minor (under 1 hour). Beyond that, flat **$150/hour billable**, communicated to client before work begins.
- **No refund** for unused hours on cancellation.
- **Time tracking:** logged in the admin pipeline against the project. Surfaced to client via the monthly summary.

---

## Named monthly rituals

These ship regardless of time-bank consumption. They're the value signal even when nothing dramatic happened that month.

| Ritual | Care | Care+ | Care Pro |
|---|:---:|:---:|:---:|
| Monthly health check (uptime, security, backups, performance) | ✓ | ✓ | ✓ |
| Plugin / CMS / dependency updates | ✓ | ✓ | ✓ |
| End-of-month email summary | ✓ | ✓ | ✓ |
| Portal-rendered activity dashboard for the period | — | ✓ | ✓ |
| Analytics review (top pages, traffic, conversions) | — | ✓ | ✓ |
| Improvement sprint (planned dev work) | — | — | ✓ |
| 30-minute strategy call | — | — | ✓ |

---

## Response SLA — what counts and what doesn't

SLA applies to **acknowledgment** (operator confirms request received) and **resolution** (work complete or scheduled). Business hours only.

| Request type | Care | Care+ | Care Pro |
|---|---|---|---|
| Content update / minor change | 48h ack / 5d resolve | 24h ack / 3d resolve | 4h ack / 1d resolve |
| Bug or visual regression | 48h ack / 5d resolve | 24h ack / 3d resolve | 4h ack / 1d resolve |
| Question / advice | 48h response | 24h response | 4h response |
| **Emergency** (site down, broken checkout, data loss, security incident) | **4h ack across all tiers**; resolution best-effort within 24h | Same | Same |

Off-hours emergencies: best-effort response. No tier promises 24/7 coverage in v1.

---

## What's explicitly OUT of scope across all tiers

These trigger a separate quote, not Care plan work:

- **New feature builds** beyond a small change. Threshold: anything that takes more than ~1 hour or requires database/schema changes.
- **Brand or design refresh** (new logo, color system, typography). Different engagement.
- **Content writing beyond minor copy edits.** Care can fix typos and restructure paragraphs; Care+/Pro can refine messaging. Writing new pages from scratch is out.
- **Hosting migrations.** Moving providers is a separate engagement; maintaining current hosting is in.
- **Third-party plugin debugging when the plugin author should fix it.** Care plans cover diagnostics and a workaround if available; chasing the plugin vendor is out.
- **Strategy work outside the monthly call** (Care Pro). The 30-min monthly call is included; multi-hour strategy sessions are billable separately.
- **Marketing services** (SEO consulting, ad campaign management, email marketing, copywriting beyond microcopy).

When a request crosses the line, the operator responds with: *"This is outside Care plan scope. Quote attached for separate engagement."* Mini-quote ships within one SLA window.

---

## Onboarding ritual (first month of every Care plan)

1. **Welcome email** within 24 hours of subscription start. Confirms tier, SLA, time bank, monthly ritual schedule, escalation path, link to `/care-plans` for tier reference.
2. **First health check** within first 7 days. Sets baseline for monthly comparisons.
3. **Portal access** confirmed (Care+ and Care Pro get the dashboard view enabled).
4. **First strategy call scheduled** (Care Pro only) within first 14 days. Sets recurring monthly cadence.

---

## Monthly reporting cadence

End of each calendar month, by the 5th of the following month:

- **Care:** Plain-text email summary. What was done, what was noticed, what's coming next month.
- **Care+:** Email summary + portal-rendered activity dashboard for the period (auto-built from existing `project_activity` feed).
- **Care Pro:** Care+ summary + analytics highlights + recap of monthly strategy-call action items.

---

## Escalation path

When a client request exceeds tier scope or SLA capacity:

1. Operator acknowledges within tier SLA.
2. If genuinely out-of-scope: send mini-quote for separate engagement. Don't do the work without sign-off.
3. If in-scope but capacity-blocked (e.g., complex bug requiring 4+ hours): communicate revised resolution window with reason. Use rolled-over bank if available, or schedule into next improvement sprint (Care Pro).
4. Emergencies during off-hours: best-effort response. Surface to client with realistic timing the next business morning.

---

## Cancellation policy

- **Initial commitment:** 3 calendar months from subscription start. Cancellation before then incurs a one-time early-termination fee equal to **1 month at the tier rate**.
- **After initial period:** month-to-month with **30 days written notice** required (email is fine).
- **No refunds** for partial months. Cancellation effective at end of current billing period.
- **Pause:** not offered in v1. If a client asks, suggest cancelling and resubscribing — or revisit when the request volume justifies adding `pause_collection` integration.

---

## Tier upgrades and downgrades

- **Upgrade:** effective immediately. Pro-rated bill for the current month.
- **Downgrade:** effective at next billing period. Current period billed at original rate.
- **Restrictions:** a downgrade from Care Pro removes the monthly strategy call commitment retroactively for the current period (no make-up call).

---

## Pricing change policy

- Existing subscribers are **grandfathered** at their current rate for the lifetime of their continuous subscription.
- Pricing changes apply only to new subscriptions and to existing subscribers who upgrade or downgrade tier.
- Annual price reviews scheduled for December; any changes take effect January 1.

---

## Internal self-notice triggers (operator-only)

Signals the operator should monitor without client prompting:

- **Time bank consistently underused** (under 50% for 3 consecutive months) — proactively offer downgrade or use the unused time for an unrequested improvement. Builds goodwill, prevents perceived-value drift.
- **Time bank consistently overused** (overage every month) — proactively suggest tier upgrade. Better than letting friction build.
- **SLA missed twice in a quarter** — schedule a check-in to discuss capacity / tier fit before the client raises it.
- **Care Pro monthly strategy call missed twice in a row** — flag as engagement risk; reach out personally.

---

## Internal v2 candidates (not in scope today, track demand)

Items deferred from v1. Add when the first client requests:

- Pause / freeze feature (Stripe `pause_collection` integration + admin UI + portal surface)
- Pre-paid annual plans with discount
- Per-incident SLA top-ups (pay extra for faster response on a specific issue)
- Client-portal self-serve tier upgrade
- Ticket queue UI (replaces ad-hoc email triage when volume warrants)
- True 24/7 emergency coverage (requires shared on-call or contractor partner)

---

## Related documents

- `opportunities_to_build_on_current_repo_to_better_expose_crecys_potential.md` — strategic context, lane positioning, validated pricing rationale
- `frontend_schema_and_connection_to_current_systems.md` — `/care-plans` public page copy direction
- `backend_schema_for_crecystudio_project_engine.md` — `support_subscriptions` table schema, Stripe webhook handling, tier enum values
