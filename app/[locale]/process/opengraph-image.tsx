import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Process — CrecyStudio";

export default async function OgImage() {
  return renderOgImage({
    eyebrow: "Process",
    headline: "A simple process. Clear milestones.",
    tagline: "Same execution rhythm for every lane. Scope stays visible.",
  });
}
