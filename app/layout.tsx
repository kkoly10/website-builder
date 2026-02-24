// app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import BrandLogo from "@/components/brand/BrandLogo";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CrecyStudio",
  description: "Professional websites, clear pricing, and client portal.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const year = new Date().getFullYear();

  let userEmail: string | null = null;
  let isAdmin = false;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userEmail = user?.email ?? null;
    isAdmin = isAdminEmail(userEmail);
  } catch {
    // keep rendering if auth is temporarily unavailable
  }

  return (
    <html lang="en">
      <body>
        <div className="bgFx" aria-hidden="true" />
        <div className="siteShell">
          <header className="topNav">
            <div className="container topNavInner">
              <BrandLogo />

              <div className="navCluster">
                <nav className="navMain" aria-label="Main navigation">
                  <Link href="/build" className="navLink">
                    Custom Build
                  </Link>
                  <Link href="/estimate" className="navLink">
                    Pricing
                  </Link>
                  <Link href="/portal" className="navLink">
                    Client Portal
                  </Link>
                </nav>

                <div className="navActions">
                  {userEmail ? (
                    <>
                      <span className="badge" title={userEmail}>
                        {userEmail}
                      </span>

                      {isAdmin ? (
                        <Link href="/internal" className="btn btnGhost btnSm">
                          Internal Admin
                        </Link>
                      ) : null}

                      <form action="/auth/signout" method="post">
                        <button type="submit" className="btn btnGhost btnSm">
                          Sign out
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="btn btnGhost btnSm">
                        Login
                      </Link>
                      <Link href="/build" className="btn btnPrimary btnSm">
                        Get Estimate
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="siteMain">{children}</main>

          <footer className="footer">
            <div className="container">
              <div className="footerWrap">
                <div className="footerBrandCol">
                  <BrandLogo showTag={false} />
                  <div className="footerBrandText">Custom Websites • Clear Revisions • Fast Turnaround</div>

                  <div className="footerTagRow">
                    <span className="badge">Virginia</span>
                    <span className="badge">Fast turnaround</span>
                    <span className="badge">Clear revisions</span>
                  </div>
                </div>

                <div className="footerCols">
                  <div className="footerCol">
                    <div className="footerHead">Explore</div>
                    <Link href="/build">Custom Build</Link>
                    <Link href="/estimate">Pricing / Estimate</Link>
                    <Link href="/portal">Client Portal</Link>
                    <Link href="/systems">Workflow Systems</Link>
                  </div>

                  <div className="footerCol">
                    <div className="footerHead">Access</div>
                    {!userEmail ? (
                      <>
                        <Link href="/login">Login</Link>
                        <Link href="/signup">Create account</Link>
                      </>
                    ) : (
                      <>
                        <Link href="/portal">Dashboard</Link>
                        {isAdmin ? <Link href="/internal">Internal Admin</Link> : null}
                        <form action="/auth/signout" method="post">
                          <button type="submit" className="footerLinkButton">
                            Sign out
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="footerBottom">
                <span>© {year} CrecyStudio</span>
                <span>Scope-first pricing • Professional delivery</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}