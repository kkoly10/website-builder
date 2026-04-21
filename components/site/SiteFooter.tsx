import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footerInner">
        <div className="footerTop">
          <div className="footerIdentity">
            <p className="footerKicker">CrecyStudio</p>
            <p className="footerBlurb">
              Website-first studio for businesses that need a sharper first impression,
              cleaner operations, and one workspace to run the project.
            </p>
          </div>

          <div className="footerLinks" aria-label="Footer">
            <Link href="/websites">Websites</Link>
            <Link href="/ecommerce">E-commerce</Link>
            <Link href="/systems">Systems</Link>
            <Link href="/process">Process</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>

        <div className="footerBottom">
          <p>&copy; {new Date().getFullYear()} CrecyStudio. All rights reserved.</p>
          <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
        </div>
      </div>
    </footer>
  );
}
