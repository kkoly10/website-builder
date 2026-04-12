import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ maxWidth: 560 }}>
            <div className="brandLogoTitle">CrecyStudio</div>
            <p className="pDark">
              Website-first studio for high-trust marketing sites, operational systems,
              and e-commerce improvements managed through one client workspace.
            </p>
          </div>

          <div className="footerLinks">
            <Link href="/websites">Websites</Link>
            <Link href="/ecommerce">E-Commerce</Link>
            <Link href="/systems">Workflow Systems</Link>
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
          <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
        </div>
      </div>
    </footer>
  );
}
