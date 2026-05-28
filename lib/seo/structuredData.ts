// JSON-LD graph builders. One @graph per page (per 2026 best practice) lets
// search engines and AI crawlers walk a single document of nodes that
// reference each other by @id — Organization is declared once, then Service
// and Article nodes link back to it without re-declaring the same fields.

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
// can disambiguate the entity across the open web. Add new ones here.
const SAME_AS_URLS = [
  "https://www.linkedin.com/in/komlan-crecy-olympe-kouhiko-60aa85407",
  "https://github.com/kkoly10",
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
      "Independent web studio serving the DMV (Stafford, Fredericksburg, Richmond, DC, Maryland) and English-speaking clients across the US, Canada, and UK. Premium websites, custom web systems, and AI integration.",
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
      "Web studio in Stafford, VA serving the DMV — Fredericksburg, Richmond, Ashland, Washington DC, Maryland — plus remote clients across the US, Canada, and UK.",
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
}): GraphNode {
  return {
    "@type": "Service",
    "@id": `${absoluteUrl(opts.pageUrl)}#service`,
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.pageUrl),
    provider: { "@id": ORG_ID },
    serviceType: opts.name,
    areaServed: areaServedNodes(),
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
