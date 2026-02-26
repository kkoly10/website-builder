import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

// Import your custom components
import BrandLogo from "@/components/brand/BrandLogo";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "CrecyStudio | B2B Operations & Web Design",
  description: "Custom websites and workflow systems for local service businesses.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userEmail: string | null = null;
  let admin = false;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
    admin = await isAdminUser({ userId: user?.id ?? null, email: user?.email ?? null });
  } catch {
    userEmail = null;
    admin = false;
  }

  return (
    <html lang="en">
      <body>
        {/* Childish background layer divs have been entirely removed */}

        <div className="siteShell">
          <header className="topNav">
            <div className="topNavInner">
              
              {/* Custom SVG Brand Logo INJECTED HERE */}
              <BrandLogo showTag={true} />

              <nav className="navLinks">
                <Link href="/systems">Workflow Systems</Link>
                <Link href="/build">Custom Build</Link>
                <Link href="/portal">Client Portal</Link>
                {userEmail ? (
                  <>
                    {admin ? <Link href="/internal">Admin</Link> : null}
                    <form action="/auth/signout" method="post" style={{ display: "inline" }}>
                      <button type="submit" className="btn btnGhost" style={{ padding: "8px 12px" }}>
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login">Log in</Link>
                    <Link href="/signup" className="btn btnPrimary">Get Started</Link>
                  </>
                )}
              </nav>
            </div>
          </header>

          <div className="mainContent">{children}</div>

          {/* Dark Mode Site Footer INJECTED HERE */}
          <SiteFooter />
          
        </div>
      </body>
    </html>
  );
}
