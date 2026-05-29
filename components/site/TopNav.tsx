"use client";

import { Link } from "@/i18n/navigation";
import RawLink from "next/link";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import BrandLogo from "@/components/brand/BrandLogo";
import LocaleSwitcher from "@/components/site/LocaleSwitcher";
import { useEffect, useRef, useState } from "react";

type TopNavProps = {
  admin: boolean;
  portalHref: string;
  startProjectHref: string;
  userEmail: string | null;
  locale: string;
  availableLocales: string[];
};

type NavItem = {
  href: string;
  label: string;
  matchPrefix?: string;
  // Locale-agnostic destinations live outside app/[locale] (portal, internal,
  // dashboard, auth, etc). The i18n Link would prefix them (e.g. /fr/portal)
  // and 404, so we render those with a raw next/link instead.
  raw?: boolean;
};

function isActivePath(pathname: string, href: string, matchPrefix?: string) {
  if (matchPrefix) {
    return pathname === matchPrefix || pathname.startsWith(`${matchPrefix}/`);
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  raw,
  ...props
}: { raw?: boolean } & React.ComponentProps<typeof Link>) {
  if (raw) {
    return <RawLink {...(props as React.ComponentProps<typeof RawLink>)} />;
  }
  return <Link {...props} />;
}

export default function TopNav({
  admin,
  portalHref,
  startProjectHref,
  userEmail,
  locale,
  availableLocales,
}: TopNavProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const servicesWrapRef = useRef<HTMLDivElement>(null);
  const [servicesOpen, setServicesOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.removeAttribute("open");
    }
    setServicesOpen(false);
  }, [pathname]);

  // Close the services dropdown on outside click + Escape — standard
  // dismiss UX for a click/hover menu so it doesn't get stuck open if
  // the user clicks elsewhere on the page.
  useEffect(() => {
    if (!servicesOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!servicesWrapRef.current) return;
      if (!servicesWrapRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setServicesOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [servicesOpen]);

  // Service pages grouped under a single "Services" dropdown so the
  // top nav doesn't wrap onto two rows on standard desktop widths.
  // Order is the same SEO/search-volume order we had inline before.
  const serviceItems: NavItem[] = [
    { href: "/websites", label: t("websites") },
    { href: "/ai-integration", label: t("aiIntegration") },
    { href: "/custom-web-apps", label: t("customWebApps") },
    { href: "/systems", label: t("systems") },
    { href: "/ecommerce", label: t("ecommerce") },
    { href: "/client-portals", label: t("clientPortals") },
    { href: "/website-rescue", label: t("websiteRescue") },
  ];

  // Top-level nav after the Services dropdown.
  const navItems: NavItem[] = [
    { href: "/care-plans", label: t("carePlans") },
    { href: "/process", label: t("process") },
    { href: "/work", label: t("work") },
    { href: "/faq", label: t("faq") },
  ];

  if (userEmail) {
    navItems.push({
      href: portalHref,
      label: t("clientPortal"),
      matchPrefix: "/portal",
      raw: true,
    });
  }

  if (admin) {
    navItems.push({
      href: "/internal/admin",
      label: t("admin"),
      matchPrefix: "/internal/admin",
      raw: true,
    });
  }

  const servicesActive = serviceItems.some((item) =>
    isActivePath(pathname, item.href, item.matchPrefix),
  );

  return (
    <header className="topNav">
      <div className="topNavInner">
        <BrandLogo href="/" />

        <nav className="navDesktop" aria-label={t("primaryAria")}>
          <div className="navLinks">
            <div
              ref={servicesWrapRef}
              className="navServicesWrap"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                type="button"
                className={`topNavLink navServicesTrigger ${servicesActive ? "topNavLinkActive" : ""}`}
                aria-haspopup="menu"
                aria-expanded={servicesOpen}
                aria-label={t("servicesAria")}
                onClick={() => setServicesOpen((open) => !open)}
              >
                {t("services")} <span className="navServicesChevron" aria-hidden="true">▾</span>
              </button>
              {servicesOpen && (
                <div className="navServicesPanel" role="menu">
                  {serviceItems.map((item) => {
                    const active = isActivePath(pathname, item.href, item.matchPrefix);
                    return (
                      <NavLink
                        key={item.label}
                        href={item.href}
                        raw={item.raw}
                        role="menuitem"
                        className={`navServicesItem ${active ? "navServicesItemActive" : ""}`}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setServicesOpen(false)}
                      >
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href, item.matchPrefix);

              return (
                <NavLink
                  key={item.label}
                  href={item.href}
                  raw={item.raw}
                  className={`topNavLink ${active ? "topNavLinkActive" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="navDesktop navDesktopCta">
          <LocaleSwitcher locale={locale} availableLocales={availableLocales} />
          {userEmail ? (
            <>
              <RawLink href={portalHref} className="btn btnGhost">
                {tCommon("openPortal")}
              </RawLink>
              <form action="/auth/signout" method="post" className="navForm">
                <button type="submit" className="btn btnGhost">
                  {tCommon("signOut")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btnGhost">
                {tCommon("login")}
              </Link>
              <Link href={startProjectHref} className="btn btnPrimary">
                {tCommon("startProject")} <span className="btnArrow">-&gt;</span>
              </Link>
            </>
          )}
        </div>

        <details className="mobileMenu" ref={mobileMenuRef}>
          <summary className="mobileMenuSummary" aria-label={tCommon("openMenu")}>
            <span />
            <span />
            <span />
          </summary>

          <div className="mobileMenuPanel">
            <div className="mobileMenuLinks">
              {[...serviceItems, ...navItems].map((item) => {
                const active = isActivePath(pathname, item.href, item.matchPrefix);

                return (
                  <NavLink
                    key={item.label}
                    href={item.href}
                    raw={item.raw}
                    className={active ? "mobileMenuLinkActive" : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </NavLink>
                );
              })}

              <LocaleSwitcher locale={locale} availableLocales={availableLocales} />

              {userEmail ? (
                <>
                  <RawLink href={portalHref} className="btn btnPrimary mobileMenuPrimary">
                    {tCommon("openPortal")}
                  </RawLink>
                  <form action="/auth/signout" method="post" className="mobileMenuForm">
                    <button type="submit" className="btn btnGhost mobileMenuSignout">
                      {tCommon("signOut")}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btnGhost mobileMenuSignout">
                    {tCommon("login")}
                  </Link>
                  <Link href={startProjectHref} className="btn btnPrimary mobileMenuPrimary">
                    {tCommon("startProject")} <span className="btnArrow">-&gt;</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
