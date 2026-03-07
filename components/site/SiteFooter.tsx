// components/site/SiteFooter.tsx
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div >
            <div className="brandLogoTitle">CrecyStudio</div>
            <p className="pDark">
              CrecyStudio delivers conversion-focused websites and
              automation-driven workflow systems for growth-focused local
              businesses.
            </p>
          </div>

          <div className="footerLinks">
            <Link href="/systems">Workflow Systems</Link>
            <Link href="/ecommerce">E-Commerce Ops</Link>
            <Link href="/build/intro">Custom Build</Link>
            <Link href="/process">How It Works</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/portal">Client Portal</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>

        <hr />

        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>&copy; {new Date().getFullYear()} CrecyStudio. All rights reserved.</div>
          <div className="footerLinks">
            <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
