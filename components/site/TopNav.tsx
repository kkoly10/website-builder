"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/brand/BrandLogo";

type TopNavProps = {
  admin: boolean;
  portalHref: string;
  startProjectHref: string;
  userEmail: string | null;
};

type NavItem = {
  href: string;
  label: string;
  matchPrefix?: string;
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

export default function TopNav({
  admin,
  portalHref,
  startProjectHref,
  userEmail,
}: TopNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/websites", label: "Websites" },
    { href: "/ecommerce", label: "E-commerce" },
    { href: "/systems", label: "Systems" },
    { href: "/process", label: "Process" },
    { href: "/pricing", label: "Pricing" },
    { href: "/faq", label: "FAQ" },
  ];

  if (userEmail) {
    navItems.push({ href: portalHref, label: "Client portal", matchPrefix: "/portal" });
  }

  if (admin) {
    navItems.push({ href: "/internal/admin", label: "Admin", matchPrefix: "/internal/admin" });
  }

  return (
    <header className="topNav">
      <div className="topNavInner">
        <BrandLogo href="/" />

        <nav className="navDesktop" aria-label="Primary">
          <div className="navLinks">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href, item.matchPrefix);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`topNavLink ${active ? "topNavLinkActive" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="navDesktop navDesktopCta">
          {userEmail ? (
            <>
              <Link href={portalHref} className="btn btnGhost">
                Open portal
              </Link>
              <form action="/auth/signout" method="post" className="navForm">
                <button type="submit" className="btn btnGhost">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href={startProjectHref} className="btn btnPrimary">
              Start a project <span className="btnArrow">-&gt;</span>
            </Link>
          )}
        </div>

        <details className="mobileMenu">
          <summary className="mobileMenuSummary" aria-label="Open navigation menu">
            <span />
            <span />
            <span />
          </summary>

          <div className="mobileMenuPanel">
            <div className="mobileMenuLinks">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href, item.matchPrefix);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={active ? "mobileMenuLinkActive" : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {userEmail ? (
                <>
                  <Link href={portalHref} className="btn btnPrimary mobileMenuPrimary">
                    Open portal
                  </Link>
                  <form action="/auth/signout" method="post" className="mobileMenuForm">
                    <button type="submit" className="btn btnGhost mobileMenuSignout">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href={startProjectHref} className="btn btnPrimary mobileMenuPrimary">
                  Start a project <span className="btnArrow">-&gt;</span>
                </Link>
              )}
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
