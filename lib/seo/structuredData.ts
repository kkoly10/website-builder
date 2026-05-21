// JSON-LD graph builders. One @graph per page (per 2026 best practice) lets
// search engines and AI crawlers walk a single document of nodes that
// reference each other by @id — Organization is declared once, then Service
// and Article nodes link back to it without re-declaring the same fields.

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com").replace(/\/$/, "");

const ORG_ID = `${SITE_URL}/#organization`;
const FOUNDER_ID = `${SITE_URL}/#founder`;
const WEBSITE_ID = `${SITE_URL}/#website`;

// External profiles the Organization controls. Listed in schema.org `sameAs`
// so Google's Knowledge Graph and AI search (Perplexity, ChatGPT browsing)
// can disambiguate the entity across the open web. Add new ones here.
const SAME_AS_URLS = [
  "https://www.linkedin.com/in/komlan-crecy-olympe-kouhiko-60aa85407",
  "https://github.com/kkoly10",
];

type GraphNode = Record<string, unknown>;

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function organizationNode(): GraphNode {
  // ProfessionalService is the schema.org subtype that fits a small web
  // studio — more specific than bare Organization, and what AI search
  // surfaces (Perplexity, ChatGPT) use to categorize an entity in answers.
  // ProfessionalService extends LocalBusiness, so the LocalBusiness signal
  // (priceRange, areaServed, sameAs) propagates without us declaring it
  // twice.
  return {
    "@type": "ProfessionalService",
    "@id": ORG_ID,
    name: "CrecyStudio",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/crecy-d1-horizontal-light.svg`,
    image: `${SITE_URL}/brand/crecy-d1-horizontal-light.svg`,
    description:
      "Independent web studio building premium websites, custom web systems, and AI-powered products.",
    slogan: "Independent web studio. Premium craft.",
    foundingDate: "2024",
    founder: { "@id": FOUNDER_ID },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "hello@crecystudio.com",
      url: `${SITE_URL}/contact`,
      availableLanguage: ["English", "French", "Spanish"],
    },
    areaServed: "Worldwide",
    // priceRange satisfies LocalBusiness's required field and gives Knowledge
    // Graph + AI answers a concrete signal of the studio's positioning
    // (boutique / mid-to-high). schema.org accepts the "$$" convention here.
    priceRange: "$$$",
    sameAs: SAME_AS_URLS,
    knowsAbout: [
      "Web development",
      "Custom web applications",
      "AI integration",
      "E-commerce",
      "Client portals",
      "Website rescue",
      "Workflow automation",
    ],
    serviceType: [
      "Web design",
      "Web development",
      "AI integration",
      "Workflow automation",
    ],
  };
}

export function founderNode(): GraphNode {
  return {
    "@type": "Person",
    "@id": FOUNDER_ID,
    name: "Komlan Kouhiko",
    jobTitle: "Founder",
    worksFor: { "@id": ORG_ID },
    url: `${SITE_URL}/about`,
  };
}

export function websiteNode(): GraphNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: "CrecyStudio",
    publisher: { "@id": ORG_ID },
    inLanguage: ["en", "fr", "es"],
  };
}

export function breadcrumbListNode(
  items: { name: string; url: string }[]
): GraphNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function articleNode(opts: {
  url: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  // BCP-47 language tag matching the page's <html lang>. Defaults to "en"
  // for backwards compat with the original caller; callers on /fr or /es
  // pages must pass their locale so Google doesn't see mixed signals
  // (Article claiming English while the page lang says fr).
  inLanguage?: string;
}): GraphNode {
  return {
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    url: absoluteUrl(opts.url),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: { "@id": FOUNDER_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: opts.inLanguage ?? "en",
    ...(opts.image && { image: absoluteUrl(opts.image) }),
  };
}

export function faqPageNode(
  items: { question: string; answer: string }[],
  pageUrl: string,
): GraphNode {
  // FAQPage rich result. Google Search shows Q&A snippets directly in
  // results when this schema is present and the questions match the
  // visible page copy — required by Google for the rich result to render.
  // Callers should pass the same Q/A strings that the page renders so the
  // signal is consistent.
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(pageUrl)}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function siteGraph(nodes: GraphNode[]): GraphNode {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
