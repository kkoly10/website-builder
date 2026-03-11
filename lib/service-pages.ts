export const commonCrossLinks = [
  { label: "Explore Website Building", href: "/websites" },
  { label: "Explore E-Commerce Systems", href: "/ecommerce" },
  { label: "Explore Workflow Automation", href: "/systems" },
];

export const websitesPageData = {
  eyebrow: "Website building",
  title: "A premium website that makes your business look established and converts better.",
  intro:
    "This is for service businesses, consultants, and local brands that need more than a pretty homepage. We build clear, conversion-focused websites with strong messaging, clean structure, and a launch process that feels organized instead of chaotic.",
  heroImage: "/images/services/website-hero.webp",
  heroAlt: "Premium website design hero image",
  heroStats: [
    "Clear scope before build",
    "Conversion-focused structure",
    "Launch support included",
  ],
  primaryCta: { label: "Get Website Quote", href: "/build/intro" },
  secondaryCta: { label: "Back to Homepage", href: "/" },
  whoItsForTitle: "Best for businesses that need trust, clarity, and stronger first impressions.",
  whoItsFor: [
    "Your current site looks outdated, generic, or low-trust.",
    "You get some traffic, but your calls and form submissions are weak.",
    "Your business quality is higher than what your current website communicates.",
    "You want a cleaner process, not a vague custom build that keeps changing.",
  ],
  problemsTitle: "We fix the gaps that usually make websites underperform.",
  problems: [
    "Confusing messaging that makes visitors work too hard to understand what you do.",
    "Weak visual hierarchy, bad section flow, or no clear primary action.",
    "Poor mobile experience that hurts trust and lead conversion.",
    "No clear launch path, no scope control, and no confidence in what happens next.",
  ],
  includesTitle: "What the website lane includes",
  includes: [
    {
      title: "Strategy + Structure",
      items: [
        "Offer positioning and section planning",
        "Page structure built around one primary goal per page",
        "Clear messaging hierarchy for trust and conversion",
      ],
    },
    {
      title: "Design + Build",
      items: [
        "Responsive page layouts",
        "Premium visual direction matched to your business",
        "Core lead-capture setup: forms, click-to-call, booking links",
      ],
    },
    {
      title: "Launch + Support",
      items: [
        "QA review before launch",
        "Launch support and handoff",
        "Optional next-step upgrades for additional pages or optimization",
      ],
    },
  ],
  pricingTitle: "Transparent pricing without fake simplicity",
  pricingIntro:
    "Website projects are priced by scope, page count, copy needs, and integrations. The goal is to keep pricing understandable without pretending every business needs the same build.",
  pricingCards: [
    {
      label: "Starting point",
      value: "$550+",
      detail: "Good fit for lean starter sites and focused launch builds.",
    },
    {
      label: "Most common range",
      value: "Scoped after intake",
      detail: "Best when the site needs stronger structure, better messaging, or more than a basic launch.",
    },
    {
      label: "Price moves when",
      value: "Pages + copy + integrations",
      detail: "More pages, heavier copy help, booking/CRM setup, and custom sections increase scope.",
    },
  ],
  processTitle: "Simple from intake to launch",
  processIntro:
    "This should feel like a guided build, not a confusing freelance handoff.",
  process: [
    {
      step: "01",
      title: "Submit intro + quote request",
      detail:
        "You tell us your goal, timeline, and what feels broken right now.",
    },
    {
      step: "02",
      title: "Get scoped direction",
      detail:
        "We review your business, clarify fit, and define the right level of build before design starts.",
    },
    {
      step: "03",
      title: "Build + review",
      detail:
        "We create the pages, tighten layout and messaging, and review the site before launch.",
    },
    {
      step: "04",
      title: "Launch + next steps",
      detail:
        "We verify launch, make final adjustments, and outline what should happen after version one.",
    },
  ],
  bestFitTitle: "Choose this lane if your biggest issue is marketing clarity.",
  bestFit: [
    "You need a more credible online presence.",
    "You want stronger lead generation from the site.",
    "You need a business website first before adding deeper systems.",
  ],
  notFitTitle: "This is not the first lane if your real issue is elsewhere.",
  notFit: [
    "You mainly need product-selling infrastructure and checkout improvement.",
    "Your biggest pain is internal workflow breakdowns, routing, or admin handoffs.",
    "You only want a cheap template refresh with no strategy.",
  ],
  faqTitle: "Website building FAQs",
  faqs: [
    {
      question: "How long does a normal website build take?",
      answer:
        "Most small-business builds land between 2 and 6 weeks depending on page count, content readiness, and revisions. We tighten the timeline after intake and scope review.",
    },
    {
      question: "Do you help with copy or only design?",
      answer:
        "Yes. We can work from your existing copy, rewrite sections, or structure the messaging with you. Full copy support increases scope, but it usually improves the final result.",
    },
    {
      question: "Can you redesign an existing site instead of starting over?",
      answer:
        "Yes. If the foundation is usable, we can improve structure, visuals, and conversion flow without rebuilding everything from zero.",
    },
    {
      question: "What happens after I submit the quote form?",
      answer:
        "You move into a cleaner scope step first. That means the next stage is not blind design work — it is clarification, fit review, and defining what the build really needs.",
    },
  ],
  crossLinks: commonCrossLinks.filter((item) => item.href !== "/websites"),
  finalTitle: "Start with the website lane if trust and first impression are the bottleneck.",
  finalText:
    "This is the right first move when your business needs to look more established, explain itself better, and convert visitors more cleanly.",
  finalPrimaryCta: { label: "Get Website Quote", href: "/build/intro" },
  finalSecondaryCta: { label: "Compare Services", href: "/" },
};

export const ecommercePageData = {
  eyebrow: "E-commerce systems",
  title: "Storefront, checkout, and post-purchase systems built to reduce friction and support growth.",
  intro:
    "This lane is for brands that are selling or preparing to sell online and need more than a basic storefront. We improve the customer-facing journey and the behind-the-scenes workflow so the store runs cleaner after the order, not just before it.",
  heroImage: "/images/services/ecommerce-hero.webp",
  heroAlt: "Premium ecommerce systems hero image",
  heroStats: [
    "Storefront + backend thinking",
    "Roadmap before heavy build",
    "Better flow after checkout",
  ],
  primaryCta: { label: "Start E-Commerce Intake", href: "/ecommerce/intake" },
  secondaryCta: { label: "Back to Homepage", href: "/" },
  whoItsForTitle: "Best for growing sellers that need cleaner online sales infrastructure.",
  whoItsFor: [
    "You sell products online and the current store feels harder to manage than it should.",
    "Your storefront does not clearly support conversion, trust, or mobile flow.",
    "You need better order handling, post-purchase logic, or backend coordination.",
    "You want a store that is built like a system, not just a theme install.",
  ],
  problemsTitle: "We fix the gaps between traffic, checkout, and operations.",
  problems: [
    "Weak product-page clarity, poor collection flow, or messy merchandising.",
    "Cart and checkout friction that lowers conversion confidence.",
    "Disconnected post-purchase workflow: support, fulfillment, refunds, or status handling.",
    "No structured plan for what to improve first versus what can wait.",
  ],
  includesTitle: "What the e-commerce lane includes",
  includes: [
    {
      title: "Storefront Experience",
      items: [
        "Homepage, collection, and product-page improvement",
        "Mobile-first commerce flow review",
        "Trust, clarity, and conversion layout improvements",
      ],
    },
    {
      title: "Commerce Operations",
      items: [
        "Order-flow review and post-purchase bottleneck mapping",
        "Support/fulfillment handoff improvement ideas",
        "Platform and integration planning where needed",
      ],
    },
    {
      title: "Roadmap + Build Direction",
      items: [
        "Priority-based improvement plan",
        "Phased recommendation instead of random changes",
        "Clear direction on what to fix first, next, and later",
      ],
    },
  ],
  pricingTitle: "E-commerce should be scoped in phases, not guessed all at once",
  pricingIntro:
    "This lane usually works best when it starts with a review, roadmap, or focused intake. That keeps the project grounded and avoids oversized quotes built on incomplete information.",
  pricingCards: [
    {
      label: "Best first move",
      value: "Audit / roadmap first",
      detail: "Smart for stores that need prioritization before committing to a larger build.",
    },
    {
      label: "Build phase",
      value: "Scoped after review",
      detail: "Storefront work, backend issues, and integrations vary too much to pretend one flat package fits all.",
    },
    {
      label: "Scope usually depends on",
      value: "Catalog + flow + stack",
      detail: "Platform, product complexity, mobile issues, integrations, and operational pain all affect scope.",
    },
  ],
  processTitle: "How the e-commerce lane should work",
  processIntro:
    "The goal is to remove guesswork and show what actually deserves attention first.",
  process: [
    {
      step: "01",
      title: "Submit intake",
      detail:
        "You tell us your platform, what feels broken, and what kind of growth or cleanup you need.",
    },
    {
      step: "02",
      title: "Review + roadmap",
      detail:
        "We identify the biggest storefront and operational bottlenecks before recommending heavy work.",
    },
    {
      step: "03",
      title: "Build the priority layer",
      detail:
        "We improve the highest-value pages, flows, or systems first instead of trying to fix everything blindly.",
    },
    {
      step: "04",
      title: "Stabilize + expand",
      detail:
        "After the first improvements are live, we define the next phase based on what will help most.",
    },
  ],
  bestFitTitle: "Choose this lane if your main problem is selling and fulfilling online.",
  bestFit: [
    "You need a stronger online selling flow.",
    "Your cart, checkout, or product experience feels underbuilt.",
    "Your store and your internal order process need to work together better.",
  ],
  notFitTitle: "This is not the first lane if your business lacks a basic marketing foundation.",
  notFit: [
    "You do not need product selling right now and mainly need a service-business website.",
    "Your biggest bottleneck is internal admin workflow, not commerce flow.",
    "You want a giant build before identifying what is actually broken.",
  ],
  faqTitle: "E-commerce systems FAQs",
  faqs: [
    {
      question: "Do you only work on Shopify?",
      answer:
        "Shopify is a strong fit for this lane, but the bigger focus is the system itself: storefront clarity, conversion flow, and operational cleanup. If platform change is needed, that should come out of the review step, not be assumed too early.",
    },
    {
      question: "Can you help if my issue is after checkout, not just before?",
      answer:
        "Yes. That is one reason this lane exists. It covers the customer-facing buying experience and the operational friction after the order as well.",
    },
    {
      question: "Why not just jump straight into a big quote?",
      answer:
        "Because e-commerce scope gets distorted fast when nobody has clarified the real bottlenecks. Starting with intake and a roadmap keeps pricing fairer and more accurate.",
    },
    {
      question: "Can this include ongoing optimization?",
      answer:
        "Yes. Once the core structure is cleaner, this lane can expand into ongoing improvements, testing, and system refinement.",
    },
  ],
  crossLinks: commonCrossLinks.filter((item) => item.href !== "/ecommerce"),
  finalTitle: "Start here if your real issue is not just having a store — it is making the store run better.",
  finalText:
    "This is the right lane when storefront experience, checkout flow, and post-purchase operations all need to become more organized and growth-ready.",
  finalPrimaryCta: { label: "Start E-Commerce Intake", href: "/ecommerce/intake" },
  finalSecondaryCta: { label: "Compare Services", href: "/" },
};

export const systemsPageData = {
  eyebrow: "Ops workflow automation",
  title: "Clean up manual handoffs, routing, and admin drag with workflow systems built to hold up.",
  intro:
    "This lane is for businesses that are losing time to manual processes, disconnected tools, messy intake, slow status updates, and admin work that should not be done by hand anymore. The goal is not random automation. The goal is a more reliable operating system for the business.",
  heroImage: "/images/services/ops-hero.webp",
  heroAlt: "Workflow automation hero image",
  heroStats: [
    "Audit first, then build",
    "Reliable system design",
    "Documentation + handoff",
  ],
  primaryCta: { label: "Start Workflow Audit", href: "/ops-intake" },
  secondaryCta: { label: "Back to Homepage", href: "/" },
  whoItsForTitle: "Best for operations-heavy teams buried in repetitive work.",
  whoItsFor: [
    "Leads, tasks, or requests keep slipping because routing is inconsistent.",
    "Your team is copying data between tools every day.",
    "Status updates, approvals, or billing handoffs are too manual.",
    "You want systems that help the business run cleaner, not more software chaos.",
  ],
  problemsTitle: "We focus on operational friction that actually slows the business down.",
  problems: [
    "No clean intake or qualification logic.",
    "Manual routing and assignment steps.",
    "Inconsistent status tracking and poor visibility.",
    "Too much admin work between service delivery, billing, and reporting.",
  ],
  includesTitle: "What the ops workflow lane includes",
  includes: [
    {
      title: "Audit + Mapping",
      items: [
        "Workflow review and bottleneck identification",
        "Current-state process mapping",
        "Priority ranking by value, urgency, and complexity",
      ],
    },
    {
      title: "Automation Build",
      items: [
        "Routing, notifications, status logic, and handoff flows",
        "Tool connection planning and implementation",
        "Focused systems that reduce repetitive admin work",
      ],
    },
    {
      title: "Support + Handoff",
      items: [
        "Documentation so the workflow is understandable",
        "Clean handoff instead of mystery automations",
        "Expansion plan for future workflows",
      ],
    },
  ],
  pricingTitle: "Ops work should start with the right first workflow, not a giant vague automation promise",
  pricingIntro:
    "This lane works best when it starts with an audit or a focused first sprint. That keeps the work realistic, protects scope, and avoids overselling what should be phased.",
  pricingCards: [
    {
      label: "Smart first offer",
      value: "Workflow audit",
      detail: "Best for identifying what is actually worth automating first.",
    },
    {
      label: "Common next step",
      value: "Focused build sprint",
      detail: "Usually one to three high-value workflows, not a messy all-at-once rollout.",
    },
    {
      label: "Scope changes when",
      value: "Tools + volume + logic",
      detail: "The number of systems, approval complexity, exception handling, and reporting needs all affect price.",
    },
  ],
  processTitle: "How the workflow lane should feel",
  processIntro:
    "This should feel structured and protective, not like throwing brittle automations into the business.",
  process: [
    {
      step: "01",
      title: "Submit workflow intake",
      detail:
        "You describe the bottleneck, current tools, and where the process keeps breaking.",
    },
    {
      step: "02",
      title: "Audit + map",
      detail:
        "We identify the current flow, weak points, and the best first workflow to fix.",
    },
    {
      step: "03",
      title: "Build the first system",
      detail:
        "We implement the first meaningful automation layer with clear logic and handoff in mind.",
    },
    {
      step: "04",
      title: "Document + expand",
      detail:
        "Once the first workflow is stable, we document it and plan the next highest-value automation.",
    },
  ],
  bestFitTitle: "Choose this lane if internal process is the real bottleneck.",
  bestFit: [
    "You are losing time to repetitive admin work.",
    "Your systems do not talk to each other cleanly.",
    "You need routing, updates, tracking, and process visibility.",
  ],
  notFitTitle: "This is not the first lane if your customer-facing offer is still unclear.",
  notFit: [
    "You mainly need a stronger public website or brand presentation first.",
    "You need a product-selling system more than an internal workflow system.",
    "You want automation without first deciding what process deserves automation.",
  ],
  faqTitle: "Workflow automation FAQs",
  faqs: [
    {
      question: "Do you automate everything at once?",
      answer:
        "No. That is usually how businesses create brittle systems. We start with the most valuable workflow first, then expand in phases.",
    },
    {
      question: "What kinds of workflows can this cover?",
      answer:
        "Intake, routing, approvals, status changes, notifications, document handling, billing handoff, reporting, and other repetitive internal flows.",
    },
    {
      question: "What if I already have automations that break?",
      answer:
        "That is a normal use case. This lane can start by auditing and cleaning what already exists before adding anything new.",
    },
    {
      question: "Will my team understand what gets built?",
      answer:
        "Yes. A big part of making this lane trustworthy is documentation, explanation, and clean handoff so the system does not feel mysterious.",
    },
  ],
  crossLinks: commonCrossLinks.filter((item) => item.href !== "/systems"),
  finalTitle: "Start with the workflow lane if the business is leaking time through its internal process.",
  finalText:
    "This is the right lane when the main problem is not presentation or storefront conversion — it is operational drag, broken handoffs, and disconnected systems.",
  finalPrimaryCta: { label: "Start Workflow Audit", href: "/ops-intake" },
  finalSecondaryCta: { label: "Compare Services", href: "/" },
};