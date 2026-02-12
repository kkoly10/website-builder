import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CrecyStudio — Custom Websites",
  description:
    "Professional websites with transparent tier pricing, clear scope, and fast delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/* Background FX */}
        <div className="bgFx" aria-hidden="true" />
        <div className="starfield" aria-hidden="true" />

        {/* Top Nav */}
        <header className="topNav">
          <div className="container navInner">
            <Link href="/" className="brand">
              <span className="brandMark" aria-hidden="true" />
              <span className="brandText">CrecyStudio</span>
              <span className="brandTag">Custom builds • Obsidian Edition</span>
            </Link>

            <nav className="navLinks">
              <Link href="/" className="navLink">
                Home
              </Link>
              <Link href="/estimate" className="navLink">
                Estimate
              </Link>
              <Link href="/dashboard" className="navLink">
                Dashboard
              </Link>
              <Link href="/build" className="navLink navCta">
                Get a Quote <span className="btnArrow">→</span>
              </Link>
            </nav>
          </div>
        </header>

        {children}

        {/* Footer */}
        <footer className="footer">
          <div className="container footerInner">
            <div className="footerLeft">
              <div className="footerBrand">© {new Date().getFullYear()} CrecyStudio.</div>
              <div className="footerSub">Built to convert. Clear scope. Clean builds.</div>
            </div>
            <div className="footerLinks">
              <Link className="footerLink" href="/">
                Home
              </Link>
              <Link className="footerLink" href="/estimate">
                Estimate
              </Link>
              <a className="footerLink" href="mailto:hello@crecystudio.com">
                hello@crecystudio.com
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}