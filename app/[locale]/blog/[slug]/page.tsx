import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import StructuredData from "@/components/seo/StructuredData";
import {
  articleNode,
  breadcrumbListNode,
  siteGraph,
} from "@/lib/seo/structuredData";
import {
  allPostSlugs,
  BLOG_POSTS,
  postBySlug,
  type BlogBlock,
  type BlogPost,
} from "@/lib/blog/posts";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Params = {
  locale: string;
  slug: string;
};

function isSupportedLocale(locale: string): boolean {
  return locale === routing.defaultLocale;
}

export async function generateStaticParams(): Promise<Pick<Params, "slug">[]> {
  return allPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const post = postBySlug(slug);
  if (!post) {
    return {
      title: "Post not found | CrecyStudio",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${post.title} | CrecyStudio`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      ...(post.updatedAt && { modifiedTime: post.updatedAt }),
      tags: post.tags,
    },
    twitter: {
      title: post.title,
      description: post.description,
    },
  };
}

// Render the structured body into HTML. Kept inline rather than a
// shared MdRenderer because (a) the block set is small and finite,
// (b) we want full control over the heading hierarchy for SEO, and
// (c) no MDX processor means no extra build step.
function renderBlock(block: BlogBlock, i: number) {
  switch (block.type) {
    case "h2":
      return (
        <h2 key={i} className="h2" style={{ marginTop: 48, marginBottom: 16 }}>
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 key={i} className="h3" style={{ marginTop: 32, marginBottom: 12 }}>
          {block.text}
        </h3>
      );
    case "p":
      return (
        <p key={i} className="p" style={{ marginBottom: 16, maxWidth: 720, lineHeight: 1.7 }}>
          {block.text}
        </p>
      );
    case "list":
      return (
        <ul key={i} style={{ marginBottom: 24, paddingLeft: 24, maxWidth: 720, lineHeight: 1.7 }}>
          {block.items.map((item, j) => (
            <li key={j} className="p" style={{ marginBottom: 8 }}>
              {item}
            </li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <aside
          key={i}
          className="panel"
          style={{
            padding: 20,
            marginTop: 32,
            marginBottom: 32,
            maxWidth: 720,
            borderLeft: "4px solid var(--accent)",
          }}
        >
          <p className="p" style={{ margin: 0 }}>{block.text}</p>
        </aside>
      );
  }
}

// Build the article body text for the structured data `articleBody`
// field. Strips JSX-specific bits and concatenates all visible text
// — gives Google + AI search engines a clean plaintext copy without
// having to scrape the rendered DOM.
function articleBodyText(post: BlogPost): string {
  const parts: string[] = [post.lead];
  for (const block of post.body) {
    if (block.type === "h2" || block.type === "h3" || block.type === "p" || block.type === "callout") {
      parts.push(block.text);
    } else if (block.type === "list") {
      parts.push(block.items.join(" "));
    }
  }
  return parts.join("\n\n");
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) notFound();
  setRequestLocale(locale);
  const post = postBySlug(slug);
  if (!post) notFound();

  const pageUrl = `/blog/${post.slug}`;
  // articleNode already wires author + publisher + inLanguage to the
  // Org node. Augmenting with `keywords` (schema.org-recognized for
  // editorial topical taxonomy) + `articleBody` (full plaintext —
  // helpful for AI search engines pulling citations) + `timeRequired`
  // (ISO-8601 duration).
  const articleSchema = articleNode({
    url: pageUrl,
    headline: post.headline,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: "en",
  });
  // Splice the extra fields onto the article node.
  Object.assign(articleSchema, {
    keywords: post.keywords.join(", "),
    articleBody: articleBodyText(post),
    timeRequired: `PT${post.readingMinutes}M`,
    wordCount: articleBodyText(post).split(/\s+/).length,
  });

  const graph = siteGraph([
    articleSchema,
    breadcrumbListNode([
      { name: "Home", url: "/" },
      { name: "Blog", url: "/blog" },
      { name: post.headline, url: pageUrl },
    ]),
  ]);

  // Related-posts strip: surface other posts in the same first-tag
  // cluster as topical-cluster reinforcement, with a small fallback
  // to "any other post" so the page never renders empty.
  const related = BLOG_POSTS.filter(
    (other) => other.slug !== post.slug && other.tags[0] === post.tags[0]
  );
  const otherPosts = related.length > 0 ? related : BLOG_POSTS.filter((other) => other.slug !== post.slug);

  return (
    <>
      <StructuredData graph={graph} />
      <main className="container section">
        <nav style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          <Link href="/" style={{ color: "inherit" }}>Home</Link>
          {" / "}
          <Link href="/blog" style={{ color: "inherit" }}>Blog</Link>
          {" / "}
          <span>{post.tags[0]}</span>
        </nav>

        <article>
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            {post.tags.join(" · ")} · {post.readingMinutes} min read
          </div>

          <h1 className="h1" style={{ marginTop: 12, maxWidth: 900 }}>
            {post.headline}
          </h1>

          <div className="smallNote" style={{ marginTop: 16 }}>
            Published {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
            {post.updatedAt && post.updatedAt !== post.publishedAt && (
              <>
                {" · Updated "}
                {new Date(post.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </>
            )}
            {" · "}By Komlan Kouhiko
          </div>

          <p className="p" style={{ marginTop: 32, maxWidth: 720, fontSize: 18, lineHeight: 1.7, opacity: 0.9 }}>
            {post.lead}
          </p>

          <div style={{ marginTop: 24 }}>
            {post.body.map((block, i) => renderBlock(block, i))}
          </div>
        </article>

        <div style={{ height: 64 }} />

        <section>
          <h2 className="h2">Keep reading</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
            marginTop: 16,
          }}>
            {otherPosts.slice(0, 3).map((other) => (
              <Link
                key={other.slug}
                href={`/blog/${other.slug}`}
                className="panel"
                style={{ display: "block", padding: 16, textDecoration: "none" }}
              >
                <div className="smallNote">{other.tags[0]}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginTop: 6 }}>
                  {other.headline}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
