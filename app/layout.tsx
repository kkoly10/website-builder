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
        <div className="bgNebula" aria-hidden="true" />
        <div className="bgFx" aria-hidden="true" />
        <div className="bgFx2" aria-hidden="true" />
        <div className="bgFxSparkle" aria-hidden="true" />

        <div className="siteShell">
          <header className="topNav">
            <div className="topNavInner">
              <Link href="/" className="brand">
                <span className="brandMark">CS</span>
                <span className="brandText">CrecyStudio</span>
              </Link>
              <nav className="navLinks">
                <Link href="/systems">Workflow Systems</Link>
                <Link href="/build">Custom Build</Link>
                <Link href="/portal">Client Portal</Link>
                {userEmail ? (
                  <>
                    {admin ? <Link href="/internal">Admin</Link> : null}
                    <form action="/auth/signout" method="post" style={{ display: "inline" }}>
                      <button type="submit" className="btn btnGhost" style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)" }}>
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
          <footer className="footer">
            <div className="container">
              <div style={{ fontWeight: 900 }}>CrecyStudio</div>
              <div style={{ marginTop: 6 }}>Custom websites and workflow systems.</div>
              <div className="footerLinks">
                <Link href="/">Home</Link>
                <Link href="/systems">Workflow Systems</Link>
                <Link href="/build">Custom Build</Link>
                <Link href="/portal">Client Portal</Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
