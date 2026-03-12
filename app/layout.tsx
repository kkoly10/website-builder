import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import BrandLogo from "@/components/brand/BrandLogo";
import SiteFooter from "@/components/site/SiteFooter";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CrecyStudio | Websites, E-Commerce & Workflow Systems",
  description:
    "Premium websites, e-commerce systems, and workflow automation for growth-focused businesses.",
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

  const startHereHref = "/#services";
  const portalHref = userEmail
    ? "/portal"
    : `/login?next=${encodeURIComponent("/portal")}`;

  const mobilePrimaryHref = userEmail ? "/portal" : startHereHref;
  const mobilePrimaryLabel = userEmail ? "Portal" : "Start";
  const mobilePrimaryAria = userEmail ? "Open client portal" : "Start Here";

  const navLinks = [
    { href: "/websites", label: "Websites" },
    { href: "/ecommerce", label: "E-Commerce" },
    { href: "/systems", label: "Workflow Systems" },
    { href: "/process", label: "How It Works" },
    { href: "/faq", label: "FAQ" },
    { href: portalHref, label: "Client Portal" },
  ];

  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skipLink">
          Skip to main content
        </a>

        <div className="siteShell">
          <header className="topNav">
            <div className="topNavInner">
              <BrandLogo href="/" showTag />

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
                  <Link href={startHereHref} className="btn btnPrimary">
                    Start Here <span className="btnArrow">→</span>
                  </Link>
                )}
              </nav>

              <div className="mobileHeaderActions">
                <Link
                  href={mobilePrimaryHref}
                  className="btn btnPrimary mobilePrimaryCta"
                  aria-label={mobilePrimaryAria}
                >
                  {mobilePrimaryLabel}
                </Link>

                <details className="mobileMenu">
                  <summary
                    className="mobileMenuSummary"
                    aria-label="Open navigation menu"
                  >
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
                        <form
                          action="/auth/signout"
                          method="post"
                          className="mobileMenuForm"
                        >
                          <button
                            type="submit"
                            className="btn btnGhost mobileMenuSignout"
                          >
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

          <main id="main-content" className="mainContent" tabIndex={-1}>
            {children}
          </main>

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
