import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Builder",
  description: "Scope, estimate, and build modern websites fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={body}>
        <div style={bgGlow} aria-hidden="true" />

        <header style={header}>
          <div style={headerInner}>
            <a href="/" style={brand}>
              <span style={brandMark}>◆</span>
              <span>Website Builder</span>
            </a>

            <nav style={nav}>
              <a href="/build" style={navLink}>
                Build
              </a>
              <a href="/estimate" style={navLink}>
                Estimate
              </a>
              <a href="/dashboard" style={navLink}>
                Dashboard
              </a>
              <a href="/coming-soon" style={navLinkMuted}>
                Coming Soon
              </a>
            </nav>
          </div>
        </header>

        <main style={main}>{children}</main>

        <footer style={footer}>
          <div style={footerInner}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 900, color: "#0B1220" }}>
                Website Builder
              </div>
              <div style={{ color: "#6B7280", fontSize: 13, lineHeight: 1.6 }}>
                Fast scoping + clean estimates + a guided build process.
              </div>
            </div>

            <div style={footerLinks}>
              <a href="/" style={footerLink}>
                Home
              </a>
              <a href="/build" style={footerLink}>
                Build
              </a>
              <a href="/estimate" style={footerLink}>
                Estimate
              </a>
              <a href="/dashboard" style={footerLink}>
                Dashboard
              </a>
            </div>
          </div>

          <div style={footerBottom}>
            <span style={{ color: "#6B7280" }}>
              © {new Date().getFullYear()} Website Builder
            </span>
            <span style={{ color: "#9CA3AF" }}>
              Built with Next.js
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}

/* ---------------- STYLES ---------------- */

const body: React.CSSProperties = {
  margin: 0,
  background: "#F7F8FA",
  color: "#0B1220",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
};

const bgGlow: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(800px 400px at 20% 10%, rgba(17,24,39,0.08), transparent 60%), radial-gradient(700px 380px at 80% 0%, rgba(99,102,241,0.08), transparent 55%)",
};

const header: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  background: "rgba(247,248,250,0.75)",
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid rgba(229,231,235,0.9)",
};

const headerInner: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "14px 18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
};

const brand: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  textDecoration: "none",
  color: "#0B1220",
  fontWeight: 950,
  letterSpacing: -0.2,
};

const brandMark: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 10,
  background: "#0B1220",
  color: "#fff",
  fontSize: 14,
  fontWeight: 900,
};

const nav: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const navLink: React.CSSProperties = {
  textDecoration: "none",
  color: "#0B1220",
  fontWeight: 800,
  fontSize: 13,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(229,231,235,0.9)",
  background: "#fff",
};

const navLinkMuted: React.CSSProperties = {
  ...navLink,
  color: "#6B7280",
  background: "rgba(255,255,255,0.7)",
};

const main: React.CSSProperties = {
  minHeight: "70vh",
};

const footer: React.CSSProperties = {
  marginTop: 40,
  borderTop: "1px solid rgba(229,231,235,0.9)",
  background: "#fff",
};

const footerInner: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "24px 18px",
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  flexWrap: "wrap",
};

const footerLinks: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const footerLink: React.CSSProperties = {
  textDecoration: "none",
  color: "#111827",
  fontWeight: 800,
  fontSize: 13,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(229,231,235,0.9)",
  background: "#F9FAFB",
};

const footerBottom: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "14px 18px",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  borderTop: "1px solid rgba(229,231,235,0.9)",
};
