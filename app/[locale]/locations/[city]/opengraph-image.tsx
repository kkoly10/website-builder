import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";
import { allLocationSlugs, locationBySlug } from "@/lib/seo/locations";

// Per-city OG image. Each city gets its own social preview card so
// shares from a Stafford page don't show the generic "Web studio
// serving the DMV" card — they show "Stafford, VA" specifically.

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Web design & AI integration · CrecyStudio";

// Pre-generate one OG per known city slug. Mirrors the page-level
// generateStaticParams so OG and page stay in sync.
export async function generateImageMetadata() {
  return allLocationSlugs().map((slug) => ({ id: slug, contentType, size, alt }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const location = locationBySlug(city);
  if (!location) {
    return renderOgImage({
      eyebrow: "DMV · US · CA · UK",
      headline: "Web studio serving the DMV",
      tagline:
        "Stafford, Fredericksburg, Richmond, DC, Maryland — and remote across English-speaking markets.",
    });
  }
  return renderOgImage({
    eyebrow: location.shortName,
    headline: `Web design & AI integration in ${location.shortName}`,
    tagline:
      location.distanceFromHomeMiles == null
        ? "Independent studio. Premium craft. Local in Stafford."
        : `~${location.distanceFromHomeMiles} mi from our Stafford, VA studio.`,
  });
}
