// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CrecyStudio — Websites & AI",
  description: "Professional websites with transparent pricing and fast delivery.",
};

const THEME = process.env.NEXT_PUBLIC_THEME || "graphite-lime";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`theme-${THEME}`}>
      <body>
        {/* Background FX */}
        <div className="bgFx" aria-hidden="true" />

        {/* Top Nav */}
        <header className="topNav">
          <div className="container navInner">
            <Link href="/" className="brand">
              <span className="brandMark" aria-hidden="true" />
              <span className="brandText">CrecyStudio</span>
              <span className="brandDot" aria-hidden="true" />
            </Link>

            <nav className="navLinks">
              <Link href="/build" className="navLink">Custom</Link>
              <Link href="/ai" className="navLink">AI</Link>
              <Link href="/estimate" className="navLink">Estimate</Link>
              <Link href="/dashboard" className="navLink">Dashboard</Link>
            </nav>
          </div>
        </header>

        {/* Page */}
        <div className="page">
          {children}
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="container footerInner">
            <div className="footerLeft">
              <div className="footerBrand">CrecyStudio</div>
              <div className="footerMuted">Websites · AI · Automations</div>
            </div>

            <div className="footerRight">
              <a className="footerLink" href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
              <span className="footerSep">•</span>
              <a className="footerLink" href="/">crecystudio.com</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
