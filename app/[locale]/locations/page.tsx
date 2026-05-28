import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import StructuredData from "@/components/seo/StructuredData";
import { breadcrumbListNode, siteGraph } from "@/lib/seo/structuredData";
import { LOCATIONS } from "@/lib/seo/locations";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

// City landing pages and the /locations index target English-speaking
// buyers in the DMV (and US/CA/GB remote). See the city page for the
// rationale behind 404'ing non-English locales rather than serving
// untranslated English at /fr/ /es/ URLs.
function isSupportedLocale(locale: string): boolean {
  return locale === routing.defaultLocale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const title = "Locations we serve — DMV, US, Canada, UK | CrecyStudio";
  const description =
    "CrecyStudio serves clients across the DMV (Stafford, Fredericksburg, Richmond, DC, Maryland) and remotely across the US, Canada, and UK. Browse the cities we serve.";
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

const CITY_GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginTop: 16,
};

export default async function LocationsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  setRequestLocale(locale);

  const graph = siteGraph([
    breadcrumbListNode([
      { name: "Home", url: "/" },
      { name: "Locations", url: "/locations" },
    ]),
  ]);

  return (
    <>
      <StructuredData graph={graph} />
      <main className="container section">
        <nav style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          <Link href="/" style={{ color: "inherit" }}>Home</Link>
          {" / "}
          <span>Locations</span>
        </nav>

        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          CrecyStudio · Local
        </div>

        <h1 className="h1" style={{ marginTop: 12 }}>
          Where we work
        </h1>

        <p className="p" style={{ maxWidth: 720, marginTop: 16 }}>
          CrecyStudio is based in Stafford, VA. We serve clients in person
          across the DMV — Fredericksburg, Richmond, Northern Virginia,
          Washington DC, and Maryland — and async-first across the US, Canada,
          and UK.
        </p>

        <div style={{ height: 32 }} />

        <h2 className="h2">DMV cities &amp; areas</h2>
        <div style={CITY_GRID_STYLE}>
          {LOCATIONS.map((location) => (
            <Link
              key={location.slug}
              href={`/locations/${location.slug}`}
              className="panel"
              style={{ display: "block", padding: 16, textDecoration: "none" }}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>{location.shortName}</div>
              <div className="smallNote" style={{ marginTop: 6 }}>
                {location.distanceFromHomeMiles == null
                  ? "Our home base."
                  : `~${location.distanceFromHomeMiles} mi from Stafford.`}
              </div>
            </Link>
          ))}
        </div>

        <div style={{ height: 48 }} />

        <h2 className="h2">English-speaking markets</h2>
        <p className="p" style={{ maxWidth: 720, marginTop: 12 }}>
          For remote clients, we work async-first across the United States,
          Canada, and the United Kingdom. Same workflow, same workspace,
          same accountability — just no in-person kickoff.
        </p>

        <div style={{ height: 48 }} />

        <section className="panel" style={{ padding: 24 }}>
          <h2 className="h2">Start a project from anywhere in the DMV</h2>
          <p className="p" style={{ marginTop: 12 }}>
            Book a free 20-minute discovery call. No pitch, no commitment —
            just a conversation about what you&apos;re building.
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
      </main>
    </>
  );
}
