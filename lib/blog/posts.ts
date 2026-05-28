// Blog post catalog. Posts are inlined here (not pulled from a CMS or
// Markdown directory) because the volume is small and we want full
// control over structured-data fields and JSX rendering — no MDX
// processor, no content fetcher, no extra build step.
//
// SEO intent: each post is written to capture a specific keyword
// cluster that the marketing pages don't directly target. Service
// pages answer "what do you do"; case studies answer "how do you do
// it for clients"; blog posts answer "what should I know before I
// hire someone" / "what's actually true about X". The third category
// is where Google's quality algo rewards depth and originality, and
// where AI search engines (Perplexity, ChatGPT, Claude) pull
// "according to crecystudio.com" citations from.

export type BlogPost = {
  // URL slug — lowercase, hyphen-separated, no date prefix. Slug is
  // permanent; changing one needs a 301 redirect.
  slug: string;
  // SEO title. Front-loads the keyword target. Max ~60 chars.
  title: string;
  // SEO meta description. ~155 chars. Speaks to the search-intent
  // behind the post's keyword cluster.
  description: string;
  // Visible H1 — can be longer + more editorial than the SEO title.
  headline: string;
  // ISO date the post was first published. Drives Article.datePublished
  // + the sitemap lastmod field. Don't backdate.
  publishedAt: string;
  // Optional updated date for substantive edits. When set, Google
  // shows "Updated X ago" in some SERP layouts.
  updatedAt?: string;
  // Editorial lead — appears below the H1 and as the SearchAction
  // / Speakable answer paragraph.
  lead: string;
  // Body in MDX-lite shape: each block is a {h2, h3, p, list, code,
  // callout}. Renderer in app/[locale]/blog/[slug]/page.tsx walks
  // this array. Keeping the body as data rather than JSX lets us
  // generate the Article schema's `articleBody` field
  // deterministically from the same source the page renders.
  body: BlogBlock[];
  // ~3-5 keyword phrases the post targets. Joined into the Article
  // schema's `keywords` field — schema.org-recognized signal for
  // topical taxonomy.
  keywords: string[];
  // Tags shown to readers (often the same as keywords but written
  // for humans, not search algorithms).
  tags: string[];
  // Reading-time estimate in minutes. Rendered above the lead and
  // used in `Article.timeRequired` as ISO-8601 duration.
  readingMinutes: number;
};

export type BlogBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string };

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "ai-integration-checklist-2026",
    title: "AI integration checklist: what to actually scope in 2026",
    description:
      "Before you hire anyone to add AI to your product, walk this checklist. Eleven questions that separate a real production AI build from a demo that breaks in week two.",
    headline: "AI integration in 2026: the eleven questions to scope before you hire",
    publishedAt: "2026-01-15",
    updatedAt: "2026-05-28",
    lead:
      "Every week a business owner asks us to \"add AI\" to a product. Half the time the right answer is yes; the other half it's a calculator, a workflow tweak, or a search box dressed up in a chatbot UI. Here's the actual scoping checklist we run before quoting an AI integration.",
    body: [
      { type: "h2", text: "Before scope: what are you actually replacing?" },
      {
        type: "p",
        text:
          "Almost every \"add AI\" request maps to one of three patterns: replace a human reading something (triage, classification, summarisation), replace a human writing something (drafting, formatting, follow-up), or replace a human deciding something (routing, prioritising, suggesting next actions). The pattern dictates everything that follows — accuracy targets, guardrail strictness, audit needs, human-in-the-loop placement.",
      },
      {
        type: "p",
        text:
          "If you can't tell me which of those three you're replacing, the project isn't ready to scope. That's a discovery conversation, not a quote.",
      },
      { type: "h2", text: "The eleven questions" },
      { type: "h3", text: "1. What's the cost of being wrong?" },
      {
        type: "p",
        text:
          "An AI that misroutes a support ticket costs an extra reply. An AI that misclassifies a legal document costs a lawsuit. The cost-of-wrong dictates whether the AI gets to act autonomously, suggest with one-click confirm, or only draft for human review. We've never seen a project where this question was clearly answered upfront and the build went sideways later.",
      },
      { type: "h3", text: "2. What's the input quality you actually have?" },
      {
        type: "p",
        text:
          "Most AI projects fail not on the model but on the data feeding it. PDFs that are scans-of-scans, unstructured notes typed years ago by different staff, a CRM with three different spellings for every customer name — all of these will torpedo a model that demoed beautifully on clean test data. Scoping has to start with a sample of the real inputs, not a curated demo set.",
      },
      { type: "h3", text: "3. What does \"correct\" look like, measurably?" },
      {
        type: "p",
        text:
          "If you can't write an eval — a hundred input/expected-output pairs — you can't ship production AI. The eval is the regression suite that catches when GPT-5 silently changes behaviour, or when your prompt edit breaks the case you forgot about. No eval means you're flying blind every time the model is updated.",
      },
      { type: "h3", text: "4. Will it run autonomously, ever?" },
      {
        type: "p",
        text:
          "Autonomous AI (no human gate before it acts) is the highest-stakes shape. We build it sometimes, but only when there's a confidence threshold, a rollback path, and audit logs that let you reconstruct every decision. Most projects shouldn't start autonomous — start with human-in-the-loop, measure the confidence distribution, then graduate the high-confidence cases to autonomous later.",
      },
      { type: "h3", text: "5. Which model, and what's the swap plan?" },
      {
        type: "p",
        text:
          "GPT-4, GPT-4o, Claude Sonnet, Claude Opus, Gemini, open-weight models on your own infra — each has tradeoffs around cost, latency, context window, structured output, and behavior under adversarial input. The right answer almost never is \"the latest model.\" It's \"the model that meets the accuracy threshold at the lowest cost-per-call.\" Plan to swap; never hard-code a single provider.",
      },
      { type: "h3", text: "6. Where does the context come from?" },
      {
        type: "p",
        text:
          "Naive prompting (\"here's the user's question, answer it\") only works for trivial tasks. Production AI needs context: the user's recent activity, the relevant documents, the company policy, the prior conversation. That context comes from either a long system prompt (cheap, brittle), retrieval-augmented generation against a vector DB (richer, more moving parts), or tool calls into your live data (most powerful, most complex). Scope determines which.",
      },
      { type: "h3", text: "7. What's the latency budget?" },
      {
        type: "p",
        text:
          "An AI answer that takes eight seconds is fine in an email draft, dead in a chat UI. If the surface is real-time, you're picking faster models (Haiku, GPT-4o-mini) and streaming tokens. If it's batch, you can use the most capable model and accept ten-second waits. Scoping needs to ask which.",
      },
      { type: "h3", text: "8. What's the audit and rollback story?" },
      {
        type: "p",
        text:
          "When the AI does something a customer complains about, can you reconstruct exactly what input it saw, what tools it used, what response it generated, and which model version produced it? If not, the build isn't production-ready. We instrument every AI call into Sentry + a dedicated audit table from day one — it's not bolt-on later.",
      },
      { type: "h3", text: "9. Cost ceiling per user per month?" },
      {
        type: "p",
        text:
          "A copilot that costs 30 cents per active user per month is sustainable. One that costs 30 dollars only works if you're charging hundreds. We model the unit cost during scoping — token count per call × call frequency × model price × buffer for retries — and price the engagement against that ceiling.",
      },
      { type: "h3", text: "10. Who owns the prompts and the data?" },
      {
        type: "p",
        text:
          "We don't keep client prompts, evals, or training data. Everything we build for you is your IP, in your repo, exportable to a different vendor on day one if you decide to swap us out. If a vendor wants to gate your prompts behind their UI or hold your fine-tuned weights, that's a vendor-lock trap.",
      },
      { type: "h3", text: "11. What does \"done\" look like?" },
      {
        type: "p",
        text:
          "AI projects can balloon if the success criteria are fuzzy. Define done as: a specific eval set passes at a specific threshold, the cost-per-call is below a specific number, the latency p95 is below a specific number, and a real user has completed a real task through the new flow without help. Three measurable lines, agreed in writing before the build starts.",
      },
      { type: "h2", text: "What we won't quote against" },
      {
        type: "p",
        text:
          "We won't quote an AI build where the buyer expects 100% accuracy on an unbounded input space. We won't quote one that has no human gate and no audit trail. We won't quote one where the dataset is sensitive but there's no privacy review in scope. Honest scoping kills these projects on day one — it's cheaper than killing them in week six.",
      },
      {
        type: "callout",
        text:
          "If you're scoping AI work — agent, copilot, RAG, internal tool — we work through this checklist with you on the discovery call. It's a 20-minute conversation, no commitment.",
      },
    ],
    keywords: [
      "AI integration",
      "production AI",
      "AI scoping",
      "AI agent development",
      "AI copilot development",
      "RAG",
      "OpenAI integration",
      "Claude integration",
    ],
    tags: ["AI integration", "Scoping"],
    readingMinutes: 8,
  },
  {
    slug: "hiring-a-web-studio-in-the-dmv",
    title: "Hiring a web studio in the DMV: a no-BS guide",
    description:
      "How to evaluate web designers, developers, and AI consultants in the DC / Maryland / Virginia area. What to ask, what to ignore, what the actual price ranges look like.",
    headline: "Hiring a web studio in the DMV: what's actually worth asking",
    publishedAt: "2026-02-08",
    updatedAt: "2026-05-28",
    lead:
      "The DMV has roughly five times more web design agencies per capita than the national average. Most of them do mediocre work at high prices because federal money is in the air. Here's how to evaluate, what to ask, and what the realistic price ranges look like for Stafford, Fredericksburg, Richmond, Arlington, Bethesda — anywhere from Quantico up to Annapolis.",
    body: [
      { type: "h2", text: "The DMV market, briefly" },
      {
        type: "p",
        text:
          "There are roughly three tiers of web studio in the DMV. The big-three Beltway agencies that primarily serve federal contracts, charge $250k+, and treat sub-$100k projects as charity. The mid-tier shops with 8-30 employees that try to look big-agency at half the price. And the independents — solo founders or 2-3 person studios — who deliver senior work direct, usually for $5k-$50k depending on scope. Each tier exists because their respective clients exist; the question is which tier matches your actual needs.",
      },
      { type: "h2", text: "Five questions worth asking on the discovery call" },
      { type: "h3", text: "1. \"Who's actually going to write the code?\"" },
      {
        type: "p",
        text:
          "Agencies often pitch with their senior team and deliver with juniors. Independent studios pitch and deliver with the same person. Both can work, but the conversion ratio for senior-to-junior delivery matters: if 90% of your project is junior-built, you're paying senior rates for junior output. Ask directly.",
      },
      { type: "h3", text: "2. \"Do I own the code, the design files, and the AI prompts?\"" },
      {
        type: "p",
        text:
          "If the answer is anything other than \"yes, everything, in your repo,\" that's a vendor-lock arrangement. Some studios keep design files in their Figma, code in their GitHub org, AI prompts in their proprietary system — and your project is held hostage if you ever leave. Independent studios that take craft seriously give you everything. Verify by asking to see the contract clause.",
      },
      { type: "h3", text: "3. \"What's your handoff if I want to leave?\"" },
      {
        type: "p",
        text:
          "Related to #2 but harder to fake: a good studio can describe the handoff packet in detail because they've done it. A bad studio gets vague (\"oh we'd work that out\"). Ask. \"On day one of a switch, I'd get: this list of repos with admin access, this list of vendor accounts with my email on them, this Figma file, this Stripe / Supabase / Vercel ownership transferred.\" If the studio can't say that, run.",
      },
      { type: "h3", text: "4. \"Show me one project that went wrong.\"" },
      {
        type: "p",
        text:
          "Every studio with real client history has had at least one project go sideways. The ones that admit it and explain what they learned are the ones you want. The ones that say \"all our projects have been smooth\" are either lying or new.",
      },
      { type: "h3", text: "5. \"What do you NOT do?\"" },
      {
        type: "p",
        text:
          "A studio that does \"everything\" probably does nothing well. The ones worth hiring can articulate their non-services clearly: \"we don't do paid ads management,\" \"we don't ship native mobile apps,\" \"we don't take projects with a fixed deadline shorter than X weeks.\" Sharp positioning is a quality signal.",
      },
      { type: "h2", text: "What to ignore" },
      {
        type: "list",
        items: [
          "Awards from publications you've never heard of (most are pay-to-play).",
          "Client logos used without context — was it a $5k landing page or a multi-year platform engagement?",
          "The agency's own website, beyond \"does it load fast and not break.\" Some of the best studios have ugly sites; some terrible ones have beautiful sites.",
          "Stock case-study format with no specifics. If the case study doesn't name the metrics that moved, the team didn't measure them.",
          "\"Award-winning\" badges in the footer — verify what they're for.",
        ],
      },
      { type: "h2", text: "DMV-specific price ranges (2026)" },
      {
        type: "p",
        text:
          "Rough order-of-magnitude for the DMV market, based on what we see when we lose deals on price (we know what the competition quoted) and what we hear from clients who switched to us:",
      },
      {
        type: "list",
        items: [
          "Simple marketing website (5-10 pages, no custom backend): $5k-$15k from an independent, $25k-$60k from a mid-tier agency, $80k+ from a Beltway shop.",
          "Custom web app with auth + database + simple admin: $20k-$60k independent, $80k-$250k agency.",
          "AI integration into an existing product (copilot, agent, RAG): $15k-$60k for a properly scoped build with guardrails; we've heard of $300k quotes from agencies for the same scope.",
          "E-commerce build on Shopify with custom UX and integrations: $10k-$30k independent, $50k+ agency.",
          "Workflow automation / internal tool: $8k-$40k independent, $60k+ agency.",
          "Care plans / monthly maintenance: $200-$1500/month independent, $2k-$10k/month agency.",
        ],
      },
      { type: "h2", text: "Local vs remote" },
      {
        type: "p",
        text:
          "In-person matters for a single discovery call and maybe a milestone review. Everything else happens async — code lives in GitHub, design lives in Figma, communication lives in a portal or a chat. If a studio insists on weekly in-person meetings, they're either old-school agency or padding billable hours. The DMV's commute is bad enough that most local clients prefer async-first delivery once kickoff is done.",
      },
      {
        type: "callout",
        text:
          "We're based in Stafford, VA and work across the DMV — Fredericksburg, Richmond, Arlington, Alexandria, Bethesda, Silver Spring, DC, Annapolis. Always happy to do the discovery call in person if you're nearby. Book a free 20 minutes — we'll walk the scope and tell you honestly whether we're the right fit.",
      },
    ],
    keywords: [
      "web studio DMV",
      "web design DC",
      "web design Northern Virginia",
      "web designer Stafford VA",
      "web developer Bethesda",
      "AI consultant DMV",
    ],
    tags: ["DMV", "Hiring"],
    readingMinutes: 10,
  },
  {
    slug: "rag-vs-fine-tuning-for-small-businesses",
    title: "RAG vs fine-tuning: which one your small business actually needs",
    description:
      "Most small businesses are sold fine-tuning when they need RAG. A practical breakdown of when to use each, what they cost, and what the production tradeoffs look like.",
    headline: "RAG vs fine-tuning for small businesses: the honest comparison",
    publishedAt: "2026-03-22",
    updatedAt: "2026-05-28",
    lead:
      "Fine-tuning sounds technical and impressive, so consultants pitch it. Retrieval-augmented generation (RAG) sounds boring, so it doesn't get the slide deck. But for 90% of small-business AI projects, RAG is the right answer and fine-tuning is overkill. Here's how to tell which one you actually need.",
    body: [
      { type: "h2", text: "The one-paragraph version" },
      {
        type: "p",
        text:
          "RAG = the AI looks things up in your documents at query time. Fine-tuning = the AI is trained on your data so it embeds the knowledge. RAG is cheaper, faster to iterate, easier to debug, and lets you change the source data without retraining. Fine-tuning is worth it when you need the AI to mimic a specific style, follow a specific format, or behave consistently in ways prompt engineering can't reliably enforce. Most small businesses need the first; consultants pitch the second.",
      },
      { type: "h2", text: "When RAG is the right answer" },
      {
        type: "list",
        items: [
          "You want the AI to answer questions over your knowledge base, SOPs, product catalog, or customer history.",
          "Your source content changes regularly (weekly product updates, evolving policies, fresh CRM data).",
          "You need to cite the source of every answer — RAG can point at the document, fine-tuning can't.",
          "You want to add or remove documents without a retraining cycle.",
          "Your team is small and you'd rather iterate on prompts and chunking than on training pipelines.",
        ],
      },
      { type: "h2", text: "When fine-tuning is worth the cost" },
      {
        type: "list",
        items: [
          "You need the AI to consistently produce output in a very specific format that prompts can't reliably enforce (rare in practice — most format problems are solvable with structured outputs or function calling).",
          "You're hitting context-window limits even with smart retrieval, and the base model genuinely needs to embed the knowledge.",
          "You're working in a domain with a specific vocabulary that the base model struggles with (medical, legal, technical specs).",
          "Your usage volume is high enough that the cost of always-on retrieval starts to exceed the cost of training.",
        ],
      },
      { type: "h2", text: "What RAG actually costs to build right" },
      {
        type: "p",
        text:
          "A production-ready RAG pipeline isn't \"embed your documents and call it done.\" The real components: ingestion that handles your actual document formats (PDF scans, Word with embedded tables, Notion exports), chunking that respects semantic boundaries (not just \"every 1000 characters\"), embedding generation, vector DB storage (we typically use Supabase pgvector for cost and operational simplicity), retrieval that combines vector similarity with metadata filters, reranking to push the most relevant chunks into context, and prompt engineering that handles the edge cases gracefully.",
      },
      {
        type: "p",
        text:
          "All-in, expect $10k-$35k for a properly built small-business RAG system, plus $50-$300 a month for the vector DB and embedding API depending on your document volume.",
      },
      { type: "h2", text: "What fine-tuning actually costs" },
      {
        type: "p",
        text:
          "Fine-tuning is where the surprise bills live. The OpenAI fine-tuning API charges per training token, and to get a meaningful result you typically need 500-5000 high-quality input/output pairs — that's a labelled dataset someone has to create. Then there's ongoing inference cost: fine-tuned models cost more per call than the base model. Then the gotcha: when OpenAI deprecates the base model (which they do regularly), you re-tune. A serious fine-tuning project is $25k-$80k of build + a multiple of base inference cost forever after + a re-tuning cycle every model deprecation.",
      },
      { type: "h2", text: "The hybrid that actually wins" },
      {
        type: "p",
        text:
          "Almost every \"we need fine-tuning\" conversation lands on RAG + structured outputs + a careful system prompt as the actually-correct answer. You get the consistency people want from fine-tuning, the freshness and citability of RAG, and the ability to swap models when better ones ship. We've done this pattern for both of our own AI products and for client work — the only fine-tuning cases we've actually shipped are domain-specific classifiers where the model needs to behave consistently in ways prompting couldn't lock down.",
      },
      { type: "h2", text: "Red flags in fine-tuning pitches" },
      {
        type: "list",
        items: [
          "The vendor talks about fine-tuning without first asking what your source data looks like.",
          "There's no discussion of how the fine-tuned model gets re-tuned when the base model is deprecated.",
          "The vendor can't articulate when RAG would have been the correct choice.",
          "The pitch leans heavily on \"the AI learns your business\" — fine-tuning doesn't really do that; it adjusts response style, not knowledge depth.",
          "There's no discussion of evals to detect when the fine-tuned model regresses.",
        ],
      },
      {
        type: "callout",
        text:
          "If you're scoping an AI build and someone is pushing fine-tuning, get a second opinion. Free 20-minute discovery call — we'll tell you honestly which approach fits your actual use case.",
      },
    ],
    keywords: [
      "RAG vs fine-tuning",
      "RAG implementation",
      "AI fine-tuning",
      "OpenAI fine-tuning",
      "small business AI",
      "Supabase pgvector",
    ],
    tags: ["AI integration", "RAG"],
    readingMinutes: 9,
  },
];

export function postBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function allPostSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}
