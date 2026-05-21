import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Pricing — CrecyStudio";

export default async function OgImage() {
  return renderOgImage({
    eyebrow: "Pricing",
    headline: "Clear pricing before the work starts.",
    tagline: "Fixed estimates scoped to your project. No surprise add-ons.",
  });
}
