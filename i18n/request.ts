import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// next-intl's middleware sets this cookie whenever it resolves a locale on a
// locale-aware page (e.g. /fr/websites). For routes outside the [locale]
// segment (/portal, /internal, /auth, /api error pages) the middleware is
// skipped, so requestLocale is undefined. Falling back to the cookie lets
// those pages honor the language the user was browsing in.
const LOCALE_COOKIE = "NEXT_LOCALE";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  let locale: string = routing.defaultLocale;

  if (hasLocale(routing.locales, requested)) {
    locale = requested;
  } else {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    if (hasLocale(routing.locales, cookieLocale)) {
      locale = cookieLocale;
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
