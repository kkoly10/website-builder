import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CrecyStudio",
  description: "Custom websites and workflow systems with clear pricing and client portal access.",
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
    // Keep layout rendering if auth is temporarily unavailable
  }

  return (
    <html lang="en">
      <body>
        <div className="bgFx" aria-hidden="true" />
        <div className="siteShell">
          <header className="topNav">
            <div className="container topNavInner">
              <Link href="/" className="brand" aria-label="CrecyStudio home">
                <span className="brandLogoWrap">
                  <Image
                    src="/brand/crecy_logo_mark_tight.png"
                    alt="CrecyStudio logo"
                    width={42}
                    height={42}
                    className="brandLogo"
                    priority
                  />
                </span>

                <span className="brandCopy">
                  <span className="brandTitle">CrecyStudio</span>
                  <span className="brandSubtitle">Custom Websites • Ops Systems</span>
                </span>
              </Link>

              <div className="navCluster">
                <nav className="navLinks" aria-label="Main navigation">
                  <Link href="/" className="navItem">
                    Home
                  </Link>
                  <Link href="/build" className="navItem">
                    Website Build
                  </Link>
                  <Link href="/systems" className="navItem">
                    Ops Systems
                  </Link>
                  <Link href="/pricing" className="navItem">
                    Pricing
                  </Link>
                  <Link href="/portal" className="navItem">
                    Client Portal
                  </Link>
                </nav>

                <div className="navActions">
                  {userEmail ? (
                    <>
                      <span className="navUserEmail" title={userEmail}>
                        {userEmail}
                      </span>

                      {isAdmin ? (
                        <Link href="/internal" className="btn btnGhost navBtn">
                          Admin
                        </Link>
                      ) : null}

                      <form action="/auth/signout" method="post">
                        <button type="submit" className="btn btnGhost navBtn">
                          Sign out
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="btn btnGhost navBtn">
                        Login
                      </Link>
                      <Link href="/signup" className="btn btnPrimary navBtn">
                        Create account
                      </Link>
                      <Link href="/estimate" className="btn btnGhost navBtn">
                        Get estimate
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main>{children}</main>

          <footer className="footer">
            <div className="container footerInner">
              <div className="footerTop">
                <div className="footerBrandBlock">
                  <div className="footerBrandRow">
                    <Image
                      src="/brand/crecy_logo_mark_tight.png"
                      alt="CrecyStudio"
                      width={34}
                      height={34}
                      className="footerLogo"
                    />
                    <div>
                      <div className="footerBrandTitle">CrecyStudio</div>
                      <div className="footerBrandSub">Websites • Workflow Systems • Client Portal</div>
                    </div>
                  </div>

                  <p className="footerBlurb">
                    Scope-first builds for service businesses: websites, automation workflows, and client-facing project portals.
                  </p>
                </div>

                <div className="footerCols">
                  <div className="footerCol">
                    <div className="footerColTitle">Services</div>
                    <Link href="/build" className="footerLink">Website Build</Link>
                    <Link href="/systems" className="footerLink">Ops Systems</Link>
                    <Link href="/estimate" className="footerLink">Website Estimate</Link>
                    <Link href="/pricing" className="footerLink">Pricing</Link>
                  </div>

                  <div className="footerCol">
                    <div className="footerColTitle">Portal</div>
                    <Link href="/portal" className="footerLink">Client Portal</Link>
                    <Link href="/login" className="footerLink">Login</Link>
                    <Link href="/signup" className="footerLink">Create Account</Link>
                    {isAdmin ? <Link href="/internal" className="footerLink">Internal Admin</Link> : null}
                  </div>

                  <div className="footerCol">
                    <div className="footerColTitle">Contact</div>
                    <div className="footerText">Virginia (DMV)</div>
                    <div className="footerText">Fast turnaround</div>
                    <div className="footerText">Clear revision policy</div>
                  </div>
                </div>
              </div>

              <div className="footerBottom">
                <span>© {year} CrecyStudio</span>

                <div className="footerBottomLinks">
                  <Link href="/" className="footerBottomLink">Home</Link>
                  <Link href="/build" className="footerBottomLink">Build</Link>
                  <Link href="/systems" className="footerBottomLink">Systems</Link>
                  <Link href="/portal" className="footerBottomLink">Portal</Link>

                  {userEmail ? (
                    <form action="/auth/signout" method="post">
                      <button type="submit" className="linkButton">
                        Sign out
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}