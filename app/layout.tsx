import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

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
            <Link href="/" className="brand" aria-label="Go to homepage">
              <span className="brandMark" aria-hidden="true" />
              <span className="brandText">Website Builder</span>
            </Link>

            <nav className="navLinks" aria-label="Primary navigation">
              <Link href="/build" className="navLink">
                Custom
              </Link>
              <Link href="/ai" className="navLink">
                AI
              </Link>
              <Link href="/estimate" className="navLink">
                Estimate
              </Link>
              <Link href="/dashboard" className="navLink">
                Dashboard
              </Link>
            </nav>

            <div className="navCtas">
              <a className="btn btnGhost" href="mailto:hello@example.com">
                Contact
              </a>
              <Link className="btn btnPrimary" href="/build">
                Start →
              </Link>
            </div>
          </div>
        </header>

        {/* Page */}
        {children}

        {/* Footer */}
        <footer className="footer">
          <div className="container footerInner">
            <div className="footerLeft">
              <div className="footerBrand">
                <span className="brandMark" aria-hidden="true" />
                <span className="footerTitle">Website Builder</span>
              </div>
              <div className="footerMeta">
                Transparent scope · Clear revisions · Fast delivery
              </div>
            </div>

            <div className="footerRight">
              <Link href="/estimate" className="footerLink">
                Get an estimate
              </Link>
              <Link href="/build" className="footerLink">
                Custom build
              </Link>
              <Link href="/ai" className="footerLink">
                AI option
              </Link>
              <a href="mailto:hello@example.com" className="footerLink">
                Email
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
