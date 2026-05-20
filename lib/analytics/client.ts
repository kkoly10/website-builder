"use client";

import { hasAnalyticsConsent } from "@/lib/consent";

type EventPayload = {
  event: string;
  page?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export function trackEvent(payload: EventPayload) {
  if (typeof window === "undefined") return;

  // GDPR gate: never fire before the user accepts the cookie banner.
  // Banner stores choice in a "cc" cookie (lib/consent.ts); absent or
  // "declined" → return silently. Declined users browse normally; they
  // just don't show up in analytics.
  if (!hasAnalyticsConsent()) return;

  const body = JSON.stringify({
    event: payload.event,
    page: payload.page || window.location.pathname,
    metadata: payload.metadata ?? {},
    occurredAt: new Date().toISOString(),
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/event", blob);
      return;
    }
  } catch {
    // fall through to fetch
  }

  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // no-op
  });
}
