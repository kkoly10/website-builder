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
          </div>

          <div className="footerLinks" aria-label="Footer">
            <Link href="/websites">{t("links.websites")}</Link>
            <Link href="/ecommerce">{t("links.ecommerce")}</Link>
            <Link href="/systems">{t("links.systems")}</Link>
            <Link href="/process">{t("links.process")}</Link>
            <Link href="/pricing">{t("links.pricing")}</Link>
            <Link href="/faq">{t("links.faq")}</Link>
            <Link href="/contact">{t("links.contact")}</Link>
            <Link href="/privacy">{t("links.privacy")}</Link>
            <Link href="/terms">{t("links.terms")}</Link>
          </div>
        </div>

        <div className="footerBottom">
          <p>
            &copy; {new Date().getFullYear()} {tCommon("siteName")}. {t("rightsReserved")}
          </p>
          <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
        </div>
      </div>
    </footer>
  );
}
