import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Locations we serve — CrecyStudio";

export default async function OgImage() {
  return renderOgImage({
    eyebrow: "DMV · US · CA · UK",
    headline: "Web studio serving the DMV",
    tagline:
      "Stafford, Fredericksburg, Richmond, DC, Maryland — and remote across English-speaking markets.",
  });
}
