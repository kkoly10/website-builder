import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "FAQ — CrecyStudio";

export default async function OgImage() {
  return renderOgImage({
    eyebrow: "FAQ",
    headline: "Answers before you commit",
    tagline: "Scope, ownership, timelines, and how the workspace works.",
  });
}
