import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CrecyStudio",
  description: "Website design quotes, planning, and project portal.",
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
    // Keep layout rendering even if auth client fails temporarily
  }

  return (
    <html lang="en">
      <body>
        <div className="siteShell">
          <header className="topNav">
            <div className="topNavInner">
              <Link href="/" className="brand">
                <span className="brandMark">C</span>
                <span>
                  <strong>CrecyStudio</strong>
                  <span style={{ display: "block", opacity: 0.8, fontSize: 12 }}>
                    Websites • Quotes • Client Portal
                  </span>
                </span>
              </Link>

              <nav className="navLinks" aria-label="Main navigation">
                <Link href="/">Home</Link>
                <Link href="/build">Build</Link>
                <Link href="/estimate">Estimate</Link>
                <Link href="/systems">Systems</Link>

                {userEmail ? (
                  <>
                    <Link href="/portal">Dashboard</Link>
                    {isAdmin ? <Link href="/internal">Internal Admin</Link> : null}

                    <span
                      style={{
                        fontSize: 12,
                        opacity: 0.8,
                        marginLeft: 8,
                        whiteSpace: "nowrap",
                      }}
                      title={userEmail}
                    >
                      {userEmail}
                    </span>

                    <form action="/auth/signout" method="post" style={{ display: "inline" }}>
                      <button
                        type="submit"
                        className="btn btnGhost"
                        style={{ marginLeft: 8 }}
                      >
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login">Login</Link>
                    <Link href="/signup" className="btn btnPrimary">
                      Create account
                    </Link>
                    <Link href="/internal" className="btn btnGhost">
                      Internal Admin
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>

          <main>{children}</main>

          <footer className="footer">
            <div>© {year} CrecyStudio</div>
            <div className="footerLinks">
              <Link href="/">Home</Link>
              <Link href="/build">Build</Link>
              <Link href="/estimate">Estimate</Link>
              <Link href="/systems">Systems</Link>
              {userEmail ? (
                <>
                  <Link href="/portal">Dashboard</Link>
                  {isAdmin ? <Link href="/internal">Internal Admin</Link> : null}
                  <form action="/auth/signout" method="post" style={{ display: "inline" }}>
                    <button
                      type="submit"
                      style={{
                        background: "none",
                        border: "none",
                        color: "inherit",
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login">Login</Link>
                  <Link href="/signup">Create account</Link>
                  <Link href="/internal">Internal Admin</Link>
                </>
              )}
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}