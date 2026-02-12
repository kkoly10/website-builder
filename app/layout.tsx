import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CrecyStudio — Custom Websites",
  description:
    "Custom websites built with clear scope, transparent tiers, and a professional process.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Change theme here:
  // theme-lux | theme-carbon | theme-ink | theme-obsidian | theme-graphite
  const themeClass = "theme-graphite";

  return (
    <html lang="en" className={themeClass}>
      <body>
        {/* Background FX */}
        <div className="bgFX" aria-hidden="true">
          <div className="bgFX__grid" />
          <div className="bgFX__glow bgFX__glow--a" />
          <div className="bgFX__glow bgFX__glow--b" />
          <div className="bgFX__noise" />
        </div>

        {/* Top nav */}
        <header className="topNav">
          <div className="container navInner">
            <Link href="/" className="brand">
              <span className="brandMark" aria-hidden="true" />
              <span className="brandText">
                <span className="brandName">CrecyStudio</span>
                <span className="brandTag">Custom Websites</span>
              </span>
            </Link>

            <nav className="navLinks">
              <Link href="/build" className="navLink">
                Custom Build
              </Link>
              <Link href="/estimate" className="navLink">
                Pricing
              </Link>
              <Link href="/dashboard" className="navLink">
                Client Portal
              </Link>
            </nav>

            <div className="navCTA">
              <Link href="/estimate" className="btn btnPrimary">
                Get Estimate <span className="btnArrow">→</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="page">{children}</main>

        {/* Footer */}
        <footer className="footer">
          <div className="container footerInner">
            <div className="footerLeft">
              <div className="footerBrand">
                <span className="brandMark brandMark--sm" aria-hidden="true" />
                <div className="footerBrandText">
                  <div className="footerTitle">CrecyStudio</div>
                  <div className="footerMuted">
                    Custom websites with clear scope & revisions.
                  </div>
                </div>
              </div>

              <div className="footerMini">
                <span className="chip">Virginia</span>
                <span className="chip">Delivery-ready</span>
                <span className="chip">Fast turnaround</span>
              </div>
            </div>

            <div className="footerRight">
              <div className="footerCol">
                <div className="footerHead">Explore</div>
                <Link className="footerLink" href="/build">
                  Custom Build
                </Link>
                <Link className="footerLink" href="/estimate">
                  Pricing / Estimate
                </Link>
                <Link className="footerLink" href="/dashboard">
                  Client Portal
                </Link>
              </div>

              <div className="footerCol">
                <div className="footerHead">Contact</div>
                <a className="footerLink" href="mailto:couranr@couranauto.com">
                  couranr@couranauto.com
                </a>
                <a className="footerLink" href="tel:+17033819462">
                  (703) 381-9462
                </a>
              </div>
            </div>
          </div>

          <div className="container footerBottom">
            <span className="footerMuted">
              © {new Date().getFullYear()} CrecyStudio. All rights reserved.
            </span>
            <span className="footerMuted">
              Built for clarity, not surprises.
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
