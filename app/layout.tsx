import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CrecyStudio — Custom Websites",
  description:
    "Professional websites with transparent pricing, clear scope, and fast delivery. Wix, Squarespace, or Custom (Next.js).",
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
        <div className="bgNoise" aria-hidden="true" />

        {/* Top Nav */}
        <header className="topNav">
          <div className="container navInner">
            <Link href="/" className="brand" aria-label="CrecyStudio Home">
              <span className="logoMark" aria-hidden="true">
                <span className="logoRing" />
                <span className="logoCS">C</span>
              </span>
              <span className="brandText">
                Crecy<span className="accentText">Studio</span>
                <span className="brandSub">Custom Websites</span>
              </span>
            </Link>

            <nav className="navLinks" aria-label="Primary">
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

            <div className="navCtas">
              <Link href="/estimate" className="btn btnPrimary">
                Get Estimate
              </Link>
            </div>
          </div>
        </header>

        {/* Page */}
        <div className="page">{children}</div>

        {/* Footer */}
        <footer className="footer">
          <div className="container footerInner">
            <div className="footerBrand">
              <div className="footerLogo" aria-hidden="true">
                <span className="logoRing" />
                <span className="logoCS">C</span>
              </div>
              <div>
                <div className="footerTitle">CrecyStudio</div>
                <div className="footerMuted">
                  Custom websites on Wix, Squarespace, or Next.js.
                </div>
              </div>
            </div>

            <div className="footerCols">
              <div className="footerCol">
                <div className="footerHead">Explore</div>
                <Link href="/build" className="footerLink">
                  Custom Build
                </Link>
                <Link href="/estimate" className="footerLink">
                  Pricing / Estimate
                </Link>
                <Link href="/dashboard" className="footerLink">
                  Client Portal
                </Link>
              </div>

              <div className="footerCol">
                <div className="footerHead">Service Area</div>
                <div className="footerMuted">Virginia (Remote OK)</div>
                <div className="footerMuted">Fast turnaround</div>
              </div>

              <div className="footerCol">
                <div className="footerHead">Contact</div>
                <a className="footerLink" href="mailto:hello@crecystudio.com">
                  hello@crecystudio.com
                </a>
                <div className="footerMuted">Response: same day</div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
