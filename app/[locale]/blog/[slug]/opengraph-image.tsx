import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";
import { allPostSlugs, postBySlug } from "@/lib/blog/posts";

// Per-post OG image. Inherits the renderOgImage() pattern from
// /websites etc., but the headline + eyebrow come from the post
// catalog. Falls back to the parent /blog OG only for an unknown
// slug (which would 404 the page itself anyway).

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "CrecyStudio Blog";

// Pre-generate the OG image for every known post slug at build
// time. Matches the page-level generateStaticParams so the OG and
// the page render with the same set of inputs.
export async function generateImageMetadata() {
  return allPostSlugs().map((slug) => ({ id: slug, contentType, size, alt }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) {
    return renderOgImage({
      eyebrow: "Blog",
      headline: "Practical writing on AI, web, and how we build",
      tagline: "Scoping checklists, hiring guides, technical breakdowns.",
    });
  }
  // Truncate the headline to avoid wrapping past the OG card edge.
  // 90 chars renders cleanly at the 76px font size in renderOgImage.
  const headline =
    post.headline.length > 90 ? `${post.headline.slice(0, 87)}…` : post.headline;
  return renderOgImage({
    eyebrow: post.tags[0] ?? "Blog",
    headline,
    tagline: `${post.readingMinutes} min read · By Komlan Kouhiko`,
  });
}
