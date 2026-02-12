import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CrecyStudio — Websites that convert",
  description:
    "Custom websites with clear scope, transparent pricing, and fast delivery. Built by a human — supported by smart tools.",
};

function LogoMark() {
  // Monogram-style “CS” mark (works for app icon later)
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="g" x1="6" y1="6" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6A2A" />
          <stop offset="1" stopColor="#FFA56B" />
        </linearGradient>
        <filter id="glow" x="-20" y="-20" width="84" height="84" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="2" y="2" width="40" height="40" rx="14" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.14)" />
      <path
        d="M29.5 16.2c-1.5-1.5-3.8-2.2-6.8-2.2-5.3 0-9 3.1-9 8.2 0 5.2 3.7 8.2 9.1 8.2 3 0 5.4-.8 7.1-2.4"
        stroke="url(#g)"
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#glow)"
      />
      <path
        d="M30.2 19.2c-1.0-1.0-2.8-1.7-5.2-1.7-3.7 0-6.0 2.1-6.0 5.0 0 3.0 2.3 5.0 6.1 5.0 2.4 0 4.2-.7 5.3-1.8"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
              <LogoMark />
              <span className="brandText">
                <span className="brandName">CrecyStudio</span>
                <span className="brandTag">Custom builds • Obsidian Edition</span>
              </span>
            </Link>

            <nav className="navLinks" aria-label="Primary">
              <Link href="/build" className="navLink">Custom</Link>
              <Link href="/estimate" className="navLink">Estimate</Link>
              <Link href="/dashboard" className="navLink">Dashboard</Link>
              <Link href="/build" className="navCta">Get a Quote →</Link>
            </nav>
          </div>
        </header>

        {children}

        <footer className="footer">
          <div className="container" style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div>© {new Date().getFullYear()} CrecyStudio. Built to convert.</div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/" aria-label="Home">Home</Link>
              <Link href="/estimate" aria-label="Estimate">Estimate</Link>
              <a href="mailto:hello@crecystudio.com" aria-label="Email">hello@crecystudio.com</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}