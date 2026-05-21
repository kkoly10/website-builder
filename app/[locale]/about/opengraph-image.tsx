import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "About — CrecyStudio";

export default async function OgImage() {
  return renderOgImage({
    eyebrow: "About",
    headline: "The founder is the builder.",
    tagline: "Independent web studio. Premium craft, no agency middlemen.",
  });
}
