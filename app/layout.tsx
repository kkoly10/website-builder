import type { Metadata } from "next";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import SiteFooter from "@/components/site/SiteFooter";
import TopNav from "@/components/site/TopNav";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

// Page-level alternates.languages live in app/[locale]/layout.tsx so they
// reflect the current path (e.g. /websites <-> /fr/websites <-> /es/websites)
// rather than always pointing at the homepage.
export const metadata: Metadata = {
  title: "CrecyStudio | Websites, E-commerce & Workflow Automation",
  description:
    "Premium websites, e-commerce systems, and workflow automation for growth-focused businesses.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com"),
  openGraph: {
    title: "CrecyStudio | Websites, E-commerce & Workflow Automation",
    description:
      "Premium websites, e-commerce systems, and workflow automation for growth-focused businesses.",
    url: "/",
    siteName: "CrecyStudio",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CrecyStudio | Websites, E-commerce & Workflow Automation",
    description:
      "Premium websites, e-commerce systems, and workflow automation for growth-focused businesses.",
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Locale is resolved by the next-intl middleware. For routes outside the
  // [locale] segment (e.g. /portal, /internal, /api error pages) it falls
  // back to the default locale.
  const locale = await getLocale();
  // Pass messages explicitly so client components below can call
  // useTranslations(). Without this, client components only see translations
  // they read at module import time — which breaks once we start using
  // useTranslations() in PR 2.
  const messages = await getMessages();

  let userEmail: string | null = null;
  let admin = false;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    userEmail = data?.user?.email ?? null;
    admin = await isAdminUser({
      userId: data?.user?.id ?? null,
      email: data?.user?.email ?? null,
    });
  } catch {
    userEmail = null;
    admin = false;
  }

  const startProjectHref = "/build/intro";
  const portalHref = userEmail
    ? "/portal"
    : `/login?next=${encodeURIComponent("/portal")}`;

  return (
    <html lang={locale}>
      <body>
        <a href="#main-content" className="skipLink">
          Skip to main content
        </a>

        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="siteShell">
            <TopNav
              admin={admin}
              portalHref={portalHref}
              startProjectHref={startProjectHref}
              userEmail={userEmail}
              locale={locale}
              availableLocales={routing.locales as unknown as string[]}
            />

            <main id="main-content" className="mainContent" tabIndex={-1}>
              {children}
            </main>

            <SiteFooter />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
