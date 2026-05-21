import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Contact — CrecyStudio";

export default async function OgImage() {
  return renderOgImage({
    eyebrow: "Contact",
    headline: "Reach the studio.",
    tagline: "Proposals, support, legal notices, and portal questions.",
  });
}
