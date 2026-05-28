// JSON-LD graph builders. One @graph per page (per 2026 best practice) lets
// search engines and AI crawlers walk a single document of nodes that
// reference each other by @id — Organization is declared once, then Service
// and Article nodes link back to it without re-declaring the same fields.

import { aggregateRating, TESTIMONIALS } from "@/lib/seo/testimonials";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com").replace(/\/$/, "");

const ORG_ID = `${SITE_URL}/#organization`;
const FOUNDER_ID = `${SITE_URL}/#founder`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;

// Physical base for local-SEO signals. City + state only (per user
// preference) — sufficient for Google's local pack and for "near me"
// queries originating from the DMV.
const BUSINESS_LOCALITY = "Stafford";
const BUSINESS_REGION = "VA";
const BUSINESS_REGION_FULL = "Virginia";
const BUSINESS_COUNTRY = "US";
// Stafford, VA centroid. Used as the LocalBusiness `geo` anchor and as
// the centerpoint for `serviceArea` radius. ~50 mi reaches Richmond,
// Fredericksburg, DC, Northern VA, and most of central Maryland — i.e.
// the full DMV the user wants to be discoverable in.
const BUSINESS_GEO = { latitude: 38.4221, longitude: -77.4080 };
const SERVICE_AREA_RADIUS_METERS = 80_000; // ~50 mi

// Optional contact signals — set via env so they can be filled in
// without a code edit. The phone number is a strong local-SEO signal
// and required for some rich results.
const BUSINESS_PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE?.trim() || null;
const GBP_URL = process.env.NEXT_PUBLIC_GBP_URL?.trim() || "https://share.google/1vArXT26e2XEdqj0h";

// External profiles the Organization controls. Listed in schema.org `sameAs`
// so Google's Knowledge Graph and AI search (Perplexity, ChatGPT browsing)
// can disambiguate the entity across the open web. More platforms here =
// stronger entity-confidence signal — Google cross-references the URLs to
// confirm the studio is one consistent entity across surfaces, which is
// the foundation of the Knowledge Graph. Add new ones here.
//
// Tracking params (?mibextid=…, ?igsh=…, ?utm_source=qr) stripped from the
// canonical URLs so schema validators don't flag them as redirect-laden.
const SAME_AS_URLS = [
  "https://www.linkedin.com/in/komlan-crecy-olympe-kouhiko-60aa85407",
  "https://github.com/kkoly10",
  "https://www.facebook.com/share/1GFn42rFuS/",
  "https://www.instagram.com/crecystudio",
  GBP_URL,
].filter(Boolean) as string[];

// Cities + admin areas the studio actively serves. Shows up on every
// LocalBusiness payload so Google understands the service-area scope.
// Mirrored by the city landing pages under /locations/* so the
// structured-data claim is backed by indexable content.
const SERVED_PLACES = [
  { type: "City", name: "Stafford, Virginia" },
  { type: "City", name: "Fredericksburg, Virginia" },
  { type: "City", name: "Richmond, Virginia" },
  { type: "City", name: "Ashland, Virginia" },
  { type: "City", name: "Washington, D.C." },
  { type: "AdministrativeArea", name: "Northern Virginia" },
  { type: "AdministrativeArea", name: "Maryland" },
  { type: "AdministrativeArea", name: "DMV (DC, Maryland, Virginia)" },
] as const;

// English-speaking countries the studio actively serves remotely.
// Drives hreflang `en-US` / `en-CA` / `en-GB` alternates and the
// `areaServed` array on Organization / LocalBusiness.
const SERVED_COUNTRIES = ["United States", "Canada", "United Kingdom"] as const;

type GraphNode = Record<string, unknown>;

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function postalAddressNode(): GraphNode {
  return {
    "@type": "PostalAddress",
    addressLocality: BUSINESS_LOCALITY,
    addressRegion: BUSINESS_REGION,
    addressCountry: BUSINESS_COUNTRY,
  };
}

function geoNode(): GraphNode {
  return {
    "@type": "GeoCoordinates",
    latitude: BUSINESS_GEO.latitude,
    longitude: BUSINESS_GEO.longitude,
  };
}

function serviceAreaNode(): GraphNode {
  // GeoCircle centered on Stafford, VA. Google reads this as the
  // primary service-area for the LocalBusiness when there's no
  // physical storefront.
  return {
    "@type": "GeoCircle",
    geoMidpoint: geoNode(),
    geoRadius: SERVICE_AREA_RADIUS_METERS,
  };
}

function areaServedNodes(): GraphNode[] {
  // Combine specific places + countries so both "web designer in
  // Fredericksburg VA" and "Canadian web studio" queries get a hit.
  return [
    ...SERVED_PLACES.map((place) => ({
      "@type": place.type,
      name: place.name,
    })),
    ...SERVED_COUNTRIES.map((country) => ({
      "@type": "Country",
      name: country,
    })),
  ];
}

// Canonical service catalog. Each entry is the @id of the Service
// node declared on its dedicated landing page (via `serviceNode()` or
// `aiIntegrationServiceNode()`). The Organization node references
// these by @id in `hasOfferCatalog` — that's the schema.org-blessed
// way to tell Google "this organization offers these N services, and
// the authoritative page for each one lives at this URL."
//
// Why this matters for SEO: without these references, Google has to
// guess whether to show the homepage or a service page when someone
// searches "website design Stafford" or "AI integration consultant".
// The homepage tends to win because it has more inbound links. With
// these references, the service @ids become the canonical entities
// for their respective queries — Google routes service-specific
// queries to the service page, brand-level queries to the homepage.
//
// Slugs must match the service page paths in app/[locale]/{slug}/.
const SERVICE_CATALOG: { slug: string; name: string }[] = [
  { slug: "websites", name: "Website design & development" },
  { slug: "custom-web-apps", name: "Custom web app development" },
  { slug: "ai-integration", name: "AI integration" },
  { slug: "systems", name: "Workflow automation" },
  { slug: "ecommerce", name: "E-commerce development" },
  { slug: "client-portals", name: "Client portal development" },
  { slug: "website-rescue", name: "Website rescue" },
  { slug: "care-plans", name: "Website maintenance & care plans" },
];

function serviceCatalogOfferings(): GraphNode {
  return {
    "@type": "OfferCatalog",
    name: "CrecyStudio services",
    itemListElement: SERVICE_CATALOG.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        // @id references the Service node emitted by the service
        // page itself. Google reads this as "the canonical Service
        // entity is over there", not "here's a duplicate Service."
        "@id": `${SITE_URL}/${service.slug}#service`,
        name: service.name,
        url: `${SITE_URL}/${service.slug}`,
        provider: { "@id": ORG_ID },
      },
    })),
  };
}

export function organizationNode(): GraphNode {
  // ProfessionalService is the schema.org subtype that fits a small web
  // studio — more specific than bare Organization, and what AI search
  // surfaces (Perplexity, ChatGPT) use to categorize an entity in answers.
  // ProfessionalService extends LocalBusiness, so address/geo/areaServed
  // propagate. The separate LocalBusiness node below carries the same
  // identity (sameAs ORG_ID) so Knowledge Graph collapses them.
  return {
    "@type": "ProfessionalService",
    "@id": ORG_ID,
    name: "CrecyStudio",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/crecy-d1-horizontal-light.svg`,
    image: `${SITE_URL}/brand/crecy-d1-horizontal-light.svg`,
    description:
      "Independent web studio serving the DMV (Stafford, Fredericksburg, Richmond, DC, Maryland) and English-speaking clients across the US, Canada, and UK. Premium websites, custom web apps and SaaS products, AI integration — by a founder running four production SaaS products of his own (Fleiko, Proveo, Korent, Kocre IT) across fleet, contractor, rental, and IT-services verticals.",
    slogan: "Independent web studio. Premium craft.",
    foundingDate: "2024",
    founder: { "@id": FOUNDER_ID },
    address: postalAddressNode(),
    geo: geoNode(),
    areaServed: areaServedNodes(),
    serviceArea: serviceAreaNode(),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "hello@crecystudio.com",
      url: `${SITE_URL}/contact`,
      availableLanguage: ["English", "French", "Spanish"],
      areaServed: ["US", "CA", "GB"],
      ...(BUSINESS_PHONE && { telephone: BUSINESS_PHONE }),
    },
    ...(BUSINESS_PHONE && { telephone: BUSINESS_PHONE }),
    // priceRange satisfies LocalBusiness's required field and gives Knowledge
    // Graph + AI answers a concrete signal of the studio's positioning
    // (boutique / mid-to-high). schema.org accepts the "$$" convention here.
    priceRange: "$$$",
    sameAs: SAME_AS_URLS,
    // Keyword-rich knowsAbout/serviceType. AI search engines
    // (Perplexity, ChatGPT, Claude) use these phrases to decide whether
    // the entity is a valid answer to "who does X". Mix the broad
    // category with the specific tool/technique names buyers actually
    // search for.
    knowsAbout: [
      "Web development",
      "Custom web applications",
      "AI integration",
      "OpenAI integration",
      "Anthropic Claude integration",
      "GPT-4 integration",
      "RAG implementation",
      "AI agent development",
      "AI copilot development",
      "Production AI",
      "E-commerce development",
      "Shopify development",
      "Client portals",
      "Website rescue",
      "Website redesign",
      "Workflow automation",
      "Next.js development",
      "React development",
      "Supabase",
      "Stripe integration",
      "Local SEO",
    ],
    serviceType: [
      "Web design",
      "Web development",
      "Custom web app development",
      "AI integration",
      "AI agent development",
      "OpenAI integration",
      "Workflow automation",
      "E-commerce development",
      "Client portal development",
      "Website rescue",
      "Website maintenance",
    ],
    // hasOfferCatalog lists the 8 services with @id references back
    // to the dedicated service-page Service nodes. This is the move
    // that nudges Google to show /websites instead of / for "website
    // design" queries, /ai-integration for "AI integration", etc. —
    // the @id reference makes the service page the canonical entity
    // for its query, not just one of many pages mentioning the term.
    hasOfferCatalog: serviceCatalogOfferings(),
  };
}

export function localBusinessNode(): GraphNode {
  // Explicit LocalBusiness node alongside the ProfessionalService. Both
  // share identity via sameAs back to the canonical org URL, so Google
  // collapses them in the Knowledge Graph while giving us strong local
  // signals (address + geo + serviceArea + openingHours) in their own
  // dedicated node — which improves local pack visibility.
  return {
    "@type": "LocalBusiness",
    "@id": LOCAL_BUSINESS_ID,
    name: "CrecyStudio",
    url: SITE_URL,
    image: `${SITE_URL}/brand/crecy-d1-horizontal-light.svg`,
    logo: `${SITE_URL}/brand/crecy-d1-horizontal-light.svg`,
    description:
      "Web studio in Stafford, VA building websites, custom web apps, SaaS products, and AI integrations. Founder runs four production SaaS products of his own (Fleiko, Proveo, Korent, Kocre IT). Serves the DMV — Fredericksburg, Richmond, Ashland, Washington DC, Maryland — plus remote clients across the US, Canada, and UK.",
    address: postalAddressNode(),
    geo: geoNode(),
    areaServed: areaServedNodes(),
    serviceArea: serviceAreaNode(),
    ...(BUSINESS_PHONE && { telephone: BUSINESS_PHONE }),
    email: "hello@crecystudio.com",
    priceRange: "$$$",
    // 24-hour-by-appointment is the right shape for a remote studio —
    // it tells Google "always reachable async" without claiming a
    // walk-in storefront.
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    sameAs: [ORG_ID, ...SAME_AS_URLS],
    // AggregateRating + Review nodes — only emitted when real
    // testimonials have been wired into lib/seo/testimonials.ts.
    // With at least one entry, the LocalBusiness becomes eligible
    // for star-rating SERP rich results (the single highest-CTR
    // organic SEO improvement available without buying ads). With
    // zero entries (current launch state), nothing's emitted —
    // schema.org allows a LocalBusiness without aggregateRating, and
    // emitting an empty one would be a Google validator failure.
    ...(aggregateRating() && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: aggregateRating()!.ratingValue,
        reviewCount: aggregateRating()!.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
      review: TESTIMONIALS.map((testimonial) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: testimonial.rating,
          bestRating: 5,
          worstRating: 1,
        },
        author: testimonial.authorOrg
          ? {
              "@type": "Person",
              name: testimonial.authorName,
              worksFor: {
                "@type": "Organization",
                name: testimonial.authorOrg,
              },
            }
          : { "@type": "Person", name: testimonial.authorName },
        datePublished: testimonial.datePublished,
        reviewBody: testimonial.text,
        ...(testimonial.sourceUrl && { url: testimonial.sourceUrl }),
        itemReviewed: { "@id": LOCAL_BUSINESS_ID },
      })),
    }),
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
    // SearchAction enables Google's sitelinks searchbox on the
    // CrecyStudio brand result — a small inline search field that
    // lets users query the site directly from the SERP. The query
    // gets passed to /search?q={search_term_string} (when we have a
    // search page) or to Google's intent-routing fallback. Without
    // this, brand searches surface only the homepage; with it,
    // Google can deep-link to service pages, case studies, etc. via
    // the searchbox flow.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
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

export function serviceNode(opts: {
  // Stable id segment, e.g. "ai-integration", "websites".
  slug: string;
  name: string;
  description: string;
  // Page URL where the service is described (used as @id + url).
  pageUrl: string;
  // Optional list of more-specific offerings under this service for
  // the `hasOfferCatalog` field. AI search engines use these to answer
  // "what specifically does X do" follow-up questions.
  offerings?: string[];
  // Optional override for `areaServed`. Per-city pages should pass
  // the SINGLE city this page targets — otherwise every city's
  // Service node claims to serve every other city in the DMV, which
  // dilutes the local-SEO signal. Defaults to the umbrella list
  // (used by lane-wide service pages like /websites where the
  // service genuinely covers the full service area).
  areaServed?: GraphNode[];
}): GraphNode {
  return {
    "@type": "Service",
    "@id": `${absoluteUrl(opts.pageUrl)}#service`,
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.pageUrl),
    provider: { "@id": ORG_ID },
    serviceType: opts.name,
    areaServed: opts.areaServed ?? areaServedNodes(),
    ...(opts.offerings && opts.offerings.length > 0 && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: `${opts.name} offerings`,
        itemListElement: opts.offerings.map((offering) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: offering,
          },
        })),
      },
    }),
  };
}

// Sub-offerings under the AI integration service. Each becomes its own
// Offer + Service in the @graph — gives AI search engines (Perplexity,
// ChatGPT, Claude) concrete answers to "what does CrecyStudio
// specifically build with AI". Order matters for SERP snippets:
// highest-intent / most-searched terms first.
const AI_SUB_OFFERINGS = [
  {
    name: "AI agent development",
    description:
      "Production AI agents with safety gates, tool-use boundaries, and human-in-the-loop confirmation for high-stakes actions.",
  },
  {
    name: "AI copilot development",
    description:
      "In-product AI copilots that suggest next actions, draft content, and surface insights — without ever silently editing your data.",
  },
  {
    name: "OpenAI integration (GPT-4, GPT-4o, o1)",
    description:
      "OpenAI API integration into production web apps — structured outputs, function calling, streaming, cost controls.",
  },
  {
    name: "Anthropic Claude integration",
    description:
      "Claude API integration with prompt caching, computer use, and the Claude Agent SDK for long-running tasks.",
  },
  {
    name: "RAG (Retrieval-Augmented Generation)",
    description:
      "Vector-database-backed RAG pipelines on Supabase pgvector or Pinecone — for answering questions over your own documents.",
  },
  {
    name: "Vision AI integration",
    description:
      "GPT-4o vision and Claude vision integration — photo classification, document parsing, image-based QA.",
  },
  {
    name: "Custom GPTs and Claude projects",
    description:
      "Branded custom GPTs and Claude projects tuned to your domain — for internal use or customer-facing assistants.",
  },
  {
    name: "AI prompt engineering & evals",
    description:
      "Prompt engineering, evaluation harnesses, and regression suites so your AI behavior is measurable and reproducible.",
  },
  {
    name: "AI workflow automation",
    description:
      "AI-driven workflow automation — auto-triage, auto-routing, content generation pipelines, multi-step task orchestration.",
  },
];

// Tools & platforms the studio works with. schema.org `mentions` is the
// right field for "this service uses these things". AI search engines
// use this to answer "who integrates OpenAI" / "who builds on
// pgvector" — without it the studio would only match the generic
// "AI" search, not the buyer-intent technology-specific search.
const AI_TECH_MENTIONS = [
  { name: "OpenAI GPT-4" },
  { name: "OpenAI GPT-4o" },
  { name: "Anthropic Claude" },
  { name: "Anthropic Claude Agent SDK" },
  { name: "Supabase pgvector" },
  { name: "OpenAI Embeddings" },
  { name: "OpenAI Whisper" },
  { name: "Next.js" },
  { name: "TypeScript" },
  { name: "Vercel AI SDK" },
];

export function aiIntegrationServiceNode(opts: {
  // Canonical URL of the AI integration page (e.g. "/ai-integration"
  // or "/fr/ai-integration"). Used as the @id anchor so the rich
  // node is the canonical Service entity for the page.
  pageUrl: string;
  // BCP-47 lang tag for the page. AI search engines pick the right
  // localized result when this matches the page's <html lang>.
  inLanguage: string;
  // Hero copy already shown on the page. Keeping it in the schema
  // satisfies Google's "structured data must match visible content"
  // rule — paste from the i18n key the page renders.
  serviceName: string;
  serviceDescription: string;
}): GraphNode {
  const url = absoluteUrl(opts.pageUrl);
  return {
    "@type": "Service",
    // @id matches the SERVICE_CATALOG reference on the Organization
    // node (which uses `{slug}#service`) — so when Google resolves the
    // catalog reference for ai-integration, this rich node IS the
    // entity, not a separate one. Keeping a single @id per service
    // prevents Knowledge Graph from treating the basic ServicePage
    // Service node and this rich one as two different entities.
    "@id": `${url}#service`,
    name: opts.serviceName,
    description: opts.serviceDescription,
    url,
    provider: { "@id": ORG_ID },
    inLanguage: opts.inLanguage,
    // Same DMV + US/CA/GB service area as the LocalBusiness — keeps
    // the local pack relevance signal consistent.
    areaServed: areaServedNodes(),
    // serviceType doubles as the SEO keyword surface. List the most-
    // searched buyer phrases first.
    serviceType: [
      "AI integration",
      "AI agent development",
      "AI copilot development",
      "OpenAI integration",
      "Anthropic Claude integration",
      "GPT-4 integration",
      "RAG implementation",
      "AI workflow automation",
      "Vision AI integration",
      "AI prompt engineering",
    ],
    // Tools & platforms the studio works with. `applicationCategory`
    // accepts free-text per the schema.org spec; using a descriptive
    // phrase rather than an invented enum like "AIApplication" (which
    // isn't on schema.org's recognized values list and gets flagged by
    // Google's structured-data validator).
    mentions: AI_TECH_MENTIONS.map((tech) => ({
      "@type": "SoftwareApplication",
      name: tech.name,
      applicationCategory: "Artificial intelligence platform",
    })),
    // Sub-offerings as a proper OfferCatalog. AI search engines walk
    // this list to answer "does X specifically do Y" follow-up
    // queries. Each sub-offering exposed as its own Service so the
    // catalog is rich-result-eligible.
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "AI integration offerings",
      itemListElement: AI_SUB_OFFERINGS.map((offering) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: offering.name,
          description: offering.description,
          provider: { "@id": ORG_ID },
        },
      })),
    },
  };
}

// Speakable spec for voice search and AI-assistant answers (Google
// Assistant, Siri, Alexa skill answers, and increasingly LLM-based
// search like Perplexity). Tells the engine: "if a user asks
// 'what does CrecyStudio do for AI', read these page elements
// aloud." The css selectors must match real DOM nodes on the page.
export function speakableNode(opts: {
  pageUrl: string;
  // CSS selectors of the elements that hold the canonical "answer"
  // copy — usually the h1 + lead paragraph. Both ServicePage's heroTitle
  // and heroIntro have stable class names from the CSS module that we
  // can target.
  selectors: string[];
}): GraphNode {
  return {
    "@type": "WebPage",
    "@id": `${absoluteUrl(opts.pageUrl)}#webpage`,
    url: absoluteUrl(opts.pageUrl),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: opts.selectors,
    },
  };
}

export function siteGraph(nodes: GraphNode[]): GraphNode {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

// Re-exported constants so other modules (city landing pages, footer
// component, location label helpers) stay in sync with the schema
// payload without duplicating the city list.
export const LOCAL_BUSINESS_CONSTANTS = {
  locality: BUSINESS_LOCALITY,
  region: BUSINESS_REGION,
  regionFull: BUSINESS_REGION_FULL,
  country: BUSINESS_COUNTRY,
  geo: BUSINESS_GEO,
  phone: BUSINESS_PHONE,
  servedPlaces: SERVED_PLACES,
  servedCountries: SERVED_COUNTRIES,
};
