import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrecyStudio",
  description: "CrecyStudio — AI-assisted website quotes and project portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            backdropFilter: "blur(10px)",
            background: "rgba(10,10,12,0.75)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/"
              style={{
                fontWeight: 900,
                letterSpacing: 0.2,
                textDecoration: "none",
                color: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              CrecyStudio
            </Link>

            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Link href="/" style={navLink}>
                Home
              </Link>
              <Link href="/estimate" style={navLink}>
                Estimate
              </Link>
              <Link href="/dashboard" style={navLink}>
                Dashboard
              </Link>
              <Link href="/internal/admin" style={navLink}>
                Internal Admin
              </Link>
            </nav>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Link href="/login" style={ghostBtn}>
                Login
              </Link>
              <Link href="/signup" style={ghostBtn}>
                Create Account
              </Link>
              <Link href="/build" style={primaryBtn}>
                Get a Quote →
              </Link>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            marginTop: 32,
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              padding: "18px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              fontSize: 13,
              opacity: 0.85,
            }}
          >
            <div>© {new Date().getFullYear()} CrecyStudio</div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/login" style={footerLink}>
                Login
              </Link>
              <Link href="/signup" style={footerLink}>
                Create Account
              </Link>
              <Link href="/dashboard" style={footerLink}>
                Dashboard
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

const navLink: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  padding: "6px 8px",
  borderRadius: 8,
  opacity: 0.95,
  fontSize: 14,
};

const footerLink: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  opacity: 0.9,
};

const ghostBtn: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.03)",
  padding: "8px 10px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const primaryBtn: React.CSSProperties = {
  textDecoration: "none",
  color: "#111",
  background: "linear-gradient(135deg, #ffb347, #ff7a18)",
  padding: "8px 12px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap",
};