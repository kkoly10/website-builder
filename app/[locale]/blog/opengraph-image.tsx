import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "CrecyStudio Blog";

export default async function OgImage() {
  return renderOgImage({
    eyebrow: "Blog",
    headline: "Practical writing on AI, web, and how we build",
    tagline: "Scoping checklists, hiring guides, technical breakdowns.",
  });
}
