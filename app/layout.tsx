import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import BrandLogo from "@/components/brand/BrandLogo";
import SiteFooter from "@/components/site/SiteFooter";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crecystudio.com";

export const metadata: Metadata = {
  title: {
    default: "CrecyStudio | Websites & Workflow Systems",
    template: "%s | CrecyStudio",
  },
  description:
    "Custom websites and workflow systems for local service businesses. Free estimates, 50% deposit model, 2–4 week delivery.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    siteName: "CrecyStudio",
    title: "CrecyStudio | Websites & Workflow Systems",
    description:
      "Custom websites and workflow systems for local service businesses. Free estimates, 50% deposit model, 2–4 week delivery.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "CrecyStudio | Websites & Workflow Systems",
    description:
      "Custom websites and workflow systems for local service businesses.",
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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

  const customBuildHref = "/build/intro";
  const portalHref = userEmail ? "/portal" : `/login?next=${encodeURIComponent("/portal")}`;

  const navLinks = [
    { href: "/systems", label: "Workflow Systems" },
    { href: customBuildHref, label: "Custom Build" },
    { href: "/process", label: "How It Works" },
    { href: "/faq", label: "FAQ" },
    { href: portalHref, label: "Client Portal" },
  ];

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: "CrecyStudio",
              url: siteUrl,
              description:
                "Custom websites and workflow systems for local service businesses.",
              email: "hello@crecystudio.com",
              serviceType: [
                "Web Design",
                "Web Development",
                "Workflow Automation",
              ],
              areaServed: { "@type": "Country", name: "US" },
              priceRange: "$$",
            }),
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skipLink">Skip to main content</a>
        <div className="siteShell">
          <header className="topNav">
            <div className="topNavInner">
              <BrandLogo href="/" showTag />

              {/* Desktop nav */}
              <nav className="navLinks navDesktop">
                {navLinks.map((item) => (
                  <Link key={item.label} href={item.href}>
                    {item.label}
                  </Link>
                ))}

                {userEmail ? (
                  <>
                    {admin ? <Link href="/internal/admin">Admin Dashboard</Link> : null}
                    <form action="/auth/signout" method="post" className="navForm">
                      <button type="submit" className="btn btnGhost">
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <Link href={customBuildHref} className="btn btnPrimary">
                    Get Quote <span className="btnArrow">→</span>
                  </Link>
                )}
              </nav>

              {/* Mobile header actions */}
              <div className="mobileHeaderActions">
                <Link href={customBuildHref} className="btn btnPrimary mobilePrimaryCta">
                  Get Quote
                </Link>

                <details className="mobileMenu">
                  <summary className="mobileMenuSummary" aria-label="Open navigation menu">
                    <span />
                    <span />
                    <span />
                  </summary>

                  <div className="mobileMenuPanel">
                    <div className="mobileMenuLinks">
                      {navLinks.map((item) => (
                        <Link key={item.label} href={item.href}>
                          {item.label}
                        </Link>
                      ))}

                      {admin ? <Link href="/internal/admin">Admin Dashboard</Link> : null}

                      {userEmail ? (
                        <form action="/auth/signout" method="post" className="mobileMenuForm">
                          <button type="submit" className="btn btnGhost mobileMenuSignout">
                            Sign out
                          </button>
                        </form>
                      ) : (
                        <Link href="/login" className="mobileMenuMutedLink">
                          Log in
                        </Link>
                      )}
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </header>

          <main id="main-content" className="mainContent" tabIndex={-1}>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}