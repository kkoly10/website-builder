"use client";

import { useTransition } from "react";
import { usePathname as useRawPathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const LABELS: Record<string, string> = {
  en: "EN",
  fr: "FR",
  es: "ES",
};

const FULL_LABELS: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
};

// Routes that live OUTSIDE the [locale] segment. Switching locale on one of
// these would 404 (e.g. /fr/portal does not exist), so we send the user to
// the homepage in the target locale instead — a single intentional jump
// beats a silent 404.
const NON_LOCALIZED_PREFIXES = [
  "/portal",
  "/dashboard",
  "/internal",
  "/auth",
  "/editor",
  "/pie-lab",
  "/ai",
];

function isNonLocalized(rawPath: string) {
  return NON_LOCALIZED_PREFIXES.some(
    (p) => rawPath === p || rawPath.startsWith(`${p}/`)
  );
}

export default function LocaleSwitcher({
  locale,
  availableLocales,
}: {
  locale: string;
  availableLocales: string[];
}) {
  const router = useRouter();
  const t = useTranslations("nav");
  // Use the raw (pre-i18n) pathname so we can detect routes that live outside
  // the [locale] segment. The i18n usePathname strips the prefix and would
  // make /portal indistinguishable from /websites.
  const rawPathname = useRawPathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    if (next === locale) return;
    startTransition(() => {
      // Preserve query string so flows that depend on params (e.g.
      // /login?next=/portal, /reset-password?token=...) keep their context
      // across a locale switch. Hash fragments are not exposed to server
      // components — they are preserved by the browser on its own.
      const qs = searchParams?.toString() ?? "";
      const suffix = qs ? `?${qs}` : "";

      if (isNonLocalized(rawPathname)) {
        // Target route has no localized counterpart — bounce to home in the
        // chosen locale. Query params from a non-localized page are unlikely
        // to carry over meaningfully, so we drop them.
        router.replace("/", { locale: next });
        return;
      }
      // Build the locale-neutral pathname by stripping any leading locale
      // segment, then let i18n routing re-prefix for the target locale.
      const stripped =
        rawPathname.replace(/^\/(?:en|fr|es)(?=\/|$)/, "") || "/";
      router.replace(`${stripped}${suffix}`, { locale: next });
    });
  }

  return (
    <label className="localeSwitcher" aria-label={t("language")}>
      <span className="localeSwitcherLabel" aria-hidden="true">
        {LABELS[locale] ?? locale.toUpperCase()}
      </span>
      <select
        className="localeSwitcherSelect"
        value={locale}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
      >
        {availableLocales.map((code) => (
          <option key={code} value={code}>
            {FULL_LABELS[code] ?? code}
          </option>
        ))}
      </select>
    </label>
  );
}
