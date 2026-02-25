import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CrecyStudio",
  description: "Custom websites and workflow systems for local businesses",
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userEmail = user?.email ?? null;
    admin = await isAdminUser({ userId: user?.id ?? null, email: user?.email ?? null });
  } catch {
    // fail safe: render public nav
    userEmail = null;
    admin = false;
  }

  return (
    <html lang="en">
      <body>
        {/* Global animated background layers (match globals.css) */}
        <div className="bgNebula" aria-hidden="true" />
        <div className="bgFx" aria-hidden="true" />
        <div className="bgFx2" aria-hidden="true" />
        <div className="bgFxSparkle" aria-hidden="true" />

        <div className="siteShell">
          {/* Top Navigation (match globals.css class names) */}
          <header className="topNav">
            <div className="topNavInner">
              <Link href="/" className="brand" aria-label="CrecyStudio home">
                <span className="brandMark" aria-hidden="true">
                  CS
                </span>
                <span className="brandText">CrecyStudio</span>
              </Link>

              <nav className="navLinks" aria-label="Primary navigation">
                <Link href="/systems">Workflow Systems</Link>
                <Link href="/build">Custom Build</Link>
                <Link href="/pricing">Pricing</Link>
                <Link href="/portal">Client Portal</Link>

                {userEmail ? (
                  <>
                    {admin ? <Link href="/internal">Admin</Link> : null}

                    <form action="/auth/signout" method="post" style={{ display: "inline" }}>
                      <button
                        type="submit"
                        className="btn btnGhost"
                        style={{
                          padding: "10px 14px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.04)",
                          color: "rgba(255,255,255,0.86)",
                        }}
                      >
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login">Log in</Link>
                    <Link href="/signup">Sign up</Link>
                    <Link href="/build" className="btn btnPrimary">
                      Get Estimate
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>

          {/* Main content wrapper (match globals.css) */}
          <div className="mainContent">{children}</div>

          {/* Footer (match globals.css) */}
          <footer className="footer">
            <div className="container">
              <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.88)" }}>
                CrecyStudio
              </div>
              <div style={{ marginTop: 6 }}>
                Custom websites and workflow systems for local businesses.
              </div>

              <div className="footerLinks">
                <Link href="/">Home</Link>
                <Link href="/systems">Workflow Systems</Link>
                <Link href="/build">Custom Build</Link>
                <Link href="/pricing">Pricing</Link>
                <Link href="/portal">Client Portal</Link>
                {admin ? <Link href="/internal">Admin</Link> : null}
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}