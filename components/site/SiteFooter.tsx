import Link from "next/link";
// import ComingLaterLink from "./ComingLaterLink"; // Left commented out to prevent build errors if the file doesn't exist

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div 
          style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-start", 
            flexWrap: "wrap", 
            gap: 32 
          }}
        >
          {/* Brand & Mission */}
          <div style={{ maxWidth: 320 }}>
            <div style={{ fontWeight: 800, color: "var(--fg)", fontSize: 20, letterSpacing: "-0.02em" }}>
              CrecyStudio
            </div>
            <div style={{ marginTop: 12, color: "var(--muted)", lineHeight: 1.6 }}>
              I build professional websites and automated workflow systems for local businesses.
            </div>
          </div>

          {/* Navigation Links */}
          <div className="footerLinks" style={{ marginTop: 0, gap: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontWeight: 700, color: "var(--fg)", marginBottom: 4 }}>Services</div>
              <Link href="/systems" style={{ color: "var(--muted)", textDecoration: "none" }}>Workflow Systems</Link>
              <Link href="/build" style={{ color: "var(--muted)", textDecoration: "none" }}>Website Builds</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontWeight: 700, color: "var(--fg)", marginBottom: 4 }}>Client Hub</div>
              <Link href="/portal" style={{ color: "var(--muted)", textDecoration: "none" }}>Client Portal</Link>
              <Link href="/login" style={{ color: "var(--muted)", textDecoration: "none" }}>Log in</Link>
            </div>
          </div>
        </div>

        {/* Copyright & Contact */}
        <div 
          style={{ 
            marginTop: 48, 
            paddingTop: 24, 
            borderTop: "1px solid var(--stroke)", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            color: "var(--muted2)", 
            fontSize: 13 
          }}
        >
          <span>© {new Date().getFullYear()} CrecyStudio. All rights reserved.</span>
          
          {/* Wrapped in footerLinks class so the globals.css hover effect handles it automatically */}
          <div className="footerLinks" style={{ margin: 0 }}>
            <a 
              href="mailto:hello@crecystudio.com" 
              style={{ color: "var(--muted)", fontWeight: 600, textDecoration: "none", transition: "color 0.2s ease" }}
            >
              hello@crecystudio.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
