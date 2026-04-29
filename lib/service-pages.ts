import type { ServicePageProps } from "@/components/service-page/ServicePage";

type Locale = "en" | "fr" | "es";
type ServiceId = "websites" | "systems" | "ecommerce";

// ServiceData mirrors ServicePageProps. We translate by swapping locale-keyed
// objects under each ServiceId. /fr and /es fall back to the en entry if a
// locale's copy hasn't been authored yet — the page renders, just in English.
type ServiceData = ServicePageProps;

const CROSS_LINKS: Record<ServiceId, ServicePageProps["crossLinks"]> = {
  websites: [
    { id: "ecommerce", href: "/ecommerce" },
    { id: "systems", href: "/systems" },
  ],
  systems: [
    { id: "websites", href: "/websites" },
    { id: "ecommerce", href: "/ecommerce" },
  ],
  ecommerce: [
    { id: "websites", href: "/websites" },
    { id: "systems", href: "/systems" },
  ],
};

const websitesData: Partial<Record<Locale, ServiceData>> = {};
const systemsData: Partial<Record<Locale, ServiceData>> = {};
const ecommerceData: Partial<Record<Locale, ServiceData>> = {};

websitesData.en = {
  eyebrow: "Website building",
  title: "A website that makes people trust your business before they even call you.",
  intro:
    "Your website is the first thing people check. If it looks outdated, loads slow, or doesn't explain what you do — you're losing customers before they reach out. We build custom websites that look professional, convert visitors, and actually represent how good your business is.",
  heroImage: "/images/services/website-hero.webp",
  heroAlt: "Premium website design for small businesses",
  heroStats: [
    "2–3 wk typical delivery",
    "Custom · no templates",
    "$0 until scope is approved",
    "Yours: code, domain, content",
  ],
  primaryCta: { label: "Get a free estimate", href: "/build/intro" },
  secondaryCta: { label: "See How It Works", href: "/process" },
  whoItsForTitle: "Best for small businesses that need a credible online presence.",
  whoItsFor: [
    "Your current website looks like it was built in 2015 and you know it's hurting you.",
    "You get traffic but nobody fills out your form, calls you, or books an appointment.",
    "Your competitors' websites look better than yours, even though your service is superior.",
    "You've been burned by a freelancer who disappeared, and you want a structured process.",
  ],
  problemsTitle: "Most small business websites fail for the same four reasons.",
  problems: [
    "Your homepage doesn't explain what you do in five seconds.",
    "There's no clear next step for visitors to take.",
    "The site looks broken on phones, where most people browse.",
    "You have no idea who visits or where they drop off.",
  ],
  includesTitle: "Strategy, build, and launch — all in one engagement.",
  includes: [
    {
      title: "Structure that converts",
      items: [
        "Pages planned around one goal: getting visitors to contact you",
        "Messaging hierarchy so people understand your offer in seconds",
        "Section flow designed around how real visitors scan and decide",
        "Competitor research so we know what you're up against",
      ],
    },
    {
      title: "Custom, fast, and yours",
      items: [
        "Custom responsive design — mobile-first, fast-loading",
        "Contact forms, click-to-call, booking links — all set up",
        "SEO basics, meta tags, and analytics ready at launch",
        "Real CMS so you can edit text without breaking anything",
      ],
    },
    {
      title: "Live, owned, and supported",
      items: [
        "Full QA before we push anything live",
        "Domain connection, SSL, and analytics setup",
        "You own everything — code, domain, content, data",
        "30 days post-launch support included",
      ],
    },
  ],
  pricingTitle: "You see the price before you commit.",
  pricingIntro:
    "Every project is scoped on what you actually need — no monthly hostage fees, no surprise add-ons. Pick a starting point and we'll send a fixed estimate within 24 hours.",
  pricingCards: [
    { label: "/ STARTER", value: "$1,800 - $2,400", detail: "For a clean, credible single-page site that does one job well." },
    { label: "/ GROWTH", value: "$3,500 - $4,500", detail: "For most small businesses ready to look the part and convert." },
    { label: "/ PREMIUM", value: "$6,500 - $10,000+", detail: "For businesses that need a real site with depth, content, and moving parts." },
  ],
  processTitle: "Four steps. No surprises.",
  processIntro:
    "You'll always know where things stand. No disappearing freelancers, no vague timelines, no wondering if we're still working on it.",
  process: [
    { step: "/ 01 — DAY 1", title: "Tell us what you need", detail: "Fill out a 10-minute intake about your business, goals, and timeline. No sales call required to get started." },
    { step: "/ 02 — DAY 2", title: "Get a detailed estimate", detail: "Our system scores your project and generates a scope with pricing, pages, features, and timeline — usually within 24 hours." },
    { step: "/ 03 — WEEK 1–3", title: "We build, you review live", detail: "You see a live preview, upload content, and submit feedback. Everything happens in your private workspace — no scattered emails." },
    { step: "/ 04 — LAUNCH DAY", title: "Launch and handoff", detail: "Domain connected, analytics set up, forms tested, SEO basics done. We hand you the keys. The code is yours." },
  ],
  bestFitTitle: "Start here if your first impression is the bottleneck.",
  bestFit: [
    "Your business is good but your website doesn't show it.",
    "You want more leads, more calls, or more bookings from your site.",
    "You want a structured build process with a clear scope and price.",
  ],
  notFitTitle: "Don't start here if your real problem is somewhere else.",
  notFit: [
    "You mainly need an online store with product listings and checkout.",
    "Your biggest problem is internal workflow chaos, not your public website.",
    "You want the cheapest possible template site with no strategy behind it.",
    "You're not ready to make decisions or share content for the next 30 days.",
  ],
  faqTitle: "Everything people ask before signing.",
  faqs: [
    { question: "How long does a website build actually take?", answer: "Most builds land between 2 and 4 weeks depending on page count, content readiness, and revisions. You'll see a fixed timeline in your estimate before committing — and we hold to it. The biggest variable is how fast you can review and approve work." },
    { question: "Do you write the copy or just design?", answer: "Either way works. We can build from your existing copy, restructure it, or write it with you from scratch. Full copywriting increases scope but usually improves the result significantly — especially for service businesses where the words do the selling." },
    { question: "Can you redesign my existing site instead of starting from zero?", answer: "Yes — if the foundation is usable. We can improve structure, visuals, and conversion flow without rebuilding everything from scratch. If your current site is on Wix or Squarespace and you're locked in, we can usually migrate you to something you actually own." },
    { question: "What happens after I submit the estimate form?", answer: "You get a detailed scope with pricing within 24 hours — no sales call required. If you want to move forward, we schedule a quick planning call, you pay a 50% deposit, and we start building. Everything happens in your private project workspace." },
    { question: "What if I need ongoing changes after launch?", answer: "You own the code and can edit it yourself or hire anyone to maintain it — no lock-in. We also offer optional monthly support if you want us to handle updates, changes, and new pages on retainer. Most clients start without it and add it later if they need it." },
    { question: "What if I'm not happy with the design?", answer: "Every tier includes multiple revision rounds. We share early concepts before going deep, so course corrections happen when they're cheap — not after the whole site is built. In four years we've never had a project we couldn't bring across the finish line." },
  ],
  crossLinks: CROSS_LINKS.websites,
  finalTitle: "Ready to stop losing customers to a bad first impression?",
  finalText: "Let's make people actually call you.",
  finalPrimaryCta: { label: "Start your free estimate", href: "/build/intro" },
  finalSecondaryCta: { label: "Talk to a human first", href: "/contact" },
};

websitesData.fr = {
  eyebrow: "Création de sites web",
  title: "Un site web qui inspire confiance avant même qu'on vous appelle.",
  intro:
    "Votre site est la première chose qu'on consulte. S'il paraît dépassé, charge lentement ou n'explique pas ce que vous faites — vous perdez des clients avant qu'ils ne vous contactent. Nous concevons des sites sur mesure qui paraissent professionnels, convertissent les visiteurs et reflètent vraiment la qualité de votre entreprise.",
  heroImage: "/images/services/website-hero.webp",
  heroAlt: "Conception de sites web premium pour petites entreprises",
  heroStats: [
    "2-3 sem de délai habituel",
    "Sur mesure · pas de modèles",
    "0 $ tant que la portée n'est pas approuvée",
    "À vous : code, domaine, contenu",
  ],
  primaryCta: { label: "Obtenir un devis gratuit", href: "/build/intro" },
  secondaryCta: { label: "Voir comment ça marche", href: "/process" },
  whoItsForTitle: "Idéal pour les petites entreprises qui ont besoin d'une présence en ligne crédible.",
  whoItsFor: [
    "Votre site actuel donne l'impression d'avoir été conçu en 2015 et vous savez que cela vous dessert.",
    "Vous avez du trafic mais personne ne remplit votre formulaire, ne vous appelle ou ne réserve un rendez-vous.",
    "Les sites de vos concurrents paraissent meilleurs que le vôtre, alors que votre service est supérieur.",
    "Vous avez été déçu par un freelance qui a disparu et vous voulez un processus structuré.",
  ],
  problemsTitle: "La plupart des sites de petites entreprises échouent pour les mêmes quatre raisons.",
  problems: [
    "Votre page d'accueil n'explique pas ce que vous faites en cinq secondes.",
    "Il n'y a aucune étape suivante claire pour les visiteurs.",
    "Le site paraît cassé sur mobile, là où la plupart des gens naviguent.",
    "Vous n'avez aucune idée de qui vient ni de l'endroit où ils décrochent.",
  ],
  includesTitle: "Stratégie, construction et lancement — dans une seule prestation.",
  includes: [
    {
      title: "Une structure qui convertit",
      items: [
        "Pages pensées pour un seul objectif : amener les visiteurs à vous contacter",
        "Hiérarchie de message pour que l'on comprenne votre offre en quelques secondes",
        "Flux de sections conçu d'après la façon dont les vrais visiteurs lisent et décident",
        "Étude de la concurrence pour savoir à quoi vous faites face",
      ],
    },
    {
      title: "Sur mesure, rapide et à vous",
      items: [
        "Design responsive sur mesure — mobile-first, chargement rapide",
        "Formulaires de contact, clic-pour-appeler, liens de réservation — tout est en place",
        "Bases SEO, balises meta et analytics prêts au lancement",
        "Vrai CMS pour modifier le texte sans rien casser",
      ],
    },
    {
      title: "En ligne, possédé et soutenu",
      items: [
        "QA complète avant toute mise en production",
        "Connexion du domaine, SSL et configuration analytics",
        "Vous possédez tout — code, domaine, contenu, données",
        "30 jours de support post-lancement inclus",
      ],
    },
  ],
  pricingTitle: "Vous voyez le prix avant de vous engager.",
  pricingIntro:
    "Chaque projet est chiffré sur ce dont vous avez vraiment besoin — aucune mensualité prison, aucun extra surprise. Choisissez un point de départ et nous envoyons une estimation fixe sous 24 heures.",
  pricingCards: [
    { label: "/ STARTER", value: "1 800 $ - 2 400 $", detail: "Pour un site mono-page propre et crédible qui doit bien faire une seule chose." },
    { label: "/ GROWTH", value: "3 500 $ - 4 500 $", detail: "Pour la plupart des petites entreprises prêtes à paraître sérieuses et convertir." },
    { label: "/ PREMIUM", value: "6 500 $ - 10 000 $+", detail: "Pour les entreprises qui ont besoin d'un vrai site avec profondeur, contenu et pièces mobiles." },
  ],
  processTitle: "Quatre étapes. Aucune surprise.",
  processIntro:
    "Vous saurez toujours où on en est. Pas de freelance qui disparaît, pas de calendriers flous, pas d'incertitude sur l'état du travail.",
  process: [
    { step: "/ 01 — JOUR 1", title: "Dites-nous ce dont vous avez besoin", detail: "Remplissez un intake de 10 minutes sur votre entreprise, vos objectifs et votre calendrier. Aucun appel commercial requis pour commencer." },
    { step: "/ 02 — JOUR 2", title: "Recevez une estimation détaillée", detail: "Notre système évalue votre projet et génère une portée avec tarifs, pages, fonctionnalités et calendrier — généralement sous 24 heures." },
    { step: "/ 03 — SEM 1-3", title: "On construit, vous validez en direct", detail: "Vous voyez un aperçu en direct, téléversez du contenu et soumettez vos retours. Tout passe par votre espace privé — pas de courriels dispersés." },
    { step: "/ 04 — JOUR DE LANCEMENT", title: "Lancement et remise", detail: "Domaine connecté, analytics installé, formulaires testés, bases SEO faites. On vous remet les clés. Le code est à vous." },
  ],
  bestFitTitle: "Commencez ici si votre première impression est le goulet d'étranglement.",
  bestFit: [
    "Votre entreprise est bonne mais votre site ne le montre pas.",
    "Vous voulez plus de prospects, plus d'appels ou plus de réservations depuis votre site.",
    "Vous voulez un processus de construction structuré avec une portée et un prix clairs.",
  ],
  notFitTitle: "Ne commencez pas ici si votre vrai problème est ailleurs.",
  notFit: [
    "Vous avez surtout besoin d'une boutique en ligne avec fiches produits et paiement.",
    "Votre plus gros problème est le chaos des workflows internes, pas votre site public.",
    "Vous voulez le site modèle le moins cher possible, sans aucune stratégie derrière.",
    "Vous n'êtes pas prêt à prendre des décisions ni à partager du contenu pendant 30 jours.",
  ],
  faqTitle: "Tout ce qu'on demande avant de signer.",
  faqs: [
    { question: "Combien de temps prend vraiment une construction de site ?", answer: "La plupart des projets s'étalent sur 2 à 4 semaines selon le nombre de pages, la maturité des contenus et les révisions. Vous verrez un calendrier fixe dans votre estimation avant de vous engager — et nous nous y tenons. Le plus gros facteur, c'est la vitesse à laquelle vous validez le travail." },
    { question: "Vous écrivez le contenu ou seulement le design ?", answer: "Les deux fonctionnent. Nous pouvons partir de votre contenu, le restructurer ou l'écrire avec vous depuis zéro. La rédaction complète augmente la portée mais améliore généralement le résultat — surtout pour les entreprises de services où ce sont les mots qui vendent." },
    { question: "Pouvez-vous redessiner mon site existant au lieu de tout repartir de zéro ?", answer: "Oui — si la base est utilisable. Nous pouvons améliorer la structure, le visuel et le flux de conversion sans tout reconstruire. Si votre site actuel est sur Wix ou Squarespace et que vous êtes coincé, nous pouvons généralement vous migrer vers quelque chose que vous possédez vraiment." },
    { question: "Que se passe-t-il après l'envoi du formulaire d'estimation ?", answer: "Vous recevez une portée détaillée avec tarifs sous 24 heures — aucun appel commercial requis. Si vous voulez avancer, nous planifions un appel de planification rapide, vous payez un acompte de 50 %, et nous démarrons. Tout passe par votre espace projet privé." },
    { question: "Et si j'ai besoin de changements continus après le lancement ?", answer: "Vous possédez le code et pouvez le modifier vous-même ou faire appel à n'importe qui pour le maintenir — aucune dépendance. Nous proposons aussi un support mensuel optionnel si vous voulez que nous gérions les mises à jour, les changements et les nouvelles pages en abonnement. La plupart des clients commencent sans et l'ajoutent plus tard si besoin." },
    { question: "Et si je ne suis pas content du design ?", answer: "Chaque niveau inclut plusieurs tours de révision. Nous partageons des concepts tôt avant d'aller en profondeur, donc les corrections de cap se font tant qu'elles sont peu coûteuses — pas une fois tout le site construit. En quatre ans, nous n'avons jamais eu de projet que nous n'avons pas pu mener au bout." },
  ],
  crossLinks: CROSS_LINKS.websites,
  finalTitle: "Prêt à arrêter de perdre des clients à cause d'une mauvaise première impression ?",
  finalText: "Faisons en sorte que les gens vous appellent vraiment.",
  finalPrimaryCta: { label: "Démarrer votre devis gratuit", href: "/build/intro" },
  finalSecondaryCta: { label: "Parler d'abord à un humain", href: "/contact" },
};

websitesData.es = {
  eyebrow: "Construcción de sitios web",
  title: "Un sitio web que genera confianza en tu negocio antes de que te llamen.",
  intro:
    "Tu sitio web es lo primero que la gente revisa. Si se ve desactualizado, carga lento o no explica lo que haces — estás perdiendo clientes antes de que te contacten. Construimos sitios a medida que se ven profesionales, convierten visitantes y representan de verdad lo bueno que es tu negocio.",
  heroImage: "/images/services/website-hero.webp",
  heroAlt: "Diseño de sitios web premium para pequeñas empresas",
  heroStats: [
    "2-3 sem de entrega habitual",
    "A medida · sin plantillas",
    "$0 hasta que se apruebe el alcance",
    "Tuyo: código, dominio, contenido",
  ],
  primaryCta: { label: "Pedir una estimación gratuita", href: "/build/intro" },
  secondaryCta: { label: "Ver cómo funciona", href: "/process" },
  whoItsForTitle: "Ideal para pequeñas empresas que necesitan una presencia en línea creíble.",
  whoItsFor: [
    "Tu sitio actual parece hecho en 2015 y sabes que te está perjudicando.",
    "Tienes tráfico pero nadie llena el formulario, te llama o reserva una cita.",
    "Los sitios de tus competidores se ven mejor que el tuyo, aunque tu servicio sea superior.",
    "Te quemó un freelance que desapareció y quieres un proceso estructurado.",
  ],
  problemsTitle: "La mayoría de los sitios de pequeñas empresas fallan por las mismas cuatro razones.",
  problems: [
    "Tu página de inicio no explica lo que haces en cinco segundos.",
    "No hay un siguiente paso claro para los visitantes.",
    "El sitio se ve roto en el móvil, donde la mayoría de la gente navega.",
    "No tienes idea de quién visita ni dónde se van.",
  ],
  includesTitle: "Estrategia, construcción y lanzamiento — todo en una sola contratación.",
  includes: [
    {
      title: "Estructura que convierte",
      items: [
        "Páginas pensadas con un único objetivo: que el visitante te contacte",
        "Jerarquía de mensaje para que se entienda tu oferta en segundos",
        "Flujo de secciones diseñado según cómo escanean y deciden los visitantes reales",
        "Investigación de competencia para saber a qué te enfrentas",
      ],
    },
    {
      title: "A medida, rápido y tuyo",
      items: [
        "Diseño responsive a medida — móvil primero, carga rápida",
        "Formularios de contacto, clic-para-llamar, enlaces de reserva — todo configurado",
        "Bases de SEO, etiquetas meta y analítica listas al lanzamiento",
        "CMS real para editar el texto sin romper nada",
      ],
    },
    {
      title: "En vivo, propio y con soporte",
      items: [
        "QA completo antes de publicar nada",
        "Conexión de dominio, SSL y configuración de analítica",
        "Eres dueño de todo — código, dominio, contenido, datos",
        "30 días de soporte post-lanzamiento incluidos",
      ],
    },
  ],
  pricingTitle: "Ves el precio antes de comprometerte.",
  pricingIntro:
    "Cada proyecto se cotiza según lo que realmente necesitas — sin cuotas mensuales rehén, sin extras sorpresa. Elige un punto de partida y enviaremos una estimación fija dentro de 24 horas.",
  pricingCards: [
    { label: "/ STARTER", value: "$1.800 - $2.400", detail: "Para un sitio de una página limpio y creíble que hace una sola cosa bien." },
    { label: "/ GROWTH", value: "$3.500 - $4.500", detail: "Para la mayoría de pequeñas empresas listas para verse a la altura y convertir." },
    { label: "/ PREMIUM", value: "$6.500 - $10.000+", detail: "Para empresas que necesitan un sitio real con profundidad, contenido y piezas en movimiento." },
  ],
  processTitle: "Cuatro pasos. Sin sorpresas.",
  processIntro:
    "Siempre sabrás dónde están las cosas. Sin freelances que desaparecen, sin plazos vagos, sin preguntarte si seguimos trabajando.",
  process: [
    { step: "/ 01 — DÍA 1", title: "Cuéntanos qué necesitas", detail: "Llena un intake de 10 minutos sobre tu negocio, objetivos y plazos. No se requiere llamada de venta para empezar." },
    { step: "/ 02 — DÍA 2", title: "Recibe una estimación detallada", detail: "Nuestro sistema puntúa tu proyecto y genera un alcance con precios, páginas, funciones y plazos — normalmente en menos de 24 horas." },
    { step: "/ 03 — SEM 1-3", title: "Construimos, tú revisas en vivo", detail: "Ves una vista previa en vivo, subes contenido y envías comentarios. Todo pasa por tu espacio privado — sin correos dispersos." },
    { step: "/ 04 — DÍA DE LANZAMIENTO", title: "Lanzamiento y traspaso", detail: "Dominio conectado, analítica configurada, formularios probados, bases de SEO listas. Te entregamos las llaves. El código es tuyo." },
  ],
  bestFitTitle: "Empieza aquí si tu primera impresión es el cuello de botella.",
  bestFit: [
    "Tu negocio es bueno pero tu sitio no lo demuestra.",
    "Quieres más leads, más llamadas o más reservas desde tu sitio.",
    "Quieres un proceso de construcción estructurado con alcance y precio claros.",
  ],
  notFitTitle: "No empieces aquí si tu problema real está en otro lado.",
  notFit: [
    "Sobre todo necesitas una tienda en línea con fichas de producto y checkout.",
    "Tu mayor problema es el caos de workflows internos, no tu sitio público.",
    "Quieres el sitio plantilla más barato posible, sin estrategia detrás.",
    "No estás listo para tomar decisiones ni compartir contenido durante 30 días.",
  ],
  faqTitle: "Todo lo que la gente pregunta antes de firmar.",
  faqs: [
    { question: "¿Cuánto tarda realmente construir un sitio?", answer: "La mayoría de los sitios se entregan entre 2 y 4 semanas según número de páginas, madurez del contenido y revisiones. Verás un plazo fijo en tu estimación antes de comprometerte — y lo mantenemos. La mayor variable es la velocidad con la que tú revisas y apruebas el trabajo." },
    { question: "¿Escriben el contenido o solo diseñan?", answer: "Funciona de cualquier forma. Podemos partir de tu contenido, reestructurarlo, o escribirlo contigo desde cero. La redacción completa aumenta el alcance pero suele mejorar mucho el resultado — sobre todo en empresas de servicios donde son las palabras las que venden." },
    { question: "¿Pueden rediseñar mi sitio actual en lugar de empezar de cero?", answer: "Sí — si la base es utilizable. Podemos mejorar estructura, visuales y flujo de conversión sin reconstruir todo. Si tu sitio actual está en Wix o Squarespace y estás atrapado, normalmente podemos migrarte a algo que de verdad sea tuyo." },
    { question: "¿Qué pasa después de enviar el formulario de estimación?", answer: "Recibes un alcance detallado con precios en menos de 24 horas — sin llamada de venta requerida. Si quieres avanzar, agendamos una llamada rápida de planificación, pagas un depósito del 50 %, y empezamos a construir. Todo pasa por tu espacio de proyecto privado." },
    { question: "¿Y si necesito cambios continuos después del lanzamiento?", answer: "Eres dueño del código y puedes editarlo tú mismo o contratar a quien quieras para mantenerlo — sin amarres. También ofrecemos soporte mensual opcional si quieres que llevemos actualizaciones, cambios y nuevas páginas en retainer. La mayoría empieza sin él y lo añade después si lo necesita." },
    { question: "¿Y si no me gusta el diseño?", answer: "Cada nivel incluye varias rondas de revisión. Compartimos conceptos tempranos antes de profundizar, así que las correcciones de rumbo se hacen cuando son baratas — no después de construir todo el sitio. En cuatro años no hemos tenido un proyecto que no hayamos podido cerrar bien." },
  ],
  crossLinks: CROSS_LINKS.websites,
  finalTitle: "¿Listo para dejar de perder clientes por una mala primera impresión?",
  finalText: "Hagamos que la gente te llame de verdad.",
  finalPrimaryCta: { label: "Iniciar tu estimación gratuita", href: "/build/intro" },
  finalSecondaryCta: { label: "Hablar primero con una persona", href: "/contact" },
};

systemsData.en = {
  eyebrow: "Workflow automation",
  title: "Stop doing the same task twice. We build the automation so you don't have to.",
  intro:
    "If you're copying data between tools, sending the same emails manually, or losing track of client requests — your business has an operations problem. We audit what's broken, build the automation that fixes it, and document everything so it doesn't become a mystery.",
  heroImage: "/images/services/ops-hero.webp",
  heroAlt: "Workflow automation for small businesses",
  heroStats: [
    "Zapier, Make.com, or custom",
    "Audit first, then build",
    "You own the workflows",
  ],
  primaryCta: { label: "Start Workflow Audit", href: "/ops-intake" },
  secondaryCta: { label: "See How It Works", href: "/process" },
  whoItsForTitle: "Best for businesses drowning in repetitive admin work.",
  whoItsFor: [
    "You spend hours copying data between tools that should be talking to each other.",
    "Leads fall through the cracks because nobody tracks who's responsible for follow-up.",
    "Your team sends the same emails, fills the same forms, and does the same steps every day.",
    "You've tried to fix this with software but ended up with more tools and more confusion.",
  ],
  problemsTitle: "The real cost of manual operations.",
  problems: [
    "You're paying skilled people to do data entry that a machine should handle.",
    "Nobody knows the real status of anything because it's in someone's head or a spreadsheet.",
    "Client onboarding takes too long because every step requires manual handoffs.",
    "Billing and invoicing are delayed because someone has to remember to send them.",
  ],
  includesTitle: "What the automation lane includes",
  includes: [
    {
      title: "Audit + Diagnosis",
      items: [
        "We map your current process and find the bottlenecks",
        "AI-powered scoring identifies what to automate first",
        "You see the before/after process map before we build anything",
      ],
    },
    {
      title: "Build + Test",
      items: [
        "Zapier, Make.com, or custom integrations — whatever fits",
        "Routing, notifications, status updates, and handoff logic",
        "Every automation is tested with real data before going live",
      ],
    },
    {
      title: "Document + Support",
      items: [
        "Written SOPs so your team understands what was built",
        "Clean handoff — no mystery automations",
        "Optional ongoing retainer for maintenance and new workflows",
      ],
    },
  ],
  pricingTitle: "Pricing based on complexity, not guesswork",
  pricingIntro:
    "We start with an audit so we know what we're building before we quote. Every project gets real numbers, not vague ranges.",
  pricingCards: [
    { label: "Quick Workflow Fix", value: "$1,000 – $1,800", detail: "One focused automation. Best for a single process that needs to stop being manual — intake routing, follow-up emails, status notifications." },
    { label: "Ops System Build", value: "$2,000 – $3,800", detail: "Multiple connected workflows. For businesses that need 2–4 automations working together — CRM sync, billing handoff, reporting dashboards." },
    { label: "Ongoing Systems Partner", value: "$500 – $1,250/mo", detail: "Monthly retainer. We maintain your automations, build new ones as your business evolves, and handle troubleshooting." },
  ],
  processTitle: "How the automation lane works",
  processIntro:
    "We don't start building until we understand what's actually broken. Every engagement begins with diagnosis.",
  process: [
    { step: "01", title: "Tell us what's broken", detail: "Fill out a 4-step intake about your tools, pain points, and the workflows you want fixed. Takes about 5 minutes." },
    { step: "02", title: "Audit + process map", detail: "We diagnose the bottleneck, map your current process, and show you what the automated version looks like — before building anything." },
    { step: "03", title: "Build the first automation", detail: "We implement the highest-value fix first. You see it working in your workspace with status tracking and test results." },
    { step: "04", title: "Document + expand", detail: "Once the first workflow is stable, we document it, train your team, and plan the next automation based on what will help most." },
  ],
  bestFitTitle: "Start here if your internal process is the bottleneck.",
  bestFit: [
    "You're losing hours every week to tasks that should be automatic.",
    "Your tools don't talk to each other and data lives in five different places.",
    "You want routing, notifications, and handoffs that just work without someone remembering.",
  ],
  notFitTitle: "Probably not the right first move if…",
  notFit: [
    "You mainly need a public-facing website — start with our website lane instead.",
    "You need an online store built or managed — look at our e-commerce lane.",
    "You want automation before understanding what process should actually be automated.",
  ],
  faqTitle: "Automation FAQs",
  faqs: [
    { question: "Do you automate everything at once?", answer: "No. We start with the most valuable workflow first, make sure it works, document it, and then expand. Trying to automate everything at once is how businesses end up with brittle systems." },
    { question: "What tools do you use?", answer: "Zapier and Make.com handle most cases. For complex needs, we build custom integrations. The audit determines which tool fits your specific workflow." },
    { question: "What if I already have automations that keep breaking?", answer: "Common situation. We can audit and fix existing automations before adding new ones. Sometimes the best first step is cleaning up what's already there." },
    { question: "Will my team understand what you build?", answer: "Yes. Every workflow includes written documentation and a walkthrough. We don't build mystery automations — your team needs to understand and trust the system." },
    { question: "Can this turn into ongoing support?", answer: "Yes. The Ongoing Systems Partner retainer ($500–$1,250/mo) covers maintenance, new workflow builds, and troubleshooting as your business evolves." },
  ],
  crossLinks: CROSS_LINKS.systems,
  finalTitle: "Ready to stop losing time to tasks a machine should handle?",
  finalText:
    "Start with a workflow audit. We'll diagnose the bottleneck, show you the fix, and give you a real price — all within 48 hours.",
  finalPrimaryCta: { label: "Start Workflow Audit", href: "/ops-intake" },
  finalSecondaryCta: { label: "Compare Services", href: "/" },
};

systemsData.fr = {
  eyebrow: "Automatisation de workflow",
  title: "Arrêtez de faire la même tâche deux fois. Nous construisons l'automatisation à votre place.",
  intro:
    "Si vous copiez des données entre des outils, envoyez les mêmes e-mails à la main ou perdez la trace des demandes clients — votre entreprise a un problème opérationnel. Nous auditons ce qui est cassé, construisons l'automatisation qui le répare, et tout documentons pour que cela ne devienne pas un mystère.",
  heroImage: "/images/services/ops-hero.webp",
  heroAlt: "Automatisation de workflow pour petites entreprises",
  heroStats: [
    "Zapier, Make.com ou sur mesure",
    "Audit d'abord, puis construction",
    "Vous possédez les workflows",
  ],
  primaryCta: { label: "Démarrer un audit workflow", href: "/ops-intake" },
  secondaryCta: { label: "Voir comment ça marche", href: "/process" },
  whoItsForTitle: "Idéal pour les entreprises noyées sous l'administratif répétitif.",
  whoItsFor: [
    "Vous passez des heures à copier des données entre des outils qui devraient communiquer entre eux.",
    "Des prospects passent à la trappe parce que personne ne suit qui est responsable de la relance.",
    "Votre équipe envoie les mêmes e-mails, remplit les mêmes formulaires et fait les mêmes étapes chaque jour.",
    "Vous avez essayé de régler ça avec des logiciels mais vous vous êtes retrouvé avec plus d'outils et plus de confusion.",
  ],
  problemsTitle: "Le vrai coût des opérations manuelles.",
  problems: [
    "Vous payez des personnes qualifiées pour faire de la saisie qu'une machine devrait gérer.",
    "Personne ne connaît le vrai statut de quoi que ce soit parce que c'est dans la tête de quelqu'un ou un tableur.",
    "L'onboarding client prend trop de temps parce que chaque étape demande un passage de relais manuel.",
    "La facturation est en retard parce que quelqu'un doit penser à l'envoyer.",
  ],
  includesTitle: "Ce que comprend l'axe automatisation",
  includes: [
    {
      title: "Audit + Diagnostic",
      items: [
        "Nous cartographions votre processus actuel et trouvons les goulets",
        "Un score IA identifie ce qu'il faut automatiser en premier",
        "Vous voyez la carte de processus avant/après avant que nous construisions quoi que ce soit",
      ],
    },
    {
      title: "Construction + Tests",
      items: [
        "Zapier, Make.com ou intégrations sur mesure — selon ce qui convient",
        "Routage, notifications, mises à jour de statut et logique de relais",
        "Chaque automatisation est testée avec de vraies données avant la mise en production",
      ],
    },
    {
      title: "Documentation + Support",
      items: [
        "Procédures écrites pour que votre équipe comprenne ce qui a été construit",
        "Remise propre — pas d'automatisations mystérieuses",
        "Abonnement optionnel pour la maintenance et de nouveaux workflows",
      ],
    },
  ],
  pricingTitle: "Tarifs basés sur la complexité, pas sur des suppositions",
  pricingIntro:
    "Nous commençons par un audit pour savoir ce que nous construisons avant de chiffrer. Chaque projet reçoit de vrais chiffres, pas des fourchettes vagues.",
  pricingCards: [
    { label: "Correctif workflow rapide", value: "1 000 $ – 1 800 $", detail: "Une automatisation ciblée. Idéale pour un seul processus qui doit cesser d'être manuel — routage d'intake, e-mails de relance, notifications de statut." },
    { label: "Construction de système ops", value: "2 000 $ – 3 800 $", detail: "Plusieurs workflows connectés. Pour les entreprises qui ont besoin de 2 à 4 automatisations qui fonctionnent ensemble — sync CRM, relais de facturation, tableaux de reporting." },
    { label: "Partenaire systèmes continu", value: "500 $ – 1 250 $/mois", detail: "Abonnement mensuel. Nous maintenons vos automatisations, en construisons de nouvelles à mesure que votre entreprise évolue, et gérons le dépannage." },
  ],
  processTitle: "Comment fonctionne l'axe automatisation",
  processIntro:
    "Nous ne commençons pas à construire avant de comprendre ce qui est vraiment cassé. Chaque prestation commence par un diagnostic.",
  process: [
    { step: "01", title: "Dites-nous ce qui est cassé", detail: "Remplissez un intake en 4 étapes sur vos outils, vos points de douleur et les workflows que vous voulez réparer. Cela prend environ 5 minutes." },
    { step: "02", title: "Audit + carte de processus", detail: "Nous diagnostiquons le goulet, cartographions votre processus actuel et vous montrons à quoi ressemble la version automatisée — avant de construire quoi que ce soit." },
    { step: "03", title: "Construction de la première automatisation", detail: "Nous mettons en œuvre le correctif à plus forte valeur en premier. Vous le voyez fonctionner dans votre espace avec suivi de statut et résultats de tests." },
    { step: "04", title: "Documentation + extension", detail: "Une fois le premier workflow stable, nous le documentons, formons votre équipe et planifions la prochaine automatisation selon ce qui aidera le plus." },
  ],
  bestFitTitle: "Commencez ici si votre processus interne est le goulet.",
  bestFit: [
    "Vous perdez des heures chaque semaine sur des tâches qui devraient être automatiques.",
    "Vos outils ne communiquent pas et les données vivent dans cinq endroits différents.",
    "Vous voulez du routage, des notifications et des passages de relais qui marchent sans qu'on doive y penser.",
  ],
  notFitTitle: "Probablement pas le bon premier pas si…",
  notFit: [
    "Vous avez surtout besoin d'un site public — commencez par notre axe sites web.",
    "Vous avez besoin d'une boutique en ligne construite ou gérée — regardez notre axe e-commerce.",
    "Vous voulez de l'automatisation avant d'avoir compris quel processus devrait vraiment être automatisé.",
  ],
  faqTitle: "FAQ automatisation",
  faqs: [
    { question: "Vous automatisez tout d'un coup ?", answer: "Non. Nous commençons par le workflow le plus utile, vérifions qu'il fonctionne, le documentons, puis étendons. Essayer de tout automatiser d'un coup, c'est comme ça que les entreprises se retrouvent avec des systèmes fragiles." },
    { question: "Quels outils utilisez-vous ?", answer: "Zapier et Make.com couvrent la plupart des cas. Pour les besoins complexes, nous construisons des intégrations sur mesure. L'audit détermine quel outil convient à votre workflow spécifique." },
    { question: "Et si j'ai déjà des automatisations qui se cassent sans cesse ?", answer: "Cas fréquent. Nous pouvons auditer et réparer les automatisations existantes avant d'en ajouter de nouvelles. Parfois, le meilleur premier pas est de nettoyer ce qui est déjà là." },
    { question: "Mon équipe comprendra-t-elle ce que vous construisez ?", answer: "Oui. Chaque workflow inclut une documentation écrite et une visite guidée. Nous ne construisons pas d'automatisations mystérieuses — votre équipe doit comprendre et faire confiance au système." },
    { question: "Cela peut-il devenir un support continu ?", answer: "Oui. L'abonnement Partenaire systèmes continu (500 $ – 1 250 $/mois) couvre la maintenance, la construction de nouveaux workflows et le dépannage à mesure que votre entreprise évolue." },
  ],
  crossLinks: CROSS_LINKS.systems,
  finalTitle: "Prêt à arrêter de perdre du temps sur des tâches qu'une machine devrait gérer ?",
  finalText:
    "Commencez par un audit workflow. Nous diagnostiquerons le goulet, vous montrerons le correctif et vous donnerons un vrai prix — le tout sous 48 heures.",
  finalPrimaryCta: { label: "Démarrer un audit workflow", href: "/ops-intake" },
  finalSecondaryCta: { label: "Comparer les services", href: "/" },
};

systemsData.es = {
  eyebrow: "Automatización de workflow",
  title: "Deja de hacer la misma tarea dos veces. Construimos la automatización por ti.",
  intro:
    "Si copias datos entre herramientas, envías los mismos correos a mano o pierdes el rastro de las solicitudes de los clientes — tu negocio tiene un problema operativo. Auditamos lo que está roto, construimos la automatización que lo arregla y documentamos todo para que no se convierta en un misterio.",
  heroImage: "/images/services/ops-hero.webp",
  heroAlt: "Automatización de workflow para pequeñas empresas",
  heroStats: [
    "Zapier, Make.com o a medida",
    "Primero auditoría, luego construcción",
    "Eres dueño de los workflows",
  ],
  primaryCta: { label: "Iniciar auditoría de workflow", href: "/ops-intake" },
  secondaryCta: { label: "Ver cómo funciona", href: "/process" },
  whoItsForTitle: "Ideal para empresas ahogadas en trabajo administrativo repetitivo.",
  whoItsFor: [
    "Pasas horas copiando datos entre herramientas que deberían comunicarse entre sí.",
    "Los leads se pierden porque nadie sigue quién es responsable del seguimiento.",
    "Tu equipo envía los mismos correos, llena los mismos formularios y hace los mismos pasos cada día.",
    "Has intentado arreglarlo con software pero terminaste con más herramientas y más confusión.",
  ],
  problemsTitle: "El verdadero costo de las operaciones manuales.",
  problems: [
    "Pagas a personas calificadas para hacer captura de datos que una máquina debería manejar.",
    "Nadie sabe el verdadero estado de nada porque está en la cabeza de alguien o en una hoja de cálculo.",
    "El onboarding del cliente tarda demasiado porque cada paso requiere un traspaso manual.",
    "La facturación va con retraso porque alguien tiene que acordarse de enviarla.",
  ],
  includesTitle: "Qué incluye la vía de automatización",
  includes: [
    {
      title: "Auditoría + Diagnóstico",
      items: [
        "Mapeamos tu proceso actual y encontramos los cuellos de botella",
        "Una puntuación con IA identifica qué automatizar primero",
        "Ves el mapa de proceso antes/después antes de que construyamos nada",
      ],
    },
    {
      title: "Construcción + Pruebas",
      items: [
        "Zapier, Make.com o integraciones a medida — lo que encaje",
        "Ruteo, notificaciones, actualizaciones de estado y lógica de traspaso",
        "Cada automatización se prueba con datos reales antes de salir en vivo",
      ],
    },
    {
      title: "Documentación + Soporte",
      items: [
        "SOPs por escrito para que tu equipo entienda lo que se construyó",
        "Traspaso limpio — sin automatizaciones misteriosas",
        "Retainer continuo opcional para mantenimiento y nuevos workflows",
      ],
    },
  ],
  pricingTitle: "Precios basados en complejidad, no en suposiciones",
  pricingIntro:
    "Empezamos con una auditoría para saber qué construimos antes de cotizar. Cada proyecto recibe números reales, no rangos vagos.",
  pricingCards: [
    { label: "Arreglo rápido de workflow", value: "$1.000 – $1.800", detail: "Una automatización enfocada. Ideal para un solo proceso que necesita dejar de ser manual — ruteo de intake, correos de seguimiento, notificaciones de estado." },
    { label: "Construcción de sistema ops", value: "$2.000 – $3.800", detail: "Múltiples workflows conectados. Para empresas que necesitan 2 a 4 automatizaciones funcionando juntas — sync de CRM, traspaso de facturación, dashboards de reporting." },
    { label: "Socio de sistemas continuo", value: "$500 – $1.250/mes", detail: "Retainer mensual. Mantenemos tus automatizaciones, construimos nuevas a medida que tu negocio evoluciona y manejamos la resolución de problemas." },
  ],
  processTitle: "Cómo funciona la vía de automatización",
  processIntro:
    "No empezamos a construir hasta entender qué está realmente roto. Cada contratación empieza con un diagnóstico.",
  process: [
    { step: "01", title: "Cuéntanos qué está roto", detail: "Llena un intake de 4 pasos sobre tus herramientas, dolores y los workflows que quieres arreglar. Toma unos 5 minutos." },
    { step: "02", title: "Auditoría + mapa de proceso", detail: "Diagnosticamos el cuello de botella, mapeamos tu proceso actual y te mostramos cómo se ve la versión automatizada — antes de construir nada." },
    { step: "03", title: "Construcción de la primera automatización", detail: "Implementamos primero el arreglo de mayor valor. Lo ves funcionando en tu espacio con seguimiento de estado y resultados de pruebas." },
    { step: "04", title: "Documentación + expansión", detail: "Una vez estable el primer workflow, lo documentamos, formamos a tu equipo y planificamos la siguiente automatización según lo que más ayude." },
  ],
  bestFitTitle: "Empieza aquí si tu proceso interno es el cuello de botella.",
  bestFit: [
    "Pierdes horas cada semana en tareas que deberían ser automáticas.",
    "Tus herramientas no se hablan y los datos viven en cinco lugares distintos.",
    "Quieres ruteo, notificaciones y traspasos que simplemente funcionen sin que alguien tenga que recordar.",
  ],
  notFitTitle: "Probablemente no sea el primer paso si…",
  notFit: [
    "Sobre todo necesitas un sitio web público — empieza por nuestra vía de sitios web.",
    "Necesitas una tienda en línea construida o gestionada — mira nuestra vía de e-commerce.",
    "Quieres automatización antes de entender qué proceso debería automatizarse de verdad.",
  ],
  faqTitle: "FAQ de automatización",
  faqs: [
    { question: "¿Automatizan todo de una vez?", answer: "No. Empezamos con el workflow más valioso primero, nos aseguramos de que funcione, lo documentamos y luego expandimos. Intentar automatizar todo a la vez es como las empresas terminan con sistemas frágiles." },
    { question: "¿Qué herramientas usan?", answer: "Zapier y Make.com cubren la mayoría de los casos. Para necesidades complejas, construimos integraciones a medida. La auditoría determina qué herramienta encaja con tu workflow específico." },
    { question: "¿Y si ya tengo automatizaciones que siguen rompiéndose?", answer: "Situación común. Podemos auditar y arreglar automatizaciones existentes antes de añadir nuevas. A veces el mejor primer paso es limpiar lo que ya está." },
    { question: "¿Mi equipo entenderá lo que construyen?", answer: "Sí. Cada workflow incluye documentación escrita y un walkthrough. No construimos automatizaciones misteriosas — tu equipo necesita entender y confiar en el sistema." },
    { question: "¿Esto puede convertirse en soporte continuo?", answer: "Sí. El retainer Socio de Sistemas Continuo ($500 – $1.250/mes) cubre mantenimiento, nuevas construcciones de workflow y resolución de problemas a medida que tu negocio evoluciona." },
  ],
  crossLinks: CROSS_LINKS.systems,
  finalTitle: "¿Listo para dejar de perder tiempo en tareas que una máquina debería manejar?",
  finalText:
    "Empieza con una auditoría de workflow. Diagnosticaremos el cuello de botella, te mostraremos el arreglo y te daremos un precio real — todo dentro de 48 horas.",
  finalPrimaryCta: { label: "Iniciar auditoría de workflow", href: "/ops-intake" },
  finalSecondaryCta: { label: "Comparar servicios", href: "/" },
};

ecommerceData.en = {
  eyebrow: "E-commerce services",
  title: "Build your store, fix what's broken, or let us run the whole thing.",
  intro:
    "Whether you need a new online store built from scratch, a broken checkout fixed, or someone to handle your daily operations — we offer all three. Pick the service that matches where you are right now.",
  heroImage: "/images/services/ecommerce-hero.webp",
  heroAlt: "E-commerce store management and operations",
  heroStats: [
    "Build · Run · Fix",
    "Shopify, Amazon, Etsy, WooCommerce",
    "Monthly operations from $500/mo",
  ],
  primaryCta: { label: "Start E-commerce Intake", href: "/ecommerce/intake" },
  secondaryCta: { label: "See Pricing", href: "/pricing" },
  whoItsForTitle: "Best for online sellers who need more than just a storefront.",
  whoItsFor: [
    "You need a store built but don't know where to start with platforms, payments, and shipping.",
    "You already have a store but you're spending all your time on operations instead of growing.",
    "Your checkout is leaking sales and you don't know why customers abandon their carts.",
    "You want someone to manage listings, orders, returns, and customer service so you can focus on product.",
  ],
  problemsTitle: "The real problems behind most struggling stores.",
  problems: [
    "The store exists but nobody's actually managing it — listings are stale, orders pile up, customers wait.",
    "Checkout friction is killing conversions — too many steps, unclear shipping, missing trust signals.",
    "Post-purchase is a mess — no order confirmation flow, no shipping updates, no follow-up.",
    "You're doing everything manually and it's not scalable beyond where you are now.",
  ],
  includesTitle: "Three ways we help",
  includes: [
    {
      title: "Build — New store from scratch",
      items: [
        "Full Shopify or WooCommerce store setup",
        "Product pages, checkout, payments, and shipping configured",
        "Mobile-optimized design with post-purchase email flow",
      ],
    },
    {
      title: "Run — Ongoing operations management",
      items: [
        "Product listing updates and inventory monitoring",
        "Order processing, customer service, and returns",
        "Monthly performance reporting and optimization",
      ],
    },
    {
      title: "Fix — Audit and optimization sprint",
      items: [
        "Full checkout and conversion rate audit",
        "5–10 targeted fixes implemented in 2–3 weeks",
        "Transition to managed operations after the sprint",
      ],
    },
  ],
  pricingTitle: "Clear pricing for each service type",
  pricingIntro:
    "Build is a one-time project fee. Run is a monthly retainer. Fix is a one-time sprint. You see the price before you commit.",
  pricingCards: [
    { label: "Build a store", value: "From $1,800", detail: "One-time project fee. Basic stores start at $1,800, standard at $2,500–$3,500, premium at $4,000+." },
    { label: "Run your store", value: "From $500/mo", detail: "Monthly retainer. Starter $500/mo, Growth $1,000/mo, Scale $1,800/mo — based on order volume." },
    { label: "Fix your store", value: "$1,200", detail: "One-time audit + implementation sprint. Most clients transition to a monthly retainer afterward." },
  ],
  processTitle: "How it works — regardless of which service you pick",
  processIntro:
    "Every engagement starts the same way: tell us what you need, we scope it, you approve, we deliver.",
  process: [
    { step: "01", title: "Tell us your situation", detail: "Fill out a 2-minute intake. The first question is: do you need a store built, someone to run yours, or something fixed?" },
    { step: "02", title: "Planning call + proposal", detail: "We review your intake, schedule a call, and draft a proposal with pricing, scope, and timeline." },
    { step: "03", title: "We deliver", detail: "Build clients get a store. Fix clients get an audit + fixes. Run clients get ongoing operations from day one." },
    { step: "04", title: "Track everything in your workspace", detail: "Every client gets a private workspace showing project status, tasks, and — for operations clients — monthly performance." },
  ],
  bestFitTitle: "Start here if your store needs professional help.",
  bestFit: [
    "You need a store built on a solid platform with checkout, payments, and shipping done right.",
    "You're drowning in orders, returns, and customer messages and need someone to take over.",
    "Your store's conversion rate is bad and you don't know what to fix first.",
  ],
  notFitTitle: "Probably not the right first move if…",
  notFit: [
    "You don't sell products online — you need a service-business website instead.",
    "Your main bottleneck is internal workflow and admin — look at our automation lane.",
    "You want to dropship with zero involvement — we manage stores, not run businesses for you.",
  ],
  faqTitle: "E-commerce FAQs",
  faqs: [
    { question: "Do I need to give you access to my store?", answer: "Yes. We'll need staff or collaborator access to manage your store on your behalf. You stay the owner — we operate as your team." },
    { question: "What if I need a store built AND ongoing operations?", answer: "Start with the build. Once your store launches, we transition into a monthly operations retainer. Many clients do both." },
    { question: "What platforms do you support?", answer: "Shopify is primary. We also support WooCommerce, Amazon Seller Central, Etsy, and eBay. If you're on something else, let's talk." },
    { question: "Do you handle warehousing and shipping?", answer: "Not yet. We manage digital operations — listings, orders, customers, and reporting. If you need physical fulfillment, we can help you connect with a 3PL provider." },
  ],
  crossLinks: CROSS_LINKS.ecommerce,
  finalTitle: "Ready to stop doing everything yourself?",
  finalText:
    "Tell us what you need in a 2-minute intake. Build, run, or fix — we'll respond within 24 hours with a plan and pricing.",
  finalPrimaryCta: { label: "Start E-commerce Intake", href: "/ecommerce/intake" },
  finalSecondaryCta: { label: "See Full Pricing", href: "/pricing" },
};

export function getServicePageData(locale: string, id: ServiceId): ServiceData {
  const map = id === "websites" ? websitesData : id === "systems" ? systemsData : ecommerceData;
  const normalized = (locale === "fr" || locale === "es" ? locale : "en") as Locale;
  return (map[normalized] ?? map.en)!;
}
