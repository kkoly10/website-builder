// Location data backing the /locations/[city] landing pages. Each
// entry is one indexable page targeting "{service} in {city}" queries
// — the standard local-SEO pattern for a service-area business.
//
// Slug rules: lowercase, hyphen-separated, state-suffixed where
// disambiguation matters (so a future Richmond-CA wouldn't collide).
// Slugs are part of the canonical URL and the structured-data @id; do
// not change one without a 301 redirect.

export type LocationSlug =
  | "stafford-va"
  | "fredericksburg-va"
  | "richmond-va"
  | "ashland-va"
  | "washington-dc"
  | "arlington-va"
  | "alexandria-va"
  | "bethesda-md"
  | "silver-spring-md"
  | "annapolis-md"
  | "northern-virginia"
  | "maryland"
  | "dmv";

export type Location = {
  slug: LocationSlug;
  // schema.org @type for this place. "City" is the right tag for a
  // single named municipality (Stafford, Richmond, DC); umbrella
  // entries like Maryland (a state), Northern Virginia (a sub-region),
  // and the DMV (a multi-state metro) need "AdministrativeArea"
  // instead — using "City" for those produces invalid structured data
  // that Google's validator flags.
  type: "City" | "AdministrativeArea";
  // Display name used in H1 and meta. Keep canonical (no abbreviations
  // unless the city itself uses one, like "Washington, D.C.").
  name: string;
  // Short "in X" form used in titles and inline copy. Optimized for
  // the SERP — don't add "the" or other filler.
  shortName: string;
  // Region label for the breadcrumb + footer. Keep consistent across
  // cities in the same metro so the breadcrumb hierarchy reads
  // cleanly.
  region: string;
  // Geo anchor. Used for the LocalBusiness `geo` field on this
  // specific page so the page ranks for "near me" queries originating
  // close to this city — not just the home-base Stafford coords.
  geo: { latitude: number; longitude: number };
  // Approximate driving distance from Stafford, VA (the studio's
  // home base). Customers ask this in the discovery call; surfacing
  // it on the page also reads as honest local context to Google.
  // Null for the home-base city itself.
  distanceFromHomeMiles: number | null;
  // Short, distinctive copy for the hero body. Avoid generic "we
  // serve X" filler — this is the one piece of unique content that
  // distinguishes the page from a thin local-SEO doorway page and
  // keeps it on the right side of Google's quality bar.
  intro: string;
  // Specific reasons local clients pick the studio. Renders as a
  // bullet list. 3-5 items each.
  whyLocal: string[];
};

export const LOCATIONS: Location[] = [
  {
    slug: "stafford-va",
    type: "City",
    name: "Stafford, Virginia",
    shortName: "Stafford, VA",
    region: "Virginia",
    geo: { latitude: 38.4221, longitude: -77.4080 },
    distanceFromHomeMiles: null,
    intro:
      "CrecyStudio is based in Stafford. We build premium websites, custom web apps, and AI integrations for businesses in Stafford County and the I-95 corridor between Fredericksburg and DC.",
    whyLocal: [
      "Same-day response for Stafford-based clients during business hours.",
      "In-person discovery calls at your office on request.",
      "Familiar with the local market — government contractors, defense suppliers, service businesses around Quantico.",
      "Same time zone, same week, same accountability as your team.",
    ],
  },
  {
    slug: "fredericksburg-va",
    type: "City",
    name: "Fredericksburg, Virginia",
    shortName: "Fredericksburg, VA",
    region: "Virginia",
    geo: { latitude: 38.3032, longitude: -77.4605 },
    distanceFromHomeMiles: 15,
    intro:
      "Web design and AI integration for Fredericksburg businesses — about 15 minutes from our home base in Stafford. We work with downtown Fredericksburg service businesses, breweries, professional firms, and growing e-commerce brands.",
    whyLocal: [
      "Short drive — happy to meet in person in downtown Fredericksburg or at your office.",
      "Familiar with the small-business landscape from Caroline Street to Central Park.",
      "Bilingual project workspace (English / French / Spanish) — useful if your customer base reflects the region's diversity.",
      "Premium craft at a non-DC price point.",
    ],
  },
  {
    slug: "richmond-va",
    type: "City",
    name: "Richmond, Virginia",
    shortName: "Richmond, VA",
    region: "Virginia",
    geo: { latitude: 37.5407, longitude: -77.4360 },
    distanceFromHomeMiles: 55,
    intro:
      "Custom web systems, AI integration, and premium websites for Richmond businesses. About an hour south of our Stafford studio — easy day-trip distance for in-person kickoffs at Scott's Addition, Shockoe Bottom, or your office.",
    whyLocal: [
      "Senior independent practitioner — no agency layer between you and the person writing the code.",
      "Strong fit for Richmond's growing tech and food/beverage scene.",
      "Same async-first workflow that works for distributed Richmond teams.",
      "AI work shipped to production, not pitched on a slide deck.",
    ],
  },
  {
    slug: "ashland-va",
    type: "City",
    name: "Ashland, Virginia",
    shortName: "Ashland, VA",
    region: "Virginia",
    geo: { latitude: 37.7593, longitude: -77.4789 },
    distanceFromHomeMiles: 45,
    intro:
      "Web design and AI integration for Ashland and Hanover County businesses. About 45 minutes from Stafford on I-95 — close enough for in-person meetings, far enough that we work async by default.",
    whyLocal: [
      "Same workflow used by Ashland-area service businesses and B2B firms.",
      "Direct line to the founder for every project — no account managers.",
      "AI integrations that are practical for small teams (not enterprise overkill).",
      "Same-day async responses, weekly cadence on active projects.",
    ],
  },
  {
    slug: "washington-dc",
    type: "City",
    name: "Washington, D.C.",
    shortName: "Washington, DC",
    region: "District of Columbia",
    geo: { latitude: 38.9072, longitude: -77.0369 },
    distanceFromHomeMiles: 50,
    intro:
      "Premium websites, custom web apps, and AI integration for DC-based associations, nonprofits, consultancies, and government-adjacent businesses. About an hour from our Stafford studio.",
    whyLocal: [
      "In-person kickoffs in DC on request — Foggy Bottom, Capitol Hill, K Street.",
      "Used to working with policy / association / consulting workflows.",
      "Async-first delivery that fits how DC professionals actually work.",
      "AI integration done with the kind of safety guardrails a DC client expects.",
    ],
  },
  {
    slug: "arlington-va",
    type: "City",
    name: "Arlington, Virginia",
    shortName: "Arlington, VA",
    region: "Virginia",
    geo: { latitude: 38.8816, longitude: -77.0910 },
    distanceFromHomeMiles: 40,
    intro:
      "Web design, custom web apps, and AI integration for Arlington businesses — Rosslyn, Crystal City, Ballston, Pentagon City, Clarendon. About 40 miles north of our Stafford studio, easy drive for in-person kickoffs.",
    whyLocal: [
      "Familiar with Arlington's defense / federal contractor / tech-adjacent client base — confidentiality and security defaults baked in.",
      "Direct work with the founder for the entire engagement, not handed off to a junior team.",
      "Production AI experience that matters when working near government clients — auditable, gated, human-in-the-loop.",
      "Async-first delivery that fits how Arlington-area professionals actually work day-to-day.",
    ],
  },
  {
    slug: "alexandria-va",
    type: "City",
    name: "Alexandria, Virginia",
    shortName: "Alexandria, VA",
    region: "Virginia",
    geo: { latitude: 38.8048, longitude: -77.0469 },
    distanceFromHomeMiles: 35,
    intro:
      "Premium websites, custom web apps, and AI integration for Alexandria businesses — Old Town, Del Ray, Carlyle, Eisenhower Avenue. About 35 miles north of our Stafford studio on I-95.",
    whyLocal: [
      "In-person discovery calls in Old Town or your office on request.",
      "Strong fit for Alexandria's mix of consulting firms, associations, and small professional businesses.",
      "Independent practitioner — no agency markup, same person from scope to launch.",
      "Bilingual workspace (English / French / Spanish) — useful if your customer base reflects Alexandria's diversity.",
    ],
  },
  {
    slug: "bethesda-md",
    type: "City",
    name: "Bethesda, Maryland",
    shortName: "Bethesda, MD",
    region: "Maryland",
    geo: { latitude: 38.9847, longitude: -77.0947 },
    distanceFromHomeMiles: 60,
    intro:
      "Web design, custom web apps, and AI integration for Bethesda businesses — downtown Bethesda, Chevy Chase, NIH corridor, Friendship Heights. About an hour from our Stafford studio.",
    whyLocal: [
      "Familiar with Bethesda's biotech / healthcare / consulting client landscape — projects scoped with the right level of compliance awareness.",
      "AI integration with real safety thinking — important for the healthcare and research orgs that anchor the area.",
      "Direct work with the founder, no junior handoffs.",
      "Async-first delivery that respects how Bethesda professionals actually work.",
    ],
  },
  {
    slug: "silver-spring-md",
    type: "City",
    name: "Silver Spring, Maryland",
    shortName: "Silver Spring, MD",
    region: "Maryland",
    geo: { latitude: 38.9907, longitude: -77.0261 },
    distanceFromHomeMiles: 65,
    intro:
      "Premium websites and AI integration for Silver Spring businesses — downtown Silver Spring, Wheaton, Takoma Park, the Discovery corridor. About 65 miles from our Stafford studio.",
    whyLocal: [
      "Familiar with Silver Spring's mix of nonprofits, media companies, and small professional firms.",
      "Independent practitioner — no agency layer between you and the person writing the code.",
      "Production AI experience: shipped systems, not pitch decks.",
      "Same-day async responses for active projects.",
    ],
  },
  {
    slug: "annapolis-md",
    type: "City",
    name: "Annapolis, Maryland",
    shortName: "Annapolis, MD",
    region: "Maryland",
    geo: { latitude: 38.9784, longitude: -76.4922 },
    distanceFromHomeMiles: 90,
    intro:
      "Web design, custom web apps, and AI integration for Annapolis businesses — historic downtown, Eastport, the West Street corridor, USNA-adjacent firms. About 90 miles from our Stafford studio; we deliver async-first.",
    whyLocal: [
      "Comfortable with maritime, hospitality, and government-adjacent client work that defines Annapolis.",
      "Senior practitioner — same person from scope to launch.",
      "AI integration scoped honestly: practical for small teams, not enterprise overkill.",
      "Monthly in-person check-ins available if useful.",
    ],
  },
  {
    slug: "northern-virginia",
    type: "AdministrativeArea",
    name: "Northern Virginia",
    shortName: "Northern Virginia",
    region: "Virginia",
    geo: { latitude: 38.8462, longitude: -77.3064 },
    distanceFromHomeMiles: 35,
    intro:
      "Web design, custom web apps, and AI integration for businesses across Northern Virginia — Arlington, Alexandria, Reston, Tysons, Fairfax, Vienna. About 35 minutes north of our Stafford studio.",
    whyLocal: [
      "Familiar with NoVA's contractor / defense / tech-adjacent business landscape.",
      "Senior practitioner — same person from scope to launch.",
      "Production AI experience, not pitch-deck AI.",
      "Async-first workflow that respects your team's calendar.",
    ],
  },
  {
    slug: "maryland",
    type: "AdministrativeArea",
    name: "Maryland",
    shortName: "Maryland",
    region: "Maryland",
    geo: { latitude: 39.0458, longitude: -76.6413 },
    distanceFromHomeMiles: 80,
    intro:
      "Premium websites and AI integration for Maryland businesses — Bethesda, Silver Spring, Rockville, Annapolis, Baltimore. About 80 miles from our Stafford studio; we deliver async-first across the DMV.",
    whyLocal: [
      "Familiar with Maryland's biotech, healthcare, and nonprofit corridors.",
      "Direct work with the founder, not a junior team.",
      "AI integration with real safety thinking — important for healthcare and regulated industries.",
      "Async-first delivery, monthly in-person if useful.",
    ],
  },
  {
    slug: "dmv",
    type: "AdministrativeArea",
    name: "The DMV (DC, Maryland, Virginia)",
    shortName: "DMV",
    region: "DC / Maryland / Virginia",
    geo: { latitude: 38.8462, longitude: -77.3064 },
    distanceFromHomeMiles: 35,
    intro:
      "CrecyStudio is the DMV's independent web studio. We serve clients across DC, Maryland, and Virginia — from our home base in Stafford up the I-95 corridor through Fredericksburg, into Northern Virginia, across DC, and out to Bethesda, Silver Spring, and Baltimore.",
    whyLocal: [
      "Local enough for in-person discovery calls anywhere in the DMV.",
      "Async-first delivery that respects how the DMV actually works (commuting + remote).",
      "Premium craft at a price point that fits regional small/mid-size businesses — not Big Four agency rates.",
      "AI integration experience: production systems, not pitch decks.",
      "Bilingual workspace (English / French / Spanish) — useful for DC's international client base.",
    ],
  },
];

export function locationBySlug(slug: string): Location | undefined {
  return LOCATIONS.find((loc) => loc.slug === slug);
}

export function allLocationSlugs(): LocationSlug[] {
  return LOCATIONS.map((loc) => loc.slug);
}
