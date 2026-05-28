import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import StructuredData from "@/components/seo/StructuredData";
import {
  breadcrumbListNode,
  serviceNode,
  siteGraph,
} from "@/lib/seo/structuredData";
import {
  allLocationSlugs,
  locationBySlug,
  LOCATIONS,
  type Location,
} from "@/lib/seo/locations";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Params = {
  locale: string;
  city: string;
};

// Pre-generate the (locale × city) URLs Next.js needs to render. Keeps
// the page indexable as a static-rendered route even though the
// surrounding layout is `force-dynamic`.
export async function generateStaticParams(): Promise<Pick<Params, "city">[]> {
  return allLocationSlugs().map((slug) => ({ city: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city } = await params;
  const location = locationBySlug(city);
  if (!location) {
    return {
      title: "Location not found | CrecyStudio",
      robots: { index: false, follow: false },
    };
  }
  // Value-first title that front-loads the local SEO target. Brand
  // comes after the pipe — better SERP CTR than brand-first format.
  const title = `Web Design & AI Integration in ${location.shortName} | CrecyStudio`;
  const description = `Independent web studio serving ${location.shortName}. Premium websites, custom web apps, AI integration, and workflow automation — by a senior practitioner who ships.`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

// Six service offerings rendered as inline links on every city page.
// Kept in sync with the actual service pages so the local-SEO landing
// always points at the canonical service.
const SERVICES: { slug: string; name: string; href: string; blurb: string }[] = [
  { slug: "websites", name: "Premium websites", href: "/websites", blurb: "Conversion-focused websites for service businesses." },
  { slug: "custom-web-apps", name: "Custom web apps", href: "/custom-web-apps", blurb: "Dashboards, portals, MVPs, internal tools." },
  { slug: "ai-integration", name: "AI integration", href: "/build/intro?projectType=ai_integration", blurb: "Production AI copilots, agents, RAG, GPT-4/Claude integration." },
  { slug: "systems", name: "Workflow automation", href: "/systems", blurb: "Intake, routing, status tracking, admin systems." },
  { slug: "ecommerce", name: "E-commerce", href: "/ecommerce", blurb: "Storefronts, checkout, post-purchase ops flow." },
  { slug: "website-rescue", name: "Website rescue", href: "/website-rescue", blurb: "Audit + 1-2 week sprint to fix a broken site." },
];

function buildLocationGraph(location: Location) {
  const pageUrl = `/locations/${location.slug}`;
  return siteGraph([
    // Per-city Service node anchored to this URL. Tells Google
    // "this exact service is offered in this exact place" — the
    // signal local-pack ranking is built on.
    serviceNode({
      slug: `${location.slug}-web-services`,
      name: `Web design & AI integration in ${location.shortName}`,
      description: location.intro,
      pageUrl,
      offerings: SERVICES.map((s) => s.name),
    }),
    breadcrumbListNode([
      { name: "Home", url: "/" },
      { name: "Locations", url: "/locations" },
      { name: location.shortName, url: pageUrl },
    ]),
  ]);
}

export default async function CityLocationPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, city } = await params;
  setRequestLocale(locale);
  const location = locationBySlug(city);
  if (!location) notFound();

  const graph = buildLocationGraph(location);

  return (
    <>
      <StructuredData graph={graph} />
      <main className="container section">
        <nav style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          <Link href="/" style={{ color: "inherit" }}>Home</Link>
          {" / "}
          <Link href="/locations" style={{ color: "inherit" }}>Locations</Link>
          {" / "}
          <span>{location.shortName}</span>
        </nav>

        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          CrecyStudio · Local
        </div>

        <h1 className="h1" style={{ marginTop: 12 }}>
          Web design &amp; AI integration in {location.shortName}
        </h1>

        <p className="p" style={{ maxWidth: 720, marginTop: 16 }}>
          {location.intro}
        </p>

        {location.distanceFromHomeMiles != null && (
          <p className="smallNote" style={{ marginTop: 8 }}>
            ~{location.distanceFromHomeMiles} miles from our Stafford, VA studio.
          </p>
        )}

        <div style={{ height: 32 }} />

        <section>
          <h2 className="h2">Why {location.shortName} businesses pick CrecyStudio</h2>
          <ul style={{ marginTop: 16, paddingLeft: 20, lineHeight: 1.8 }}>
            {location.whyLocal.map((reason, i) => (
              <li key={i} className="p" style={{ marginBottom: 8 }}>{reason}</li>
            ))}
          </ul>
        </section>

        <div style={{ height: 48 }} />

        <section>
          <h2 className="h2">What we build for {location.shortName} clients</h2>
          <div className="checkGrid" style={{ marginTop: 16 }}>
            {SERVICES.map((service) => (
              <Link
                key={service.slug}
                href={service.href}
                className="panel"
                style={{ display: "block", padding: 16, textDecoration: "none" }}
              >
                <div style={{ fontWeight: 700, fontSize: 16 }}>{service.name}</div>
                <div className="smallNote" style={{ marginTop: 6 }}>{service.blurb}</div>
              </Link>
            ))}
          </div>
        </section>

        <div style={{ height: 48 }} />

        <section className="panel" style={{ padding: 24 }}>
          <h2 className="h2">Start a project from {location.shortName}</h2>
          <p className="p" style={{ marginTop: 12 }}>
            Book a free 20-minute discovery call. No pitch, no commitment — just a
            conversation about what you&apos;re building.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <Link href="/book" className="btn btnPrimary">
              Book discovery call <span className="btnArrow">→</span>
            </Link>
            <Link href="/contact" className="btn btnGhost">
              Or send a message
            </Link>
          </div>
        </section>

        <div style={{ height: 64 }} />

        <section>
          <h3 className="h3">Other DMV locations we serve</h3>
          <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
            {LOCATIONS.filter((other) => other.slug !== location.slug).map((other) => (
              <li key={other.slug}>
                <Link href={`/locations/${other.slug}`}>{other.shortName}</Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}

// Make TypeScript happy: routing.locales is declared so Next knows
// the locale segment is valid. (No-op at runtime; the locale layout
// already validates via hasLocale.)
void routing;
