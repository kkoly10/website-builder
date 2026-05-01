import { routing } from "@/i18n/routing";

const VALID = new Set<string>(routing.locales);

// Pick a request-scoped preferred locale from a JSON body, falling back to the
// default locale when the value is missing, malformed, or not in the configured
// locale set. Used by intake APIs to stamp the locale onto persisted rows so
// later /portal renders and outbound emails can localize without guessing.
export function pickPreferredLocale(value: unknown): string {
  if (typeof value !== "string") return routing.defaultLocale;
  const trimmed = value.trim().toLowerCase();
  return VALID.has(trimmed) ? trimmed : routing.defaultLocale;
}
