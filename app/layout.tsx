import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/components/site/SiteFooter";
import TopNav from "@/components/site/TopNav";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

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
    locale: "en_US",
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
    <html lang="en">
      <body>
        <a href="#main-content" className="skipLink">
          Skip to main content
        </a>

        <div className="siteShell">
          <TopNav
            admin={admin}
            portalHref={portalHref}
            startProjectHref={startProjectHref}
            userEmail={userEmail}
          />

          <main id="main-content" className="mainContent" tabIndex={-1}>
            {children}
          </main>

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
