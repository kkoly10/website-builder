import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import BrandLogo from "@/components/brand/BrandLogo";
import SiteFooter from "@/components/site/SiteFooter";
import NavAuth, { NavAuthMobile } from "@/components/nav/NavAuth";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crecystudio.com";

export const metadata: Metadata = {
  title: {
    default: "CrecyStudio | Websites & Workflow Systems",
    template: "%s | CrecyStudio",
  },
  description:
    "Custom websites and workflow systems for local service businesses. Free estimates, 50% deposit model, 2–4 week delivery.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    siteName: "CrecyStudio",
    title: "CrecyStudio | Websites & Workflow Systems",
    description:
      "Custom websites and workflow systems for local service businesses. Free estimates, 50% deposit model, 2–4 week delivery.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "CrecyStudio | Websites & Workflow Systems",
    description:
      "Custom websites and workflow systems for local service businesses.",
  },
};

const customBuildHref = "/build/intro";

const navLinks = [
  { href: "/systems", label: "Workflow Systems" },
  { href: customBuildHref, label: "Custom Build" },
  { href: "/process", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/portal", label: "Client Portal" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: "CrecyStudio",
              url: siteUrl,
              description:
                "Custom websites and workflow systems for local service businesses.",
              email: "hello@crecystudio.com",
              serviceType: [
                "Web Design",
                "Web Development",
                "Workflow Automation",
              ],
              areaServed: { "@type": "Country", name: "US" },
              priceRange: "$$",
            }),
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skipLink">Skip to main content</a>
        <div className="siteShell">
          <header className="topNav">
            <div className="topNavInner">
              <BrandLogo href="/" showTag />

              {/* Desktop nav */}
              <nav className="navLinks navDesktop">
                {navLinks.map((item) => (
                  <Link key={item.label} href={item.href}>
                    {item.label}
                  </Link>
                ))}
                <NavAuth customBuildHref={customBuildHref} />
              </nav>

              {/* Mobile header actions */}
              <div className="mobileHeaderActions">
                <Link href={customBuildHref} className="btn btnPrimary mobilePrimaryCta">
                  Get Quote
                </Link>

                <details className="mobileMenu">
                  <summary className="mobileMenuSummary" aria-label="Open navigation menu">
                    <span />
                    <span />
                    <span />
                  </summary>

                  <div className="mobileMenuPanel">
                    <div className="mobileMenuLinks">
                      {navLinks.map((item) => (
                        <Link key={item.label} href={item.href}>
                          {item.label}
                        </Link>
                      ))}
                      <NavAuthMobile customBuildHref={customBuildHref} />
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </header>

          <main id="main-content" className="mainContent" tabIndex={-1}>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
