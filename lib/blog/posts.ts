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
    publishedAt: "2026-05-14",
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
    publishedAt: "2026-05-21",
    lead:
      "The DMV has more web design studios per capita than most US metros — federal contracts in the air, lots of professional buyers. Here's how to evaluate one without getting lost in the noise: what to ask on the discovery call, what to ignore, and what the rough investment levels look like for projects in Stafford, Fredericksburg, Richmond, Arlington, Bethesda — anywhere from Quantico up to Annapolis.",
    body: [
      { type: "h2", text: "The DMV market, briefly" },
      {
        type: "p",
        text:
          "Roughly three tiers of web studio operate in the DMV. The large Beltway agencies built around federal contracts, scoped for enterprise work and priced for those budgets. Mid-tier shops with 8-30 employees serving regional businesses. And independents — solo founders or 2-3 person studios — delivering senior work directly. Each tier exists because their respective clients exist; the question is which tier matches the project you actually need.",
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
      { type: "h2", text: "Where investment levels land" },
      {
        type: "p",
        text:
          "Pricing varies a lot by scope, complexity, and the specific studio. As rough orientation rather than quotes:",
      },
      {
        type: "list",
        items: [
          "Marketing websites typically span low five figures (independent practitioners) to mid five figures and up (mid-tier and enterprise agencies), depending on page count, content strategy, and integrations.",
          "Custom web apps with auth, database, and admin UI usually start in the mid five figures and scale into six figures as scope grows.",
          "AI integration projects depend heavily on the autonomy model (drafts-only vs. confirm-to-act vs. fully autonomous), the data pipeline, and the guardrails — scoping it correctly matters more than the headline number.",
          "E-commerce builds on Shopify or similar platforms typically land in the low-to-mid five figures for a properly scoped storefront.",
          "Workflow automation and internal tools start in the low five figures and grow with the number of integrations and edge cases.",
          "Care plans / monthly maintenance arrangements vary widely — from a few hundred a month for a small site to mid-to-high four figures for a complex platform.",
        ],
      },
      {
        type: "p",
        text:
          "The actual quote should come from a real scoping conversation, not a public price grid. Anyone willing to quote without one is either guessing or selling a templated product.",
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
    publishedAt: "2026-05-28",
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
  {
    slug: "ai-agents-vs-ai-copilots",
    title: "AI agents vs AI copilots: when to build each one",
    description:
      "An AI agent acts on its own. An AI copilot suggests and waits for confirm. Most projects are wrongly scoped as agents when copilots would ship better — how to tell which fits.",
    headline: "AI agents vs AI copilots: when each one actually makes sense",
    publishedAt: "2026-05-25",
    lead:
      "There's a clean line between an AI agent and an AI copilot — but vendors blur it constantly because \"agent\" sounds more impressive in a pitch deck. The distinction matters a lot for what you actually build, how you guardrail it, and how often it costs you money or trust when it goes wrong. Here's how to tell which one your project needs.",
    body: [
      { type: "h2", text: "The one-line difference" },
      {
        type: "p",
        text:
          "A copilot suggests; you confirm. An agent acts; you review (maybe). That's it. Everything else — the model choice, the tools it has access to, the prompts — is downstream of that single question.",
      },
      {
        type: "p",
        text:
          "We've shipped both for clients. The shape of the engagement is wildly different. A copilot can ship in weeks because the surface is just \"draft + display + accept/reject button.\" An agent takes months because every action it takes needs guardrails, audit, rollback, and confidence gates. Wrong choice early means either an overbuilt copilot (you paid for autonomy you don't use) or a fragile agent (it acts without enough oversight and breaks production).",
      },
      { type: "h2", text: "The four levels of autonomy, plainly" },
      {
        type: "list",
        items: [
          "Level 1 — Read-only: the AI summarizes, classifies, drafts. A human reads the output and decides what to do. Lowest risk. Most projects belong here.",
          "Level 2 — One-click confirm: the AI prepares an action (send email, update CRM, generate invoice). A human clicks Approve. The AI never acts unilaterally.",
          "Level 3 — Confidence-gated autonomy: above a confidence threshold, the AI acts. Below it, the action goes to a human queue. Production AI built right.",
          "Level 4 — Fully autonomous: the AI acts without a gate. Used only when the cost-of-wrong is genuinely low and the action is reversible.",
        ],
      },
      { type: "h2", text: "When agents are the right call" },
      {
        type: "p",
        text:
          "Agents (Levels 3-4) make sense when the action is high-volume, low-cost-of-wrong, and reversible. Sorting incoming support tickets into queues. Tagging photos by content type. Triaging emails by urgency. The worst case for any individual action is \"a human re-sorts one item\" — not \"the customer churned\" or \"we owe a refund.\"",
      },
      {
        type: "p",
        text:
          "Two of our own products run agents. Fleiko has an AI copilot that flags vehicle issues (Level 2 — suggests, fleet manager confirms). Proveo has a confidence-gated agent that processes contractor photo submissions (Level 3 — high-confidence auto-approves, low-confidence routes to human review). Techdesk auto-resolves IT tickets via a six-gate engine (Level 3 with strict gating). All three are agents because the volume justifies the engineering investment and the actions are individually low-stakes.",
      },
      { type: "h2", text: "When copilots are the right call" },
      {
        type: "p",
        text:
          "Copilots (Levels 1-2) win for anything customer-facing, anything with money / identity / legal consequence, and anything where one wrong action erodes trust. A copilot that drafts a customer reply is great; an agent that auto-sends customer replies will, eventually, send something that costs you a relationship.",
      },
      {
        type: "p",
        text:
          "If the action is rare or high-stakes, the engineering investment for confidence gating + audit + rollback doesn't pay off — a human review step is cheaper. Copilot wins on cost-per-feature and on trust.",
      },
      { type: "h2", text: "The cost dimension nobody mentions" },
      {
        type: "p",
        text:
          "Agents that fail in production are expensive to debug. Every misfire pulls engineering time, customer support time, and sometimes refund processing. The team has to maintain prompt evals, drift detection, alerting. The total cost-of-ownership is meaningfully higher than running a copilot.",
      },
      {
        type: "p",
        text:
          "Copilots that fail just get ignored. A user clicks Reject on a bad suggestion. The output never reached anyone but the user who asked for it. The cost of a failed copilot suggestion is approximately zero.",
      },
      { type: "h2", text: "The scoping question we ask" },
      {
        type: "p",
        text:
          "Write out the three highest-stakes outputs your AI could plausibly produce. Imagine each one happening in production with no human gate. If any of those three would be a real problem — refund-triggering, customer-relationship-damaging, brand-damaging — you need a copilot, or at minimum a confidence gate. Agent territory only when all three are \"would be a minor inconvenience at worst.\"",
      },
      {
        type: "p",
        text:
          "Most clients who tell us they want \"an AI agent\" walk through this and realize they want a copilot. That's fine — copilots ship faster and cost less, and they upgrade to an agent later once the data tells them the agent is safe.",
      },
      {
        type: "callout",
        text:
          "Scoping an AI build and not sure whether you need an agent or a copilot? Free 20-minute discovery call — we'll walk through your specific use case and tell you honestly which one fits.",
      },
    ],
    keywords: [
      "AI agents vs AI copilots",
      "AI agent development",
      "AI copilot development",
      "production AI",
      "autonomous AI",
      "AI scoping",
    ],
    tags: ["AI integration", "AI agents"],
    readingMinutes: 7,
  },
  {
    slug: "local-seo-dmv-2026-playbook",
    title: "Local SEO for DMV small businesses: 2026 playbook",
    description:
      "A practical 2026 walkthrough for ranking on Google in the DMV — Google Business Profile setup, NAP consistency, on-site schema, reviews, and the local-citation strategy that actually moves rankings.",
    headline: "Local SEO for DMV small businesses: the 2026 playbook",
    publishedAt: "2026-05-27",
    lead:
      "Local SEO has gotten less mysterious in 2026. The mechanics that move you in the local pack are well-documented; the work is doing them, consistently, with a real business behind them. Here's the playbook we run for DMV small businesses — and the same checklist we use on our own site.",
    body: [
      { type: "h2", text: "Why local SEO is the highest-ROI channel for DMV small businesses" },
      {
        type: "p",
        text:
          "Roughly half of all Google searches have local intent — and that share is higher for the kinds of services DMV small businesses sell. Someone searching \"web designer Stafford VA\" or \"accountant in Bethesda\" is closer to buying than someone searching \"how websites work.\" The local pack (the map + three businesses at the top of a local query) is the most valuable real estate Google gives you, and the rules for getting in are deterministic — not an algorithm guessing game.",
      },
      { type: "h2", text: "The three pillars of local pack ranking" },
      {
        type: "p",
        text:
          "Google's local algorithm is publicly described as a function of three factors: proximity, relevance, prominence. Most of the work is on the second two — proximity you mostly can't change without moving.",
      },
      { type: "h3", text: "Proximity" },
      {
        type: "p",
        text:
          "How close your registered business address is to the searcher. For a Stafford-based studio, Stafford searchers see us higher than Richmond searchers do. You can't fake this; trying to (P.O. boxes in other cities) gets flagged. The work is being honest about where you are and tuning the other two pillars.",
      },
      { type: "h3", text: "Relevance" },
      {
        type: "p",
        text:
          "How well your Google Business Profile category, services, and on-site content match the user's query. \"Web designer\" needs to appear on your GBP, your site title, your homepage h1, your service page metadata. Specificity wins: \"AI integration\" is better than \"technology consulting.\"",
      },
      { type: "h3", text: "Prominence" },
      {
        type: "p",
        text:
          "How well-known you are across the web — measured by reviews, citations on local directories, backlinks from local press, and the consistency of your name/address/phone (NAP) across all of those. Prominence is the slowest pillar to build and the most under-invested in.",
      },
      { type: "h2", text: "Pillar 1 — Google Business Profile, set up correctly" },
      {
        type: "list",
        items: [
          "Name: legal business name, no keyword stuffing (\"CrecyStudio — Best Web Designer in Stafford\" gets you suspended).",
          "Primary category: the most specific one Google offers. \"Website designer\" beats \"Marketing agency\" for a web studio.",
          "Address: real, verifiable. Service-area businesses can hide the street address but the locality has to be real.",
          "Phone: same number you use everywhere else. NAP consistency starts here.",
          "Hours: accurate. Google penalizes drift between listed and actual hours.",
          "Services: enumerate them, with descriptions. Each service slot is a relevance signal.",
          "Photos: at least 10. Studio shots, founder photo, work-in-progress. Google reads the EXIF metadata and uses image content as a relevance signal.",
          "Posts: weekly is ideal, monthly is acceptable. Treat it as a freshness signal.",
        ],
      },
      { type: "h2", text: "Pillar 2 — NAP consistency across the web" },
      {
        type: "p",
        text:
          "Your business name, address, and phone number must be IDENTICAL — to the punctuation — everywhere it appears on the web. Google cross-references these to build confidence that you're a real business. A mismatch (\"CrecyStudio\" vs. \"Crecy Studio\" vs. \"Crecy Studio LLC\") splits the signal and dilutes prominence.",
      },
      {
        type: "p",
        text:
          "The platforms that matter, in roughly descending order of weight:",
      },
      {
        type: "list",
        items: [
          "Google Business Profile (the canonical source)",
          "Bing Places (Bing has ~7% search share — easy win)",
          "Apple Maps Connect (Siri, Apple Maps results)",
          "Facebook Business",
          "LinkedIn Company Page",
          "Yelp (matters more than you'd expect for certain categories)",
          "Better Business Bureau (especially for B2B)",
          "Industry directories (web design directories like Clutch, Sortlist, GoodFirms)",
          "Local chambers of commerce + Chamber listing sites",
        ],
      },
      {
        type: "p",
        text:
          "Once aligned, do not change anything on any of them without changing all of them at once. Add a calendar reminder if your business is likely to rebrand or relocate.",
      },
      { type: "h2", text: "Pillar 3 — On-site signals" },
      {
        type: "list",
        items: [
          "LocalBusiness schema with PostalAddress + geo coordinates + serviceArea — Google reads this directly as a structured-data input.",
          "Visible address in the footer, exactly matching the schema (Google cross-references visible content against structured data).",
          "City + service page pattern: a dedicated page per city you serve (/locations/stafford-va, etc.) plus per-service pages with `serviceType` schema. Each page targets a (city × service) combination.",
          "Local content in titles and h1s: \"Web design in Fredericksburg, VA\" beats generic \"Web design services.\"",
          "Consistent internal linking: every service page should link to the locations index, and city pages should link to every service.",
        ],
      },
      { type: "h2", text: "Pillar 4 — Reviews" },
      {
        type: "p",
        text:
          "Reviews are the single highest-CTR organic signal you can earn without buying ads. A business with star ratings in the local pack gets significantly more click-through than one without. The path:",
      },
      {
        type: "list",
        items: [
          "Ask every completed-project client for a Google review. Email, not text — text feels pushier.",
          "Make it stupid easy: include the direct review-write URL in the ask.",
          "Don't filter (\"only ask the happy ones\"). Google detects review-gating and downweights it.",
          "Schema.org aggregateRating + Review on your site backs up the GBP reviews — Google reads both.",
          "Fake reviews are a domain-penalty risk. Don't.",
        ],
      },
      { type: "h2", text: "Pillar 5 — Local citations and backlinks" },
      {
        type: "p",
        text:
          "Beyond the structured directories from Pillar 2, you want unstructured citations and backlinks from local press and topical authority sites. A mention in a Fredericksburg Patch article. A backlink from a local chamber site. A guest post on a regional industry blog. Each one adds a small amount of prominence; the cumulative effect is what moves you in the local pack over months, not days.",
      },
      { type: "h2", text: "The DMV-specific angle" },
      {
        type: "p",
        text:
          "Federal-adjacent buyers in the DMV search differently than the national average. They weight verifiable credentials more heavily (a LinkedIn profile, a real address, actual photos of a real person), and they often Google a vendor's name to do a basic background check before reaching out. That means your prominence work isn't just about ranking — it's about looking real to a buyer who's already considering you.",
      },
      {
        type: "callout",
        text:
          "We run this playbook for our own site (the one you're reading) and for client engagements. If you want a local-SEO audit + the same setup for your business, the discovery call covers it — 20 minutes, no commitment.",
      },
    ],
    keywords: [
      "local SEO DMV",
      "local SEO Stafford VA",
      "Google Business Profile",
      "NAP consistency",
      "local pack ranking",
      "DMV small business SEO",
    ],
    tags: ["Local SEO", "DMV"],
    readingMinutes: 10,
  },
  {
    slug: "web-design-vs-custom-web-app",
    title: "Web design vs custom web app: knowing which you actually need",
    description:
      "Most projects start as \"a website\" but end up needing custom backend logic. Five questions that tell you which budget bracket you're in before you start shopping for a vendor.",
    headline: "Web design vs custom web app: which one you actually need",
    publishedAt: "2026-05-28",
    lead:
      "We get the same call almost every week: \"I need a new website.\" About 40% of the time, that's right — a marketing website is the right scope. The other 60% of the time, what the buyer actually needs is a custom web app, and they don't know it yet — until they're eight weeks into a \"website\" build and realize the contractor can't build the customer login flow they wanted. These five questions catch the mismatch early.",
    body: [
      { type: "h2", text: "The five questions" },
      { type: "h3", text: "1. Does the site let a visitor do anything beyond fill in a contact form?" },
      {
        type: "p",
        text:
          "If visitors can book a calendar slot, place an order, submit a complex multi-step intake, see their own data, leave a review tied to an account — you're past marketing-website territory. A contact form is fine; anything involving the visitor's data or state is not.",
      },
      { type: "h3", text: "2. Is there ongoing data that changes after launch?" },
      {
        type: "p",
        text:
          "Marketing websites have content that changes via a CMS — pages, blog posts, occasional copy edits. Custom web apps have data that changes continuously — bookings being created, customer orders, inventory levels, support tickets. If launch is the start of the data lifecycle (not the end of the build), you need an app, not a website.",
      },
      { type: "h3", text: "3. Do you need user accounts and login?" },
      {
        type: "p",
        text:
          "Auth is the line. A website with login is a web app — period. Even a \"simple\" login flow drags in password resets, session management, account recovery, role permissions, GDPR / CCPA data handling. If you need users to log in for any reason, scope for app-level work, not marketing-site work.",
      },
      { type: "h3", text: "4. Will admins manage content via the site or via a separate tool?" },
      {
        type: "p",
        text:
          "Marketing websites use a CMS (Webflow, WordPress, Sanity) where admins edit content. Custom web apps have admin panels where staff manage live data — approve orders, mark tickets resolved, adjust user permissions. If you're describing the admin experience and it sounds more like \"my team uses this to run the business\" than \"my team edits copy here,\" you're in app territory.",
      },
      { type: "h3", text: "5. Are there workflow steps the system should handle automatically?" },
      {
        type: "p",
        text:
          "Marketing websites are stateless: a visitor lands, reads, leaves. Custom apps have flow: a customer signs up, triggers a welcome email, gets matched to a sales rep, schedules a call, the system reminds them at 24 hours, follows up post-call. If you're sketching multi-step workflows where the system carries state across steps, that's a web app.",
      },
      { type: "h2", text: "The decision matrix" },
      {
        type: "list",
        items: [
          "0-1 yes answers → marketing website. Scope a marketing-web vendor.",
          "2-3 yes answers → web app territory. Scope a custom-web-app vendor; don't hire a pure marketing studio for this.",
          "4-5 yes answers → definitely a web app. Marketing studios will either decline or bolt on a half-built app and bill you for the broken result.",
        ],
      },
      { type: "h2", text: "Why this matters for cost" },
      {
        type: "p",
        text:
          "Marketing websites and custom web apps don't just cost different amounts — they cost different orders of magnitude. A well-built marketing website lands in the low five figures. A custom web app starts in the mid five figures and scales into six figures as the data model and workflows grow. If you're buying a $12k \"website\" but you actually need a $60k app, you'll either:",
      },
      {
        type: "list",
        items: [
          "Get a $12k website that doesn't do what you need, and pay another vendor $60k to rebuild it from scratch six months later.",
          "Pay scope-creep change orders as the gap becomes obvious, ending at $40-50k for a half-finished app.",
          "Discover the mismatch on the discovery call and re-scope before signing — the cheap and easy path.",
        ],
      },
      { type: "h2", text: "Why this matters for vendor selection" },
      {
        type: "p",
        text:
          "Marketing-web studios are good at what they do: visual design, content strategy, conversion optimization, CMS implementation. They generally don't have the engineering depth for a custom web app, auth flows, complex data models, or production AI work. They'll either decline the project or accept it and outsource the hard parts to a freelance dev who isn't accountable to you.",
      },
      {
        type: "p",
        text:
          "Custom-web-app studios (us, for example) handle the engineering depth but often over-engineer marketing sites. Hiring an app studio to build a brochure site is paying for capabilities you don't need. Match the vendor to the work.",
      },
      { type: "h2", text: "Common confusion patterns" },
      {
        type: "list",
        items: [
          "\"It's just a Shopify thing\" → e-commerce platforms like Shopify or BigCommerce cover most stores out of the box. You're in marketing-web territory + some Shopify customization, not custom web app.",
          "\"Just login functionality\" → there's no \"just login.\" Login is the gateway to web app territory. Even minimal auth changes the security, hosting, and engineering profile of the project.",
          "\"Just a booking calendar\" → if the booking creates a real reservation tied to a real customer, you have auth, you have state, you have notifications. App territory.",
          "\"It's like Airbnb but smaller\" → smaller doesn't mean simpler. Marketplace apps are some of the hardest builds — two-sided auth, payments, dispute resolution, reviews, trust signals.",
        ],
      },
      { type: "h2", text: "When you're not sure" },
      {
        type: "p",
        text:
          "Scope the discovery first; don't commit to a vendor before you know which side of the line you're on. A 20-minute discovery call with someone who builds both can save you the $30k mistake of hiring the wrong type of studio. We do this for free, partly because honest scoping is good business and partly because the wrong-fit project always ends in tears.",
      },
      {
        type: "callout",
        text:
          "Not sure if you need a marketing site or a custom web app? Free 20-minute discovery call — we'll walk through your project and tell you which scope fits (even if the answer is \"hire a different studio for this one\").",
      },
    ],
    keywords: [
      "web design vs web app",
      "custom web application",
      "when to build a web app",
      "web design Stafford VA",
      "custom software vs website",
    ],
    tags: ["Web design", "Custom web apps"],
    readingMinutes: 8,
  },
];

export function postBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function allPostSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}
