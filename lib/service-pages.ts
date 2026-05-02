import type { ServicePageProps } from "@/components/service-page/ServicePage";

type Locale = "en" | "fr" | "es";
type ServiceId =
  | "websites"
  | "systems"
  | "ecommerce"
  | "custom_web_apps"
  | "client_portals"
  | "website_rescue"
  | "care_plans";

// ServiceData mirrors ServicePageProps. We translate by swapping locale-keyed
// objects under each ServiceId. /fr and /es fall back to the en entry if a
// locale's copy hasn't been authored yet — the page renders, just in English.
type ServiceData = ServicePageProps;

const CROSS_LINKS: Record<ServiceId, ServicePageProps["crossLinks"]> = {
  websites: [
    { id: "ecommerce", href: "/ecommerce" },
    { id: "systems", href: "/systems" },
    { id: "carePlans", href: "/care-plans" },
  ],
  systems: [
    { id: "websites", href: "/websites" },
    { id: "ecommerce", href: "/ecommerce" },
    { id: "carePlans", href: "/care-plans" },
  ],
  ecommerce: [
    { id: "websites", href: "/websites" },
    { id: "systems", href: "/systems" },
    { id: "carePlans", href: "/care-plans" },
  ],
  custom_web_apps: [
    { id: "websites", href: "/websites" },
    { id: "clientPortals", href: "/client-portals" },
    { id: "carePlans", href: "/care-plans" },
  ],
  client_portals: [
    { id: "customWebApps", href: "/custom-web-apps" },
    { id: "websites", href: "/websites" },
    { id: "carePlans", href: "/care-plans" },
  ],
  website_rescue: [
    { id: "websites", href: "/websites" },
    { id: "customWebApps", href: "/custom-web-apps" },
    { id: "carePlans", href: "/care-plans" },
  ],
  care_plans: [
    { id: "websites", href: "/websites" },
    { id: "systems", href: "/systems" },
    { id: "customWebApps", href: "/custom-web-apps" },
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

ecommerceData.fr = {
  eyebrow: "Services e-commerce",
  title: "Construisez votre boutique, réparez ce qui est cassé, ou laissez-nous tout gérer.",
  intro:
    "Que vous ayez besoin d'une nouvelle boutique en ligne construite de zéro, d'un paiement défectueux à corriger, ou de quelqu'un pour gérer vos opérations quotidiennes — nous proposons les trois. Choisissez le service qui correspond à là où vous en êtes maintenant.",
  heroStats: [
    "Construire · Gérer · Réparer",
    "Shopify, Amazon, Etsy, WooCommerce",
    "Opérations mensuelles à partir de 500 $/mois",
  ],
  primaryCta: { label: "Démarrer un intake e-commerce", href: "/ecommerce/intake" },
  secondaryCta: { label: "Voir les tarifs", href: "/pricing" },
  whoItsForTitle: "Idéal pour les vendeurs en ligne qui ont besoin de plus qu'une vitrine.",
  whoItsFor: [
    "Vous avez besoin d'une boutique mais vous ne savez pas par où commencer côté plateformes, paiements et expédition.",
    "Vous avez déjà une boutique mais vous passez tout votre temps en opérations au lieu de croître.",
    "Votre paiement perd des ventes et vous ne savez pas pourquoi les clients abandonnent leur panier.",
    "Vous voulez quelqu'un pour gérer les fiches produits, commandes, retours et service client pour pouvoir vous concentrer sur le produit.",
  ],
  problemsTitle: "Les vrais problèmes derrière la plupart des boutiques en difficulté.",
  problems: [
    "La boutique existe mais personne ne la gère vraiment — les fiches sont obsolètes, les commandes s'accumulent, les clients attendent.",
    "La friction au paiement tue les conversions — trop d'étapes, livraison floue, signaux de confiance manquants.",
    "L'après-achat est un désastre — pas de flux de confirmation de commande, pas de mises à jour d'expédition, pas de suivi.",
    "Vous faites tout à la main et ce n'est pas scalable au-delà de votre niveau actuel.",
  ],
  includesTitle: "Trois façons dont nous aidons",
  includes: [
    {
      title: "Construire — Nouvelle boutique de zéro",
      items: [
        "Configuration complète de boutique Shopify ou WooCommerce",
        "Pages produit, paiement, paiements et expédition configurés",
        "Design optimisé mobile avec flux d'e-mail post-achat",
      ],
    },
    {
      title: "Gérer — Gestion opérationnelle continue",
      items: [
        "Mises à jour des fiches produits et suivi des stocks",
        "Traitement des commandes, service client et retours",
        "Reporting de performance mensuel et optimisation",
      ],
    },
    {
      title: "Réparer — Audit et sprint d'optimisation",
      items: [
        "Audit complet du paiement et du taux de conversion",
        "5 à 10 correctifs ciblés mis en œuvre en 2 à 3 semaines",
        "Transition vers des opérations gérées après le sprint",
      ],
    },
  ],
  pricingTitle: "Tarifs clairs pour chaque type de service",
  pricingIntro:
    "Construire est un forfait projet ponctuel. Gérer est un abonnement mensuel. Réparer est un sprint ponctuel. Vous voyez le prix avant de vous engager.",
  pricingCards: [
    { label: "Construire une boutique", value: "À partir de 1 800 $", detail: "Forfait projet ponctuel. Boutiques basiques à partir de 1 800 $, standard à 2 500 $ - 3 500 $, premium à 4 000 $+." },
    { label: "Gérer votre boutique", value: "À partir de 500 $/mois", detail: "Abonnement mensuel. Starter 500 $/mois, Growth 1 000 $/mois, Scale 1 800 $/mois — selon le volume de commandes." },
    { label: "Réparer votre boutique", value: "1 200 $", detail: "Audit ponctuel + sprint de mise en œuvre. La plupart des clients passent ensuite à un abonnement mensuel." },
  ],
  processTitle: "Comment ça marche — quel que soit le service choisi",
  processIntro:
    "Chaque prestation commence de la même façon : dites-nous ce dont vous avez besoin, on chiffre, vous validez, on livre.",
  process: [
    { step: "01", title: "Dites-nous votre situation", detail: "Remplissez un intake de 2 minutes. Première question : avez-vous besoin d'une boutique construite, de quelqu'un pour gérer la vôtre, ou de quelque chose à réparer ?" },
    { step: "02", title: "Appel de planification + proposition", detail: "Nous examinons votre intake, planifions un appel et rédigeons une proposition avec tarifs, portée et calendrier." },
    { step: "03", title: "On livre", detail: "Les clients Construire reçoivent une boutique. Les clients Réparer reçoivent un audit + des correctifs. Les clients Gérer reçoivent des opérations continues dès le premier jour." },
    { step: "04", title: "Suivez tout dans votre espace", detail: "Chaque client reçoit un espace privé montrant l'état du projet, les tâches et — pour les clients opérations — la performance mensuelle." },
  ],
  bestFitTitle: "Commencez ici si votre boutique a besoin d'aide professionnelle.",
  bestFit: [
    "Vous avez besoin d'une boutique construite sur une plateforme solide avec paiement, paiements et expédition bien faits.",
    "Vous êtes noyé sous les commandes, retours et messages clients et vous avez besoin de quelqu'un pour prendre le relais.",
    "Le taux de conversion de votre boutique est mauvais et vous ne savez pas par où commencer pour le réparer.",
  ],
  notFitTitle: "Probablement pas le bon premier pas si…",
  notFit: [
    "Vous ne vendez pas de produits en ligne — vous avez besoin d'un site d'entreprise de services.",
    "Votre principal goulet est le workflow et l'admin internes — regardez notre axe automatisation.",
    "Vous voulez faire du dropshipping sans aucune implication — nous gérons des boutiques, nous ne dirigeons pas votre entreprise à votre place.",
  ],
  faqTitle: "FAQ e-commerce",
  faqs: [
    { question: "Dois-je vous donner accès à ma boutique ?", answer: "Oui. Nous aurons besoin d'un accès staff ou collaborateur pour gérer votre boutique en votre nom. Vous restez le propriétaire — nous opérons comme votre équipe." },
    { question: "Et si j'ai besoin d'une boutique construite ET d'opérations continues ?", answer: "Commencez par la construction. Une fois votre boutique lancée, nous passons à un abonnement mensuel d'opérations. Beaucoup de clients font les deux." },
    { question: "Quelles plateformes prenez-vous en charge ?", answer: "Shopify est la principale. Nous prenons aussi en charge WooCommerce, Amazon Seller Central, Etsy et eBay. Si vous êtes sur autre chose, parlons-en." },
    { question: "Gérez-vous l'entreposage et l'expédition ?", answer: "Pas encore. Nous gérons les opérations numériques — fiches, commandes, clients et reporting. Si vous avez besoin de logistique physique, nous pouvons vous aider à vous connecter à un prestataire 3PL." },
  ],
  crossLinks: CROSS_LINKS.ecommerce,
  finalTitle: "Prêt à arrêter de tout faire vous-même ?",
  finalText:
    "Dites-nous ce dont vous avez besoin dans un intake de 2 minutes. Construire, gérer ou réparer — nous répondons sous 24 heures avec un plan et des tarifs.",
  finalPrimaryCta: { label: "Démarrer un intake e-commerce", href: "/ecommerce/intake" },
  finalSecondaryCta: { label: "Voir les tarifs complets", href: "/pricing" },
};

ecommerceData.es = {
  eyebrow: "Servicios de e-commerce",
  title: "Construye tu tienda, arregla lo que está roto, o déjanos llevar todo.",
  intro:
    "Ya sea que necesites una nueva tienda en línea construida desde cero, un checkout roto arreglado, o alguien que se encargue de tus operaciones diarias — ofrecemos las tres. Elige el servicio que coincida con donde estás ahora.",
  heroStats: [
    "Construir · Llevar · Arreglar",
    "Shopify, Amazon, Etsy, WooCommerce",
    "Operaciones mensuales desde $500/mes",
  ],
  primaryCta: { label: "Iniciar intake de e-commerce", href: "/ecommerce/intake" },
  secondaryCta: { label: "Ver precios", href: "/pricing" },
  whoItsForTitle: "Ideal para vendedores en línea que necesitan más que una tienda.",
  whoItsFor: [
    "Necesitas una tienda construida pero no sabes por dónde empezar con plataformas, pagos y envíos.",
    "Ya tienes una tienda pero pasas todo tu tiempo en operaciones en lugar de crecer.",
    "Tu checkout pierde ventas y no sabes por qué los clientes abandonan el carrito.",
    "Quieres a alguien que gestione fichas, pedidos, devoluciones y atención al cliente para enfocarte en el producto.",
  ],
  problemsTitle: "Los problemas reales detrás de la mayoría de las tiendas que sufren.",
  problems: [
    "La tienda existe pero nadie la gestiona de verdad — las fichas están desactualizadas, los pedidos se acumulan, los clientes esperan.",
    "La fricción del checkout mata las conversiones — demasiados pasos, envío poco claro, señales de confianza ausentes.",
    "El post-compra es un desastre — sin flujo de confirmación de pedido, sin actualizaciones de envío, sin seguimiento.",
    "Haces todo manualmente y no es escalable más allá de donde estás ahora.",
  ],
  includesTitle: "Tres formas en que ayudamos",
  includes: [
    {
      title: "Construir — Tienda nueva desde cero",
      items: [
        "Configuración completa de tienda Shopify o WooCommerce",
        "Páginas de producto, checkout, pagos y envío configurados",
        "Diseño optimizado para móvil con flujo de correos post-compra",
      ],
    },
    {
      title: "Llevar — Gestión operativa continua",
      items: [
        "Actualizaciones de fichas y monitoreo de inventario",
        "Procesamiento de pedidos, atención al cliente y devoluciones",
        "Reporte mensual de desempeño y optimización",
      ],
    },
    {
      title: "Arreglar — Auditoría y sprint de optimización",
      items: [
        "Auditoría completa de checkout y tasa de conversión",
        "5 a 10 arreglos enfocados implementados en 2 a 3 semanas",
        "Transición a operaciones gestionadas después del sprint",
      ],
    },
  ],
  pricingTitle: "Precios claros para cada tipo de servicio",
  pricingIntro:
    "Construir es una tarifa única de proyecto. Llevar es un retainer mensual. Arreglar es un sprint único. Ves el precio antes de comprometerte.",
  pricingCards: [
    { label: "Construir una tienda", value: "Desde $1.800", detail: "Tarifa única de proyecto. Tiendas básicas desde $1.800, estándar $2.500 - $3.500, premium $4.000+." },
    { label: "Llevar tu tienda", value: "Desde $500/mes", detail: "Retainer mensual. Starter $500/mes, Growth $1.000/mes, Scale $1.800/mes — según volumen de pedidos." },
    { label: "Arreglar tu tienda", value: "$1.200", detail: "Auditoría única + sprint de implementación. La mayoría de clientes pasa después a un retainer mensual." },
  ],
  processTitle: "Cómo funciona — sin importar qué servicio elijas",
  processIntro:
    "Cada contratación empieza igual: cuéntanos qué necesitas, lo cotizamos, tú apruebas, entregamos.",
  process: [
    { step: "01", title: "Cuéntanos tu situación", detail: "Llena un intake de 2 minutos. La primera pregunta es: ¿necesitas una tienda construida, alguien que lleve la tuya, o algo arreglado?" },
    { step: "02", title: "Llamada de planificación + propuesta", detail: "Revisamos tu intake, agendamos una llamada y redactamos una propuesta con precios, alcance y plazos." },
    { step: "03", title: "Entregamos", detail: "Los clientes Construir reciben una tienda. Los clientes Arreglar reciben una auditoría + arreglos. Los clientes Llevar reciben operaciones continuas desde el primer día." },
    { step: "04", title: "Sigue todo en tu espacio", detail: "Cada cliente recibe un espacio privado que muestra el estado del proyecto, las tareas y — para clientes de operaciones — el desempeño mensual." },
  ],
  bestFitTitle: "Empieza aquí si tu tienda necesita ayuda profesional.",
  bestFit: [
    "Necesitas una tienda construida en una plataforma sólida con checkout, pagos y envío bien hechos.",
    "Estás ahogado en pedidos, devoluciones y mensajes de clientes y necesitas que alguien tome el control.",
    "La tasa de conversión de tu tienda es mala y no sabes qué arreglar primero.",
  ],
  notFitTitle: "Probablemente no sea el primer paso si…",
  notFit: [
    "No vendes productos en línea — necesitas un sitio de empresa de servicios.",
    "Tu mayor cuello de botella es el workflow y la administración interna — mira nuestra vía de automatización.",
    "Quieres hacer dropshipping sin involucrarte — gestionamos tiendas, no llevamos negocios por ti.",
  ],
  faqTitle: "FAQ de e-commerce",
  faqs: [
    { question: "¿Tengo que darte acceso a mi tienda?", answer: "Sí. Necesitaremos acceso de staff o colaborador para gestionar tu tienda en tu nombre. Tú sigues siendo el dueño — nosotros operamos como tu equipo." },
    { question: "¿Y si necesito una tienda construida Y operaciones continuas?", answer: "Empieza por la construcción. Una vez lanzada tu tienda, pasamos a un retainer mensual de operaciones. Muchos clientes hacen ambos." },
    { question: "¿Qué plataformas soportan?", answer: "Shopify es la principal. También soportamos WooCommerce, Amazon Seller Central, Etsy y eBay. Si estás en otra cosa, hablemos." },
    { question: "¿Manejan almacenamiento y envío?", answer: "Todavía no. Gestionamos operaciones digitales — fichas, pedidos, clientes y reporting. Si necesitas cumplimiento físico, podemos ayudarte a conectar con un proveedor 3PL." },
  ],
  crossLinks: CROSS_LINKS.ecommerce,
  finalTitle: "¿Listo para dejar de hacer todo tú mismo?",
  finalText:
    "Cuéntanos qué necesitas en un intake de 2 minutos. Construir, llevar o arreglar — responderemos dentro de 24 horas con un plan y precios.",
  finalPrimaryCta: { label: "Iniciar intake de e-commerce", href: "/ecommerce/intake" },
  finalSecondaryCta: { label: "Ver precios completos", href: "/pricing" },
};

// ─── Custom Web Apps ────────────────────────────────────────────────────────

const customWebAppsData: Partial<Record<Locale, ServiceData>> = {};

customWebAppsData.en = {
  eyebrow: "Custom web apps",
  title: "When a website isn't enough, we build the system that runs the business.",
  intro:
    "Dashboards, customer portals, internal tools, MVPs — built on the same foundation we use for our own products, with one workspace from scope to launch.",
  heroStats: [
    "Discovery sprint from $2,500",
    "MVP from $18K",
    "No template limits",
    "One workspace, start to finish",
  ],
  primaryCta: { label: "Plan a custom app", href: "/custom-app-intake" },
  secondaryCta: { label: "See the workspace", href: "/demos/portal" },
  whoItsForTitle: "Best for founders and operators who've outgrown off-the-shelf tools.",
  whoItsFor: [
    "You have a process that lives across spreadsheets, Notion, and a dozen browser tabs.",
    "You've validated a software idea and need someone to actually build it.",
    "You need a tool your customers will log into, not just a marketing site.",
    "Your team spends more time managing workarounds than serving customers.",
  ],
  problemsTitle: "Four signs you need a custom system, not another SaaS subscription.",
  problems: [
    "You've outgrown off-the-shelf SaaS but every contractor quote starts at $80K.",
    "You don't have a CTO, but you have real software needs.",
    "You've been burned by a freelancer who shipped half a product and disappeared.",
    "You're paying for five tools that still don't talk to each other.",
  ],
  includesTitle: "From scope to handoff — everything in one build.",
  includes: [
    {
      title: "Architecture and scope",
      items: [
        "Paid discovery sprint when needed",
        "System design and data model",
        "Scope lock with milestone plan",
        "Realistic budget bands before a dollar is committed",
      ],
    },
    {
      title: "Build",
      items: [
        "Next.js + Supabase by default",
        "Auth, role-based access, payments, integrations",
        "AI features as needed",
        "Milestone-based delivery with full workspace visibility",
      ],
    },
    {
      title: "Launch and ownership",
      items: [
        "Your code, your accounts, your domain",
        "Documented handoff — no black box",
        "Optional Care Pro retainer for ongoing work",
      ],
    },
  ],
  pricingTitle: "Priced to the scope, not to a template.",
  pricingIntro:
    "All Web Apps projects start with a 30-minute strategy call. Prices are ranges — final scope determines cost. Discovery sprint is optional for clear, well-defined scopes.",
  pricingCards: [
    {
      label: "Discovery sprint",
      value: "$2,500–$5,000",
      detail:
        "Paid scoping engagement before MVP commit. Results in a scope document, milestone plan, and budget bands.",
      meta: "Optional for clear scopes",
    },
    {
      label: "MVP",
      value: "$18,000–$35,000",
      detail:
        "First working version of a focused product. Validated scope, core workflows, one user role, deployment.",
      meta: "Most common starting point",
    },
    {
      label: "Standard build",
      value: "$35,000–$75,000",
      detail:
        "Full product with multiple user roles, admin panel, integrations, payments, documented handoff.",
      meta: "Scoped to your project",
    },
    {
      label: "Custom scope",
      value: "$75,000+",
      detail:
        "Multi-tenant SaaS, complex integrations, AI features, white-label systems, enterprise requirements.",
      meta: "Strategy call required",
    },
  ],
  processTitle: "How a custom app gets built.",
  processIntro:
    "Every project starts with a call, not a quote. We scope before we price so there are no surprises mid-build.",
  process: [
    {
      step: "01 — Discovery",
      title: "Define the system",
      detail:
        "Scope, user roles, data model, integration needs. Optional paid discovery sprint for complex scopes where figuring out what to build is itself the hard problem.",
    },
    {
      step: "02 — Build",
      title: "Milestone-based delivery",
      detail:
        "Build in your shared workspace with full visibility. You see every milestone as it ships. Scope changes go through a change-order process — no surprises.",
    },
    {
      step: "03 — Launch",
      title: "Handoff and ownership",
      detail:
        "Deployed on your accounts. Documented so any developer can understand the system. Optional Care Pro retainer if you want ongoing iteration.",
    },
  ],
  faqTitle: "Custom web app FAQ",
  faqs: [
    {
      question: "Do I have to start with a discovery sprint?",
      answer:
        "No — if your scope is well-defined, we can move straight to an MVP proposal. Discovery is for cases where figuring out what to build is itself the hard problem.",
    },
    {
      question: "What stack do you build on?",
      answer:
        "Next.js + Supabase by default: TypeScript, React, PostgreSQL, auth, file storage, and real-time built in. We adapt for specific requirements.",
    },
    {
      question: "How is this different from hiring a freelancer?",
      answer:
        "Structured process, documented handoff, milestone-based payments, and a shared workspace you have full access to throughout. No disappearing after launch.",
    },
  ],
  bestFitTitle: "Best fit for…",
  bestFit: [
    "Founders shipping their first software product",
    "Operators replacing manual processes with a real system",
    "Agencies needing white-label internal tools",
  ],
  notFitTitle: "Probably not the right call if…",
  notFit: [
    "An off-the-shelf tool already does it — we don't rebuild what HubSpot, Stripe, or Linear already build",
    "You need a $500 patch, not a new system",
    "You want to own zero code or documentation after delivery",
  ],
  crossLinks: CROSS_LINKS.custom_web_apps,
  finalTitle: "Ready to talk through your idea?",
  finalText:
    "The first call is free and takes 30 minutes. We'll tell you what the system is, what it isn't, and what a realistic scope looks like.",
  finalPrimaryCta: { label: "Plan a custom app", href: "/custom-app-intake" },
  finalSecondaryCta: { label: "See our work", href: "/work" },
};

// ─── Client Portals ──────────────────────────────────────────────────────────

const clientPortalsData: Partial<Record<Locale, ServiceData>> = {};

clientPortalsData.en = {
  eyebrow: "Client portals",
  title: "A private workspace your customers actually use.",
  intro:
    "Track scope, share files, send messages, sign off on milestones, view invoices — all in one place that feels like your studio, not a shared Drive folder.",
  heroStats: [
    "Branded to your business",
    "Your code, your data",
    "No per-seat pricing",
    "Works for any service type",
  ],
  primaryCta: { label: "See the demo", href: "/demos/portal" },
  secondaryCta: { label: "Start a portal project", href: "/build/intro?projectType=web_app" },
  whoItsForTitle: "Best for service businesses running multi-week client engagements.",
  whoItsFor: [
    "Your client communication lives in scattered email threads and you can't find anything.",
    "You've been embarrassed by a client asking for 'the latest version' of something you've sent four times.",
    "Your customers expect a real product experience, not a Google Drive folder.",
  ],
  problemsTitle: "Why client communication breaks down.",
  problems: [
    "Email threads lose attachments, history, and context — every time.",
    '"Where are we in the project?" should never need to be asked.',
    "Your competitors' portals look like real software; yours looks like a shared folder.",
    "Manual invoice and agreement tracking is its own part-time job.",
  ],
  includesTitle: "A complete client workspace, owned by you.",
  includes: [
    {
      title: "Branded workspace",
      items: [
        "Your logo, colors, and domain or subdomain",
        "Custom project name and identity",
        "Client-facing URL that's yours",
      ],
    },
    {
      title: "Project lifecycle",
      items: [
        "Milestones with status tracking",
        "Asset uploads and revision requests",
        "Two-way messaging and activity feed",
      ],
    },
    {
      title: "Money built in",
      items: [
        "Agreements and digital sign-off",
        "Deposit and milestone invoices",
        "Retainer billing with audit trail",
      ],
    },
    {
      title: "Owned by you",
      items: [
        "Code, data, and customers stay yours",
        "No per-seat pricing, no vendor lock-in",
        "Self-hostable on your own infrastructure",
      ],
    },
  ],
  pricingTitle: "Portal as an add-on or a standalone system.",
  pricingIntro:
    "Portals can be added to a website build or scoped as their own product. Pricing depends on scope and existing stack.",
  pricingCards: [
    {
      label: "Portal add-on",
      value: "Scoped to project",
      detail:
        "Added to a Growth or Premium website build. Client login, milestones, messaging, file sharing.",
      meta: "Most common starting point",
    },
    {
      label: "Standalone system",
      value: "From $12,000",
      detail:
        "Portal as its own product for service businesses. Multi-client, branded workspace, invoicing.",
      meta: "Scoped to your project",
    },
    {
      label: "Custom build",
      value: "Scoped to project",
      detail:
        "Multi-tenant, custom integrations, white-label. Requires a strategy call to scope.",
      meta: "Strategy call required",
    },
  ],
  processTitle: "How a portal gets built.",
  processIntro: "Define the workflow first, then build to it.",
  process: [
    {
      step: "01 — Scoping",
      title: "Define your workflow",
      detail:
        "Which milestones, what files, how payments flow. Fit as add-on to an existing site or scoped as a standalone product.",
    },
    {
      step: "02 — Build",
      title: "Branded from day one",
      detail:
        "Built to your process and branded to your business. You and a test client can see it live before full launch.",
    },
    {
      step: "03 — Launch",
      title: "Go live with real clients",
      detail:
        "You own the code and the customer relationships. Optional Care Pro retainer for ongoing portal improvements.",
    },
  ],
  faqTitle: "Client portal FAQ",
  faqs: [
    {
      question: "Can I add a portal to my existing website?",
      answer:
        "Yes. Portals can be added as a standalone product or integrated with an existing site. We scope based on what you already have.",
    },
    {
      question: "Can my clients use it from their phone?",
      answer:
        "Yes — the portal is fully responsive. Clients can view milestones, upload files, and send messages from any device.",
    },
    {
      question: "What happens to my client data if I stop using it?",
      answer:
        "You own it — it's in your database on your Supabase account. Export any time, full control, no lock-in.",
    },
  ],
  bestFitTitle: "Best fit for…",
  bestFit: [
    "Agencies, contractors, consultants running multi-week engagements",
    "Repair businesses, event vendors, coaches with recurring clients",
    "Anyone who sends more than two email threads per project to the same client",
  ],
  notFitTitle: "Probably not the right call if…",
  notFit: [
    "One-off transactions with nothing to track between purchase and delivery",
    "B2C businesses where customers never need to log in",
  ],
  crossLinks: CROSS_LINKS.client_portals,
  finalTitle: "See what your clients would actually use.",
  finalText:
    "The demo is seeded with realistic project data. Browse the milestones, check the messaging, and see if it fits your workflow.",
  finalPrimaryCta: { label: "See the demo", href: "/demos/portal" },
  finalSecondaryCta: { label: "Start a portal project", href: "/build/intro?projectType=web_app" },
};

// ─── Website Rescue ──────────────────────────────────────────────────────────

const websiteRescueData: Partial<Record<Locale, ServiceData>> = {};

websiteRescueData.en = {
  eyebrow: "Website rescue",
  title: "You don't need a rebuild. You need someone to fix what's actually broken.",
  intro:
    "A 1–2 week sprint that audits, prioritizes, and ships the changes that move the needle — without throwing away the site you have.",
  heroStats: [
    "Audit from $1,000",
    "Sprint from $3,500",
    "1–2 wk turnaround",
    "No full rebuild required",
  ],
  primaryCta: { label: "Start a rescue", href: "/build/intro" },
  secondaryCta: { label: "See pricing", href: "/pricing#rescue" },
  projectType: "rescue",
  whoItsForTitle: "Best for businesses with a site that works but leaks.",
  whoItsFor: [
    "Your site loads slow, breaks on phones, or doesn't convert — and you know it.",
    "You can't justify a full rebuild but you can't keep the site as-is.",
    "You inherited the site from someone who's gone and nobody owns the fixes.",
  ],
  problemsTitle: "Four signs your site needs a rescue, not a rebuild.",
  problems: [
    "Your site is built on something brittle — old WordPress, a dead template, a freelancer's hosting account.",
    "You can list five things wrong with it but nobody's prioritizing them.",
    "Mobile traffic bounces because the experience is broken.",
    "You don't know what's working and what isn't — no baseline, no analytics.",
  ],
  includesTitle: "Audit, prioritize, ship.",
  includes: [
    {
      title: "Audit",
      items: [
        "Speed and core web vitals",
        "Mobile experience",
        "SEO and metadata",
        "Conversion and trust signals",
        "Written report with prioritized findings",
      ],
    },
    {
      title: "Fix sprint",
      items: [
        "1–2 week implementation of top-ranked fixes",
        "Fixed scope agreed before work starts",
        "Clear before/after on every change",
      ],
    },
    {
      title: "Optional next step",
      items: [
        "Documented changes and reasoning",
        "Full rebuild quote if the audit warrants it",
        "Handoff notes for whoever maintains the site next",
      ],
    },
  ],
  pricingTitle: "Two phases. Fixed scope on both.",
  pricingIntro:
    "The audit gives you the roadmap. The sprint ships the highest-impact changes. No surprises — scope is agreed before any work starts.",
  pricingCards: [
    {
      label: "Audit",
      value: "$1,000–$1,500",
      detail:
        "Written report: speed, mobile, SEO, conversion, trust signals. Prioritized fix list ranked by impact and effort.",
      meta: "Fixed-range deliverable",
    },
    {
      label: "Sprint",
      value: "$3,500–$6,500",
      detail:
        "1–2 week implementation of the highest-impact changes from the audit. Full scope agreed before work starts.",
      meta: "Most common starting point",
    },
    {
      label: "Audit + Sprint",
      value: "From $4,500",
      detail:
        "Both phases scoped together. One kickoff, one scope agreement — best if you already know the site needs work.",
      meta: "Best value",
    },
  ],
  processTitle: "How a rescue works.",
  processIntro: "You know what's wrong. We'll find out exactly how wrong — and fix the things that matter.",
  process: [
    {
      step: "01 — Audit",
      title: "1–2 day review",
      detail:
        "Speed, mobile, SEO, conversion, trust signals. Written report with a prioritized fix list ranked by impact.",
    },
    {
      step: "02 — Sprint plan",
      title: "Agree the scope",
      detail:
        "Review the findings together. Agree on what to fix, in what order, for what budget. Fixed scope, no surprises.",
    },
    {
      step: "03 — Sprint",
      title: "Ship the fixes",
      detail:
        "1–2 week implementation. You see every change. Documented before/after on each fix.",
    },
  ],
  faqTitle: "Website rescue FAQ",
  faqs: [
    {
      question: "How is this different from just hiring someone to fix a bug?",
      answer:
        "A rescue starts with a written audit — you know exactly what's wrong and what the priority order is, before a dollar is spent on fixes. No guessing, no scope creep.",
    },
    {
      question: "What if the audit shows we need a full rebuild?",
      answer:
        "We'll tell you honestly. If a rebuild is the right call, you get a detailed proposal based on the audit findings — not a guess quote.",
    },
    {
      question: "What platforms do you rescue?",
      answer:
        "WordPress, Webflow, Squarespace, Wix, legacy custom builds. We can't rescue sites locked inside proprietary enterprise CMSs we can't access.",
    },
  ],
  bestFitTitle: "Best fit for…",
  bestFit: [
    "Small businesses with a site that's fine but slow, fine but broken on phones, fine but not converting",
    "Founders who inherited a site from a previous developer",
    "Businesses that haven't touched their site in 2+ years",
  ],
  notFitTitle: "Probably not the right call if…",
  notFit: [
    "Brand-new businesses without a site yet — start with the Websites lane",
    "Sites on enterprise CMSs or platforms we can't access",
    "Businesses that want unlimited changes with no fixed scope",
  ],
  crossLinks: CROSS_LINKS.website_rescue,
  finalTitle: "Know what's wrong before you spend a dollar on fixes.",
  finalText:
    "The audit alone gives you a prioritized roadmap. Even if you don't do the sprint, you walk away knowing exactly what to fix and in what order.",
  finalPrimaryCta: { label: "Start a rescue", href: "/build/intro" },
  finalSecondaryCta: { label: "See pricing", href: "/pricing#rescue" },
};

// ─── Care Plans ──────────────────────────────────────────────────────────────

const carePlansData: Partial<Record<Locale, ServiceData>> = {};

carePlansData.en = {
  eyebrow: "Care plans",
  title: "Keep the system healthy after launch.",
  intro:
    "Three monthly plans that cover updates, monitoring, small features, and improvement work — so your site keeps earning instead of slowly drifting.",
  heroStats: [
    "Plans from $400/mo",
    "No per-task invoices",
    "Priority response on Care Pro",
    "Cancel with 30 days notice",
  ],
  primaryCta: { label: "Start a care plan", href: "/contact?type=care" },
  secondaryCta: { label: "See the workspace", href: "/demos/portal" },
  whoItsForTitle: "Best for post-launch clients who want ongoing improvement.",
  whoItsFor: [
    "You launched a site or system with us and want it to keep getting better.",
    "You don't have a developer in-house and don't want to.",
    "You'd rather pay a predictable monthly than invoice for every small change.",
  ],
  problemsTitle: "What happens when a site has no one looking after it.",
  problems: [
    "Your site hasn't been touched since launch and is slowly drifting out of date.",
    "Small changes take weeks because there's no one in the loop.",
    "You pay invoice-per-task and the costs are unpredictable.",
    "You find out about broken things from clients, not monitoring.",
  ],
  includesTitle: "What each plan covers.",
  includes: [
    {
      title: "Care — $400/mo",
      items: [
        "Content updates and text changes",
        "Monthly health check",
        "Uptime and performance monitoring",
        "24-hour response SLA",
      ],
    },
    {
      title: "Care+ — $850/mo",
      items: [
        "Everything in Care",
        "Small feature additions",
        "Analytics review and recommendations",
        "12-hour response SLA",
      ],
    },
    {
      title: "Care Pro — $2,250/mo",
      items: [
        "Everything in Care+",
        "Monthly improvement sprint",
        "Monthly 30-min strategy call",
        "4-hour priority response SLA",
      ],
    },
  ],
  pricingTitle: "Three tiers. One consistent rhythm.",
  pricingIntro:
    "All plans billed monthly. Upgrade or downgrade any time. Cancel with 30 days notice. First month pro-rated to your billing cycle.",
  pricingCards: [
    {
      label: "Care",
      value: "$400/mo",
      detail:
        "Content updates, monthly health check, uptime monitoring, basic support. 24-hour response.",
      meta: "Fixed monthly",
    },
    {
      label: "Care+",
      value: "$850/mo",
      detail:
        "Everything in Care plus small feature additions, analytics review, and light refinements. 12-hour response.",
      meta: "Most popular plan",
    },
    {
      label: "Care Pro",
      value: "$2,250/mo",
      detail:
        "Monthly improvement sprint, 30-min strategy call, and 4-hour priority response SLA.",
      meta: "Fixed monthly",
    },
  ],
  processTitle: "How care plans work.",
  processIntro: "A predictable rhythm so your site stays sharp without you managing a developer.",
  process: [
    {
      step: "01 — Onboarding",
      title: "Align on scope",
      detail:
        "We review your stack, set up monitoring, and align on what 'content update' and 'small feature' mean for your specific system.",
    },
    {
      step: "02 — Monthly rhythm",
      title: "Submit, prioritize, ship",
      detail:
        "You submit requests through the workspace. We prioritize, deliver, and document every change in your project log.",
    },
    {
      step: "03 — Review",
      title: "See the log",
      detail:
        "Monthly check-in on Care Pro. Quarterly summary on Care and Care+. Every change documented so you know exactly what was touched.",
    },
  ],
  faqTitle: "Care plan FAQ",
  faqs: [
    {
      question: "Does the site have to have been built by CrecyStudio?",
      answer:
        "Care and Care+ are open to any well-built site. Care Pro requires familiarity with the codebase — for non-CrecyStudio builds we may need a 2-week onboarding sprint first.",
    },
    {
      question: "What counts as a 'small feature'?",
      answer:
        "Anything that takes under 4 hours: a new form field, a new section, an extra pricing row, a simple page. Anything larger gets scoped and quoted separately.",
    },
    {
      question: "How is this different from the Automation lane's Systems Partner retainer?",
      answer:
        "Systems Partner ($500–$1,250/mo) covers automation-maintenance-only for clients whose main engagement was an Automation build. Care plans cover any project type — site, portal, or custom app — with broader improvement scope.",
    },
  ],
  bestFitTitle: "Best fit for…",
  bestFit: [
    "Post-launch website clients who want ongoing improvement",
    "Custom-app clients with regular iteration needs",
    "Businesses that don't want to manage a developer relationship per-task",
  ],
  notFitTitle: "Probably not the right call if…",
  notFit: [
    "You want unlimited dev hours included",
    "You're launching with no defined ongoing need yet — start a project first",
    "You're on a platform we can't access or modify",
  ],
  crossLinks: CROSS_LINKS.care_plans,
  finalTitle: "Start with the plan that fits right now.",
  finalText:
    "You can upgrade or downgrade any time. Most clients start on Care or Care+ and move to Care Pro once they see the cadence.",
  finalPrimaryCta: { label: "Start a care plan", href: "/contact?type=care" },
  finalSecondaryCta: { label: "See the workspace", href: "/demos/portal" },
};

export function getServicePageData(locale: string, id: ServiceId): ServiceData {
  const dataMap: Record<ServiceId, Partial<Record<Locale, ServiceData>>> = {
    websites: websitesData,
    systems: systemsData,
    ecommerce: ecommerceData,
    custom_web_apps: customWebAppsData,
    client_portals: clientPortalsData,
    website_rescue: websiteRescueData,
    care_plans: carePlansData,
  };
  const map = dataMap[id];
  const normalized = (locale === "fr" || locale === "es" ? locale : "en") as Locale;
  return (map[normalized] ?? map.en)!;
}
