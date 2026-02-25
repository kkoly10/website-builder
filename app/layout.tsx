import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
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
  let isAdmin = false;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userEmail = user?.email ?? null;
    isAdmin = await isAdminUser({ userId: user?.id ?? null, email: user?.email ?? null });
  } catch {
    // keep safe fallback state
  }

  return (
    <html lang="en">
      <body>
        <header className="siteHeader">
          <div className="siteHeaderInner">
            <Link href="/" className="brand" aria-label="CrecyStudio home">
              <span className="brandDot" aria-hidden="true" />
              <span className="brandText">CrecyStudio</span>
            </Link>

            <nav className="siteNav" aria-label="Primary">
              <Link href="/systems">Workflow Systems</Link>
              <Link href="/build">Website Quotes</Link>
              <Link href="/portal">Portal</Link>

              {userEmail ? (
                <>
                  {isAdmin ? <Link href="/internal">Admin</Link> : null}
                  <form action="/auth/signout" method="post" style={{ display: "inline" }}>
                    <button
                      type="submit"
                      className="navButton"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "inherit",
                        cursor: "pointer",
                        padding: 0,
                        font: "inherit",
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
                </>
              )}
            </nav>
          </div>
        </header>

        {children}

        <footer className="footer">
          <div>© 2026 CrecyStudio. Websites + workflow systems.</div>
          <div className="footerLinks">
            <Link href="/">Home</Link>
            <Link href="/systems">Workflow Systems</Link>
            <Link href="/build">Website Quotes</Link>
            <Link href="/portal">Portal</Link>
            <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
