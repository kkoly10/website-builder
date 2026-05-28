import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function SiteFooter() {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");

  return (
    <footer className="footer">
      <div className="container footerInner">
        <div className="footerTop">
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
            <p className="footerBlurb" style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
              {t("address")}
            </p>
            <p className="footerBlurb" style={{ marginTop: 4, fontSize: 13, opacity: 0.75 }}>
              {t("serviceArea")}
            </p>
          </div>

          <div className="footerLinks" aria-label={t("links.aria")}>
            <Link href="/websites">{t("links.websites")}</Link>
            <Link href="/ecommerce">{t("links.ecommerce")}</Link>
            <Link href="/systems">{t("links.systems")}</Link>
            <Link href="/ai-integration">{t("links.aiIntegration")}</Link>
            <Link href="/custom-web-apps">{t("links.customWebApps")}</Link>
            <Link href="/client-portals">{t("links.clientPortals")}</Link>
            <Link href="/website-rescue">{t("links.websiteRescue")}</Link>
            <Link href="/process">{t("links.process")}</Link>
            <Link href="/work">{t("links.work")}</Link>
            <Link href="/care-plans">{t("links.carePlans")}</Link>
            <Link href="/pricing">{t("links.pricing")}</Link>
            {/*
              /locations and the city pages are English-only. Forcing
              `locale="en"` makes the link emit `/locations` regardless
              of the active locale, so FR/ES users can still navigate
              to the local-SEO index (they just land on the English
              version). Without this, clicking from /fr would route to
              /fr/locations and 404.
            */}
            <Link href="/locations" locale="en">{t("links.locations")}</Link>
            {/* Blog is English-only too — same forcing as /locations. */}
            <Link href="/blog" locale="en">{t("links.blog")}</Link>
            <Link href="/faq">{t("links.faq")}</Link>
            <Link href="/about">{t("links.about")}</Link>
            <Link href="/start">{t("links.start")}</Link>
            <Link href="/contact">{t("links.contact")}</Link>
            <Link href="/privacy">{t("links.privacy")}</Link>
            <Link href="/terms">{t("links.terms")}</Link>
            <Link href="/refunds">{t("links.refund")}</Link>
            <Link href="/security">{t("links.security")}</Link>
            <Link href="/aup">{t("links.aup")}</Link>
            <Link href="/coming-soon">{t("links.futureServices")}</Link>
          </div>
        </div>

        <div className="footerBottom">
          <p>
            &copy; {new Date().getFullYear()} {tCommon("siteName")}. {t("rightsReserved")}
          </p>
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
          <div style={{ display: "flex", gap: 14, fontSize: 13 }}>
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
          <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
        </div>
      </div>
    </footer>
  );
}
