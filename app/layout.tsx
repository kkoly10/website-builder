import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Website Builder — Quotes & AI",
  description:
    "Professional websites with transparent pricing, clear scope, and fast delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Background FX */}
        <div className="bgFx" aria-hidden="true" />

        {/* Top Nav */}
        <header className="topNav">
          <div className="container navInner">
            <Link href="/" className="brand">
              <span className="brandMark" aria-hidden="true" />
              <span className="brandText">Website Builder</span>
            </Link>

            <nav className="navLinks">
              <Link href="/build" className="navLink">Custom</Link>
              <Link href="/ai" className="navLink">AI</Link>
              <Link href="/estimate" className="navLink">Estimate</Link>
              <Link href="/dashboard" className="navLink">Dashboard</Link>
            </nav>

            <div className="navCtas">
              <Link href="/build" className="btn btnPrimary">Start →</Link>
            </div>
          </div>
        </header>

        {/* Page */}
        <div className="container pageWrap">{children}</div>

        {/* Footer */}
        <footer className="footer">
          <div className="container footerInner">
            <div className="footerLeft">
              <div className="footerBrand">
                <span className="brandMark" aria-hidden="true" />
                <span>Website Builder</span>
              </div>
              <div className="footerMuted">
                Transparent scope • Clear revisions • No surprises
              </div>
            </div>

            <div className="footerRight">
              <Link href="/coming-soon" className="footerLink">E-commerce support</Link>
              <a className="footerLink" href="mailto:hello@example.com">Contact</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
