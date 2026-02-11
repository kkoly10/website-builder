import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Crecy Studio",
  description:
    "Professional websites with transparent pricing, clear scope, and fast delivery.",
};

// Change this to try themes:
// "graphite-lime" | "white-blue" | "mono" | "cyber-teal"
const THEME = "graphite-lime";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme={THEME}>
      <body>
        <div className="bgFx" aria-hidden="true" />

        <header className="topNav">
          <div className="container navInner">
            <Link href="/" className="brand">
              <span className="brandMark" aria-hidden="true" />
              <span>Crecy Studio</span>
            </Link>

            <nav className="navLinks">
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
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
