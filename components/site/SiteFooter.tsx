import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function SiteFooter() {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");

  return (
    <footer className="footer">
      <div className="container footerInner">
        <div className="footerIdentity">
          <p className="footerKicker">{tCommon("siteName")}</p>
          <p className="footerBlurb">{t("blurb")}</p>
          {/*
            Visible address is a strong local-SEO signal — Google
            cross-references the structured-data PostalAddress with
            what humans see on the page. Listed alongside the
            service area so the local pack picks up both signals.
            Kept to city/state to match the LocalBusiness schema
            (no street per founder preference).
          */}
          <p className="footerAddress">{t("address")}</p>
          <p className="footerServiceArea">{t("serviceArea")}</p>
        </div>

        <nav className="footerColumns" aria-label={t("links.aria")}>
          <div className="footerColumn">
            <h3 className="footerColumnHeading">{t("links.columnServices")}</h3>
            <ul>
              <li><Link href="/websites">{t("links.websites")}</Link></li>
              <li><Link href="/ai-integration">{t("links.aiIntegration")}</Link></li>
              <li><Link href="/custom-web-apps">{t("links.customWebApps")}</Link></li>
              <li><Link href="/systems">{t("links.systems")}</Link></li>
              <li><Link href="/ecommerce">{t("links.ecommerce")}</Link></li>
              <li><Link href="/client-portals">{t("links.clientPortals")}</Link></li>
              <li><Link href="/website-rescue">{t("links.websiteRescue")}</Link></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h3 className="footerColumnHeading">{t("links.columnStudio")}</h3>
            <ul>
              <li><Link href="/process">{t("links.process")}</Link></li>
              <li><Link href="/work">{t("links.work")}</Link></li>
              <li><Link href="/about">{t("links.about")}</Link></li>
              <li><Link href="/care-plans">{t("links.carePlans")}</Link></li>
              <li><Link href="/pricing">{t("links.pricing")}</Link></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h3 className="footerColumnHeading">{t("links.columnResources")}</h3>
            <ul>
              {/* Blog is English-only — force locale="en" so /fr and /es
                  don't route to non-existent /fr/blog and 404. */}
              <li><Link href="/blog" locale="en">{t("links.blog")}</Link></li>
              <li><Link href="/faq">{t("links.faq")}</Link></li>
              {/* /locations is English-only too — same forcing as /blog. */}
              <li><Link href="/locations" locale="en">{t("links.locations")}</Link></li>
              <li><Link href="/coming-soon">{t("links.futureServices")}</Link></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h3 className="footerColumnHeading">{t("links.columnGetStarted")}</h3>
            <ul>
              <li><Link href="/start">{t("links.start")}</Link></li>
              <li><Link href="/contact">{t("links.contact")}</Link></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h3 className="footerColumnHeading">{t("links.columnLegal")}</h3>
            <ul>
              <li><Link href="/privacy">{t("links.privacy")}</Link></li>
              <li><Link href="/terms">{t("links.terms")}</Link></li>
              <li><Link href="/refunds">{t("links.refund")}</Link></li>
              <li><Link href="/security">{t("links.security")}</Link></li>
              <li><Link href="/aup">{t("links.aup")}</Link></li>
            </ul>
          </div>
        </nav>

        <div className="footerBottom">
          <p className="footerCopyright">
            &copy; {new Date().getFullYear()} {tCommon("siteName")}. {t("rightsReserved")}
          </p>
          <a className="footerEmail" href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
          {/*
            Visible social links matching the sameAs entries in the
            Organization JSON-LD. Two reasons to render them visibly:
             1. Reciprocal-link signal — Google cross-checks visible
                page content against schema sameAs, and a match raises
                Knowledge Graph confidence.
             2. Brand reach — visitors who don't book today follow on
                Instagram / Facebook and re-encounter the brand later.
            rel="me" identifies these as the same entity (Webmention /
            Mastodon-style verification); rel="noopener" closes a window
            handle leak when opening in a new tab.
          */}
          <div className="footerSocial">
            <a
              href="https://www.facebook.com/share/1GFn42rFuS/"
              target="_blank"
              rel="me noopener noreferrer"
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/crecystudio"
              target="_blank"
              rel="me noopener noreferrer"
            >
              Instagram
            </a>
            <a
              href="https://www.linkedin.com/in/komlan-crecy-olympe-kouhiko-60aa85407"
              target="_blank"
              rel="me noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
