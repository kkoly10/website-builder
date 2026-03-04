"use client";

type EventPayload = {
  event: string;
  page?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export function trackEvent(payload: EventPayload) {
  if (typeof window === "undefined") return;

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
