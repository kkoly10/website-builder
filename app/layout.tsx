import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrecyStudio",
  description: "Website design quotes, planning, and project portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const year = new Date().getFullYear();

  return (
    <html lang="en">
      <body>
        <div className="siteShell">
          <header className="topNav">
            <div className="navLeft">
              <Link href="/" className="brandMark" aria-label="CrecyStudio home">
                C
              </Link>
              <div className="brandText">
                <div style={{ fontWeight: 900, lineHeight: 1 }}>CrecyStudio</div>
                <div style={{ opacity: 0.75, fontSize: 12 }}>
                  Websites • Quotes • Client Portal
                </div>
              </div>
            </div>

            <div
              className="navRight"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <Link href="/" className="topLink">
                Home
              </Link>
              <Link href="/build" className="topLink">
                Build
              </Link>
              <Link href="/estimate" className="topLink">
                Estimate
              </Link>

              {/* Auth buttons (visible on homepage now) */}
              <Link href="/login" className="btn btnGhost">
                Login
              </Link>
              <Link href="/signup" className="btn btnPrimary">
                Create account
              </Link>
            </div>
          </header>

          <main>{children}</main>

          <footer className="footer">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span>© {year} CrecyStudio</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <Link href="/login" className="topLink">
                Login
              </Link>
              <Link href="/signup" className="topLink">
                Create account
              </Link>
              <Link href="/internal/admin" className="topLink">
                Internal Admin
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}