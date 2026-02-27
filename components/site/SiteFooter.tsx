// components/site/SiteFooter.tsx
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ fontWeight: 900, fontSize: 16, color: "var(--fg)" }}>CrecyStudio</div>
            <div className="pDark" style={{ marginTop: 10 }}>
              I build professional websites and automated workflow systems for local businesses.
            </div>
          </div>

          <div className="footerLinks" style={{ justifyContent: "flex-end" }}>
            <Link href="/systems">Workflow Systems</Link>
            <Link href="/build">Website Quote</Link>
            <Link href="/portal">Client Portal</Link>
          </div>
        </div>

        <hr style={{ margin: "20px 0" }} />

        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>© {new Date().getFullYear()} CrecyStudio. All rights reserved.</div>
          <div className="footerLinks">
            <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
          </div>
        </div>
      </div>
    </footer>
  );
}