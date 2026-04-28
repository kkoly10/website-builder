"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

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

export default function LocaleSwitcher({
  locale,
  availableLocales,
}: {
  locale: string;
  availableLocales: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    if (next === locale) return;
    startTransition(() => {
      // usePathname from i18n/navigation returns the path without the locale
      // segment; useRouter.replace re-adds the right prefix for the target.
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <label className="localeSwitcher" aria-label="Language">
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
