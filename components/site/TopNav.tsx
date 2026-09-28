"use client";

import { Link, usePathname } from "@/i18n/navigation";
import RawLink from "next/link";
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
  raw?: boolean;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActivePath(pathname: string, href: string, matchPrefix?: string) {
  if (matchPrefix) {
    return pathname === matchPrefix || pathname.startsWith(matchPrefix + "/");
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(href + "/");
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
  const isHome = pathname === "/";
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const servicesWrapRef = useRef<HTMLDivElement>(null);
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.removeAttribute("open");
    }
    setServicesOpen(false);
  }, [pathname]);

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

  const serviceItems: NavItem[] = [
    { href: "/websites", label: t("websites") },
    { href: "/saas", label: t("saas") },
    { href: "/ai-integration", label: t("aiIntegration") },
    { href: "/custom-web-apps", label: t("customWebApps") },
    { href: "/systems", label: t("systems") },
    { href: "/ecommerce", label: t("ecommerce") },
    { href: "/client-portals", label: t("clientPortals") },
    { href: "/website-rescue", label: t("websiteRescue") },
  ];

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

  const homePortalLinks = (
    <>
      {userEmail ? (
        <RawLink href={portalHref} className="topNavLink">
          {t("clientPortal")}
        </RawLink>
      ) : null}
      {admin ? (
        <RawLink href="/internal/admin" className="topNavLink">
          {t("admin")}
        </RawLink>
      ) : null}
    </>
  );

  return (
    <header className={cx("topNav", isHome && "topNavHome")}>
      <div className="topNavInner">
        <BrandLogo href="/" />

        <nav className="navDesktop" aria-label={t("primaryAria")}>
          <div className="navLinks">
            {isHome ? (
              <>
                <a href="#work" className="topNavLink">
                  {t("work")}
                </a>
                <a href="#capabilities" className="topNavLink">
                  {t("capabilities")}
                </a>
                <a href="#process" className="topNavLink">
                  {t("process")}
                </a>
                <Link href="/about" className="topNavLink">
                  {t("about")}
                </Link>
                {homePortalLinks}
              </>
            ) : (
              <>
                <div
                  ref={servicesWrapRef}
                  className="navServicesWrap"
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <button
                    type="button"
                    className={cx(
                      "topNavLink",
                      "navServicesTrigger",
                      servicesActive && "topNavLinkActive",
                    )}
                    aria-haspopup="menu"
                    aria-expanded={servicesOpen}
                    aria-label={t("servicesAria")}
                    onClick={() => setServicesOpen((open) => !open)}
                  >
                    {t("services")}
                    <span className="navServicesChevron" aria-hidden="true">
                      ▾
                    </span>
                  </button>

                  {servicesOpen ? (
                    <div className="navServicesPanel" role="menu">
                      {serviceItems.map((item) => {
                        const active = isActivePath(
                          pathname,
                          item.href,
                          item.matchPrefix,
                        );

                        return (
                          <NavLink
                            key={item.label}
                            href={item.href}
                            raw={item.raw}
                            role="menuitem"
                            className={cx(
                              "navServicesItem",
                              active && "navServicesItemActive",
                            )}
                            aria-current={active ? "page" : undefined}
                            onClick={() => setServicesOpen(false)}
                          >
                            {item.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {navItems.map((item) => {
                  const active = isActivePath(
                    pathname,
                    item.href,
                    item.matchPrefix,
                  );

                  return (
                    <NavLink
                      key={item.label}
                      href={item.href}
                      raw={item.raw}
                      className={cx("topNavLink", active && "topNavLinkActive")}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </NavLink>
                  );
                })}
              </>
            )}
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
                {tCommon("startProject")}
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
              {isHome ? (
                <>
                  <a href="#work" onClick={() => mobileMenuRef.current?.removeAttribute("open")}>{t("work")}</a>
                  <a href="#capabilities" onClick={() => mobileMenuRef.current?.removeAttribute("open")}>{t("capabilities")}</a>
                  <a href="#process" onClick={() => mobileMenuRef.current?.removeAttribute("open")}>{t("process")}</a>
                  <Link href="/about">{t("about")}</Link>
                </>
              ) : (
                [...serviceItems, ...navItems].map((item) => {
                  const active = isActivePath(
                    pathname,
                    item.href,
                    item.matchPrefix,
                  );

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
                })
              )}

              {isHome && userEmail ? (
                <RawLink href={portalHref}>{t("clientPortal")}</RawLink>
              ) : null}
              {isHome && admin ? (
                <RawLink href="/internal/admin">{t("admin")}</RawLink>
              ) : null}

              <LocaleSwitcher locale={locale} availableLocales={availableLocales} />

              {userEmail ? (
                <>
                  <RawLink
                    href={portalHref}
                    className="btn btnPrimary mobileMenuPrimary"
                  >
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
                  <Link
                    href={startProjectHref}
                    className="btn btnPrimary mobileMenuPrimary"
                  >
                    {tCommon("startProject")}
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
