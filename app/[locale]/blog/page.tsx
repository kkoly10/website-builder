import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import StructuredData from "@/components/seo/StructuredData";
import { breadcrumbListNode, siteGraph } from "@/lib/seo/structuredData";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

// Blog content is English-only for the same reason the city pages are:
// the editorial copy is hand-written and doesn't translate well via
// auto-tools. Non-English locales 404 — sitemap respects this via the
// englishOnly flag set on the blog routes.
function isSupportedLocale(locale: string): boolean {
  return locale === routing.defaultLocale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const title = "Blog — practical writing on AI, web, and how we build | CrecyStudio";
  const description =
    "Long-form pieces on AI integration, hiring a web studio, RAG vs fine-tuning, local DMV business tech — written by the founder of CrecyStudio.";
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

const CARD_GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  marginTop: 24,
};

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  setRequestLocale(locale);

  const graph = siteGraph([
    breadcrumbListNode([
      { name: "Home", url: "/" },
      { name: "Blog", url: "/blog" },
    ]),
  ]);

  // Sort by publishedAt descending so newest posts surface first. We
  // could sort by updatedAt as a secondary signal but for a small
  // catalog publishedAt is enough.
  const posts = [...BLOG_POSTS].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );

  return (
    <>
      <StructuredData graph={graph} />
      <main className="container section">
        <nav style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          <Link href="/" style={{ color: "inherit" }}>Home</Link>
          {" / "}
          <span>Blog</span>
        </nav>

        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          CrecyStudio · Blog
        </div>

        <h1 className="h1" style={{ marginTop: 12 }}>
          Long-form on AI, web work, and how we actually build
        </h1>

        <p className="p" style={{ maxWidth: 720, marginTop: 16 }}>
          Practical writing — scoping checklists, hiring guides, technical
          breakdowns — for business owners and operators making real decisions
          about web and AI work. Written by the founder of CrecyStudio.
        </p>

        <div style={CARD_GRID_STYLE}>
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="panel"
              style={{ display: "block", padding: 20, textDecoration: "none" }}
            >
              <div className="smallNote" style={{ marginBottom: 8 }}>
                {post.tags.join(" · ")} · {post.readingMinutes} min read
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.3, marginBottom: 8 }}>
                {post.headline}
              </div>
              <div className="p" style={{ fontSize: 14, opacity: 0.85 }}>
                {post.lead.length > 180 ? `${post.lead.slice(0, 177)}…` : post.lead}
              </div>
              <div className="smallNote" style={{ marginTop: 12 }}>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </Link>
          ))}
        </div>

        <div style={{ height: 64 }} />

        <section className="panel" style={{ padding: 24 }}>
          <h2 className="h2">Working on something we&apos;ve written about?</h2>
          <p className="p" style={{ marginTop: 12 }}>
            Book a free 20-minute discovery call. Whether it&apos;s an AI
            integration, a custom web app, or a website rescue — we&apos;ll
            walk the scope honestly and tell you what fits.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <Link href="/book" className="btn btnPrimary">
              Book discovery call
            </Link>
            <Link href="/contact" className="btn btnGhost">
              Or send a message
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
