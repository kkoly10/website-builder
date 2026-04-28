import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr", "es"],
  defaultLocale: "en",
  // Default locale stays at the root (/foo); other locales prefix (/fr/foo, /es/foo).
  // This keeps existing English URLs stable and avoids redirect chains for the
  // primary audience, while letting Google index translated variants cleanly.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
