import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function recordServerEvent(input: {
  event: string;
  page?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  const payload = {
    event_name: input.event,
    page: input.page || null,
    metadata: input.metadata ?? {},
    ip_address: input.ip || null,
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin.from("analytics_events").insert(payload);
    if (error) {
      // warn (not log) so log-level filters surface this — silently
      // dropped analytics events are debuggable but not page-worthy,
      // so we don't capture to Sentry.
      console.warn("analytics_events insert skipped:", error.message);
    }
  } catch (err) {
    console.warn("analytics_events unavailable:", err instanceof Error ? err.message : "unknown");
  }
}
