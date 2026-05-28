import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import StructuredData from "@/components/seo/StructuredData";
import { breadcrumbListNode, siteGraph } from "@/lib/seo/structuredData";
import { LOCATIONS } from "@/lib/seo/locations";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
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

export default async function LocationsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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
        <div className="checkGrid" style={{ marginTop: 16 }}>
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
      </main>
    </>
  );
}
