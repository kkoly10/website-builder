// Centralized translatable strings for customer-facing emails.
// Admin emails are intentionally English-only — admin is internal.
//
// Conventions:
//   - {{var}} placeholders are interpolated by `t()`. The value is
//     substituted as-is, so callers must pre-escape HTML/user input
//     before passing it in.
//   - When adding a new email, add its key here first, then reference
//     it from the template. The dictionary is the source of truth.

export type EmailLocale = "en" | "fr" | "es";

const VALID_LOCALES: ReadonlyArray<EmailLocale> = ["en", "fr", "es"];

export function normalizeEmailLocale(input: unknown): EmailLocale {
  const code = String(input ?? "").toLowerCase().slice(0, 2);
  return (VALID_LOCALES as ReadonlyArray<string>).includes(code)
    ? (code as EmailLocale)
    : "en";
}

type LocalizedString = Record<EmailLocale, string>;

const STRINGS: Record<string, LocalizedString> = {
  // ─── Shared scaffolding ───────────────────────────────────────
  "common.greeting": {
    en: "Hi {{name}},",
    fr: "Bonjour {{name}},",
    es: "Hola {{name}},",
  },
  // Use when no name is available — premium brands never address a
  // client as "Hi there," or "Bonjour vous,".
  "common.greeting_anon": {
    en: "Hi,",
    fr: "Bonjour,",
    es: "Hola,",
  },
  "common.signature.role": {
    en: "Founder, CrecyStudio",
    fr: "Fondateur, CrecyStudio",
    es: "Fundador, CrecyStudio",
  },
  "common.footer.reply_note": {
    en: "Reply to this email to reach Komlan directly.",
    fr: "Répondez à cet e-mail pour joindre Komlan directement.",
    es: "Responda a este correo para contactar a Komlan directamente.",
  },
  "common.footer.unsubscribe": {
    en: "Update your preferences",
    fr: "Modifier vos préférences",
    es: "Actualizar tus preferencias",
  },

  // ─── agreement_published ──────────────────────────────────────
  "agreement_published.subject": {
    en: "Your {{lane}} agreement is ready to sign — CrecyStudio",
    fr: "Votre contrat de {{lane}} est prêt à signer — CrecyStudio",
    es: "Su contrato de {{lane}} está listo para firmar — CrecyStudio",
  },
  "agreement_published.preheader": {
    en: "Your {{lane}} agreement is ready — review and sign in your workspace.",
    fr: "Votre contrat de {{lane}} est prêt — consultez-le et signez dans votre espace.",
    es: "Su contrato de {{lane}} está listo — revíselo y fírmelo en su espacio.",
  },
  "agreement_published.headline": {
    en: "Your agreement is ready to sign.",
    fr: "Votre contrat est prêt à signer.",
    es: "Su contrato está listo para firmar.",
  },
  "agreement_published.eyebrow": {
    en: "{{lane}} agreement · {{shortId}}",
    fr: "Contrat de {{lane}} · {{shortId}}",
    es: "Contrato de {{lane}} · {{shortId}}",
  },
  "agreement_published.body_with_terms": {
    en: "The agreement covering scope, timeline, deliverables, and payment terms (<strong>{{terms}}</strong>) is ready in your workspace. Once signed, the project kicks off.",
    fr: "Le contrat couvrant la portée, le calendrier, les livrables et les conditions de paiement (<strong>{{terms}}</strong>) est dans votre espace. Une fois signé, le projet démarre.",
    es: "El contrato que cubre el alcance, el calendario, los entregables y las condiciones de pago (<strong>{{terms}}</strong>) está en su espacio. Una vez firmado, el proyecto comienza.",
  },
  "agreement_published.body_no_terms": {
    en: "The agreement covering scope, timeline, deliverables, and payment terms is ready in your workspace. Once signed, the project kicks off.",
    fr: "Le contrat couvrant la portée, le calendrier, les livrables et les conditions de paiement est dans votre espace. Une fois signé, le projet démarre.",
    es: "El contrato que cubre el alcance, el calendario, los entregables y las condiciones de pago está en su espacio. Una vez firmado, el proyecto comienza.",
  },
  "agreement_published.body_review": {
    en: "It's worth a careful read. If anything in it doesn't match the conversations we've had, flag it before signing.",
    fr: "Il mérite une lecture attentive. Si quelque chose ne correspond pas à nos échanges, signalez-le avant de signer.",
    es: "Vale la pena leerlo con atención. Si algo no coincide con lo conversado, indíquelo antes de firmar.",
  },
  "agreement_published.cta": {
    en: "Review agreement",
    fr: "Consulter le contrat",
    es: "Revisar el contrato",
  },
  "agreement_published.fineprint": {
    en: "Reply with questions before you sign.",
    fr: "Répondez avec vos questions avant de signer.",
    es: "Responda con sus preguntas antes de firmar.",
  },

  // ─── preview_ready ────────────────────────────────────────────
  "preview_ready.subject": {
    en: "Your {{lane}} preview is ready — CrecyStudio",
    fr: "L'aperçu de votre {{lane}} est prêt — CrecyStudio",
    es: "La vista previa de su {{lane}} está lista — CrecyStudio",
  },
  "preview_ready.preheader": {
    en: "Your {{lane}} preview is ready — open your workspace to review it.",
    fr: "L'aperçu de votre {{lane}} est prêt — ouvrez votre espace pour le consulter.",
    es: "La vista previa de su {{lane}} está lista — abra su espacio para revisarla.",
  },
  "preview_ready.headline": {
    en: "Your preview is live.",
    fr: "Votre aperçu est en ligne.",
    es: "Su vista previa está en línea.",
  },
  "preview_ready.eyebrow": {
    en: "Preview ready for review",
    fr: "Aperçu prêt à consulter",
    es: "Vista previa lista para revisar",
  },
  "preview_ready.body": {
    en: "A new preview of your {{lane}} is ready. Open your workspace to review it and leave feedback in one batch — that keeps revisions clean and the project moving.",
    fr: "Un nouvel aperçu de votre {{lane}} est prêt. Ouvrez votre espace pour le consulter et laisser vos retours en une fois — cela garde les révisions claires et le projet en mouvement.",
    es: "Una nueva vista previa de su {{lane}} está lista. Abra su espacio para revisarla y dejar comentarios de una sola vez — eso mantiene las revisiones claras y el proyecto avanzando.",
  },
  "preview_ready.cta": {
    en: "Open preview",
    fr: "Ouvrir l'aperçu",
    es: "Abrir la vista previa",
  },
  "preview_ready.howto_label": {
    en: "How to review",
    fr: "Comment consulter",
    es: "Cómo revisar",
  },
  "preview_ready.howto_1": {
    en: "→ Open the preview link in your workspace",
    fr: "→ Ouvrez le lien d'aperçu dans votre espace",
    es: "→ Abra el enlace de vista previa en su espacio",
  },
  "preview_ready.howto_2": {
    en: "→ Leave notes on anything you'd like changed",
    fr: "→ Laissez vos notes sur ce que vous souhaitez modifier",
    es: "→ Deje notas sobre cualquier cambio que desee",
  },
  "preview_ready.howto_3": {
    en: "→ Submit feedback as one batch — Komlan responds within 24 hours",
    fr: "→ Envoyez vos retours en une fois — Komlan répond sous 24 heures",
    es: "→ Envíe los comentarios de una sola vez — Komlan responde en 24 horas",
  },

  // ─── launch_ready ─────────────────────────────────────────────
  "launch_ready.subject": {
    en: "Your website is ready to launch — CrecyStudio",
    fr: "Votre site est prêt à être lancé — CrecyStudio",
    es: "Su sitio está listo para lanzarse — CrecyStudio",
  },
  "launch_ready.preheader": {
    en: "Everything is ready — give the word and your site goes live.",
    fr: "Tout est prêt — donnez le feu vert et votre site sera en ligne.",
    es: "Todo está listo — dé la palabra y su sitio estará en línea.",
  },
  "launch_ready.headline": {
    en: "Ready to go live.",
    fr: "Prêt à passer en ligne.",
    es: "Listo para entrar en línea.",
  },
  "launch_ready.eyebrow": {
    en: "Launch checklist complete",
    fr: "Liste de lancement complète",
    es: "Lista de lanzamiento completa",
  },
  "launch_ready.body": {
    en: "Every item on the launch checklist is signed off — domain, forms, analytics, SEO, handoff. Your site goes live whenever you give the word.",
    fr: "Chaque élément de la liste de lancement est validé — domaine, formulaires, analyses, SEO, remise. Votre site sera mis en ligne dès que vous le souhaitez.",
    es: "Cada elemento de la lista de lanzamiento está aprobado — dominio, formularios, analítica, SEO, entrega. Su sitio se publicará cuando lo decida.",
  },
  "launch_ready.cta": {
    en: "Approve launch",
    fr: "Valider le lancement",
    es: "Aprobar el lanzamiento",
  },
  "launch_ready.fineprint": {
    en: "Click the button to confirm, or reply if you want one more pass before going live.",
    fr: "Cliquez sur le bouton pour confirmer, ou répondez si vous souhaitez une révision supplémentaire.",
    es: "Haga clic en el botón para confirmar, o responda si desea una revisión más antes de publicar.",
  },

  // ─── site_live ────────────────────────────────────────────────
  "site_live.subject": {
    en: "Your {{lane}} is live — CrecyStudio",
    fr: "Votre {{lane}} est en ligne — CrecyStudio",
    es: "Su {{lane}} está en línea — CrecyStudio",
  },
  "site_live.preheader": {
    en: "Your {{lane}} is now live. Handoff and ongoing-support options are in your workspace.",
    fr: "Votre {{lane}} est en ligne. La remise et les options de support continu sont dans votre espace.",
    es: "Su {{lane}} está en línea. La entrega y las opciones de soporte continuo están en su espacio.",
  },
  "site_live.headline": {
    en: "Your {{lane}} is live.",
    fr: "Votre {{lane}} est en ligne.",
    es: "Su {{lane}} está en línea.",
  },
  "site_live.eyebrow": {
    en: "Project launched",
    fr: "Projet lancé",
    es: "Proyecto lanzado",
  },
  "site_live.body_live_at": {
    en: "Your {{lane}} is live at <a href=\"{{url}}\" style=\"color:#111111;font-weight:600;text-decoration:underline\">{{url}}</a>. The full handoff — admin credentials, analytics access, and post-launch documentation — is waiting in your workspace.",
    fr: "Votre {{lane}} est en ligne à <a href=\"{{url}}\" style=\"color:#111111;font-weight:600;text-decoration:underline\">{{url}}</a>. La remise complète — identifiants d'administration, accès aux analyses et documentation post-lancement — vous attend dans votre espace.",
    es: "Su {{lane}} está en línea en <a href=\"{{url}}\" style=\"color:#111111;font-weight:600;text-decoration:underline\">{{url}}</a>. La entrega completa — credenciales de administración, acceso a analítica y documentación post-lanzamiento — le espera en su espacio.",
  },
  "site_live.body_live_generic": {
    en: "Your {{lane}} is shipped and indexed. The full handoff — admin credentials, analytics access, and post-launch documentation — is waiting in your workspace.",
    fr: "Votre {{lane}} est livré et indexé. La remise complète — identifiants d'administration, accès aux analyses et documentation post-lancement — vous attend dans votre espace.",
    es: "Su {{lane}} está entregado e indexado. La entrega completa — credenciales de administración, acceso a analítica y documentación post-lanzamiento — le espera en su espacio.",
  },
  "site_live.body_website_care": {
    en: "A live website is a starting line, not a finish line. The next 90 days are where real conversions happen — small copy and design tweaks, content updates, performance tuning. If you'd rather not handle that yourself, our Care Plans start at $199/mo and keep the site working harder for you each month.",
    fr: "Un site en ligne est un point de départ, pas une ligne d'arrivée. Les 90 prochains jours sont décisifs — petites retouches de texte et de design, mises à jour de contenu, optimisation des performances. Si vous préférez ne pas vous en occuper, nos forfaits Care commencent à 199 $/mois et font travailler votre site un peu plus chaque mois.",
    es: "Un sitio en línea es un punto de partida, no una meta. Los próximos 90 días son decisivos — pequeños ajustes de texto y diseño, actualizaciones de contenido, optimización de rendimiento. Si prefiere no encargarse, nuestros planes Care comienzan en 199 $/mes y hacen que su sitio rinda más cada mes.",
  },
  "site_live.body_app_care": {
    en: "Launching is the easy part — the next 90 days are where real usage shapes the product. If you want ongoing engineering and tuning rather than every change becoming a new project, ask about our retainer arrangements.",
    fr: "Lancer est la partie facile — les 90 prochains jours, c'est l'usage réel qui façonne le produit. Si vous voulez un développement et un réglage continus plutôt que de transformer chaque changement en nouveau projet, demandez nos formules en régie.",
    es: "Lanzar es la parte fácil — los próximos 90 días son cuando el uso real moldea el producto. Si desea ingeniería y ajustes continuos en vez de convertir cada cambio en un nuevo proyecto, pregunte por nuestros acuerdos de retención.",
  },
  "site_live.cta": {
    en: "Open handoff",
    fr: "Ouvrir la remise",
    es: "Abrir la entrega",
  },
  "site_live.fineprint": {
    en: "It was a real pleasure building this with you. Reply anytime — for support, updates, or just to share how the launch goes.",
    fr: "Cela a été un vrai plaisir de construire ce projet avec vous. Répondez à tout moment — pour le support, des mises à jour, ou simplement pour partager le lancement.",
    es: "Fue un verdadero placer construir esto con usted. Responda cuando quiera — para soporte, actualizaciones, o simplemente para contar cómo va el lanzamiento.",
  },

  // ─── deposit_received (NEW) ───────────────────────────────────
  "deposit_received.subject": {
    en: "Deposit received — kickoff begins now",
    fr: "Acompte reçu — le projet démarre",
    es: "Depósito recibido — comienza el proyecto",
  },
  "deposit_received.preheader": {
    en: "Your deposit is in. Here's what happens next.",
    fr: "Votre acompte est bien reçu. Voici la suite.",
    es: "Su depósito está recibido. Esto es lo que sigue.",
  },
  "deposit_received.headline": {
    en: "Deposit received.",
    fr: "Acompte reçu.",
    es: "Depósito recibido.",
  },
  "deposit_received.eyebrow": {
    en: "Kickoff confirmed",
    fr: "Lancement confirmé",
    es: "Inicio confirmado",
  },
  "deposit_received.body_intro": {
    en: "Your deposit of {{amount}} is recorded. The project is officially underway.",
    fr: "Votre acompte de {{amount}} est enregistré. Le projet est officiellement lancé.",
    es: "Su depósito de {{amount}} está registrado. El proyecto está oficialmente en marcha.",
  },
  "deposit_received.body_intro_no_amount": {
    en: "Your deposit is recorded. The project is officially underway.",
    fr: "Votre acompte est enregistré. Le projet est officiellement lancé.",
    es: "Su depósito está registrado. El proyecto está oficialmente en marcha.",
  },
  "deposit_received.next_label": {
    en: "What happens in the next 48 hours",
    fr: "Ce qui se passe dans les 48 heures",
    es: "Lo que ocurre en las próximas 48 horas",
  },
  "deposit_received.next_1": {
    en: "→ Komlan reviews scope and confirms the kickoff brief",
    fr: "→ Komlan revoit la portée et confirme le brief de lancement",
    es: "→ Komlan revisa el alcance y confirma el brief inicial",
  },
  "deposit_received.next_2": {
    en: "→ Your workspace opens for content and asset uploads",
    fr: "→ Votre espace s'ouvre pour le téléversement de contenu et de visuels",
    es: "→ Su espacio se abre para subir contenido y recursos",
  },
  "deposit_received.next_3": {
    en: "→ First design direction lands inside one week",
    fr: "→ La première direction de design arrive en moins d'une semaine",
    es: "→ La primera dirección de diseño llega en menos de una semana",
  },
  "deposit_received.cta": {
    en: "Open your workspace",
    fr: "Ouvrir votre espace",
    es: "Abrir su espacio",
  },

  // ─── invoice_paid_receipt (NEW) ───────────────────────────────
  "invoice_paid_receipt.subject": {
    en: "Receipt: {{amount}} received — CrecyStudio",
    fr: "Reçu : {{amount}} reçus — CrecyStudio",
    es: "Recibo: {{amount}} recibidos — CrecyStudio",
  },
  "invoice_paid_receipt.preheader": {
    en: "Payment of {{amount}} received. Receipt enclosed.",
    fr: "Paiement de {{amount}} bien reçu. Reçu inclus.",
    es: "Pago de {{amount}} recibido. Recibo incluido.",
  },
  "invoice_paid_receipt.headline": {
    en: "Payment received.",
    fr: "Paiement reçu.",
    es: "Pago recibido.",
  },
  "invoice_paid_receipt.eyebrow": {
    en: "{{type}} receipt",
    fr: "Reçu de {{type}}",
    es: "Recibo de {{type}}",
  },
  "invoice_paid_receipt.body": {
    en: "Thank you. Your payment of <strong>{{amount}}</strong> was received on {{date}}. Keep this email for your records — a full invoice history is always available in your workspace.",
    fr: "Merci. Votre paiement de <strong>{{amount}}</strong> a été reçu le {{date}}. Conservez cet e-mail — un historique complet des factures est toujours disponible dans votre espace.",
    es: "Gracias. Su pago de <strong>{{amount}}</strong> fue recibido el {{date}}. Conserve este correo — el historial completo de facturas siempre está disponible en su espacio.",
  },
  "invoice_paid_receipt.cta": {
    en: "View invoice history",
    fr: "Voir l'historique des factures",
    es: "Ver el historial de facturas",
  },
  "invoice_paid_receipt.row_amount": { en: "Amount", fr: "Montant", es: "Monto" },
  "invoice_paid_receipt.row_type": { en: "Type", fr: "Type", es: "Tipo" },
  "invoice_paid_receipt.row_date": { en: "Paid on", fr: "Payé le", es: "Pagado el" },
  "invoice_paid_receipt.row_reference": { en: "Reference", fr: "Référence", es: "Referencia" },
  "invoice_paid_receipt.row_project": { en: "Project", fr: "Projet", es: "Proyecto" },

  // ─── revision_received (NEW, client-facing ack) ───────────────
  "revision_received.subject": {
    en: "Got your revision request — CrecyStudio",
    fr: "Votre demande de révision est bien reçue — CrecyStudio",
    es: "Recibimos su solicitud de revisión — CrecyStudio",
  },
  "revision_received.preheader": {
    en: "Your revision is logged. Komlan responds within 24 hours.",
    fr: "Votre révision est enregistrée. Komlan répond sous 24 heures.",
    es: "Su revisión está registrada. Komlan responde en 24 horas.",
  },
  "revision_received.headline": {
    en: "Got your revision.",
    fr: "Votre révision est bien reçue.",
    es: "Recibimos su revisión.",
  },
  "revision_received.eyebrow": {
    en: "Revision logged",
    fr: "Révision enregistrée",
    es: "Revisión registrada",
  },
  "revision_received.body": {
    en: "Your revision request is in. Komlan reviews each one personally and responds within 24 hours — usually with the change already in motion, sometimes with a quick clarifying question first.",
    fr: "Votre demande de révision est enregistrée. Komlan examine chaque demande personnellement et répond sous 24 heures — généralement avec la modification déjà en cours, parfois avec une question rapide d'abord.",
    es: "Su solicitud de revisión está registrada. Komlan revisa cada una personalmente y responde en 24 horas — normalmente con el cambio ya en marcha, a veces con una pregunta rápida primero.",
  },
  "revision_received.cta": {
    en: "Open workspace",
    fr: "Ouvrir l'espace",
    es: "Abrir el espacio",
  },

  // ─── post_launch_30d (NEW) ────────────────────────────────────
  "post_launch_30d.subject": {
    en: "30 days in — how is it going?",
    fr: "30 jours plus tard — comment ça se passe ?",
    es: "30 días después — ¿cómo va todo?",
  },
  "post_launch_30d.preheader": {
    en: "A quick check-in 30 days after launch.",
    fr: "Un petit point 30 jours après le lancement.",
    es: "Un breve seguimiento a 30 días del lanzamiento.",
  },
  "post_launch_30d.headline": {
    en: "30 days in.",
    fr: "30 jours plus tard.",
    es: "30 días después.",
  },
  "post_launch_30d.eyebrow": {
    en: "Post-launch check-in",
    fr: "Suivi post-lancement",
    es: "Seguimiento post-lanzamiento",
  },
  "post_launch_30d.body_intro": {
    en: "It's been about a month since launch. The first month is usually when small frictions surface — a button copy that confuses people, a form field that slows things down, a section that's not pulling its weight.",
    fr: "Cela fait environ un mois depuis le lancement. C'est généralement à ce moment-là que les petits accrocs apparaissent — un texte de bouton qui prête à confusion, un champ de formulaire qui ralentit, une section qui ne joue pas son rôle.",
    es: "Ha pasado aproximadamente un mes desde el lanzamiento. El primer mes suele ser cuando aparecen las pequeñas fricciones — un texto de botón confuso, un campo de formulario que ralentiza, una sección que no aporta lo suficiente.",
  },
  "post_launch_30d.body_offer": {
    en: "Reply with anything you've noticed — I'll look at it directly. If you'd like ongoing tuning instead of one-off fixes, our Care Plans cover that and start at $199/mo.",
    fr: "Répondez en partageant ce que vous avez remarqué — j'y jetterai un œil directement. Si vous préférez un réglage continu plutôt que des correctifs ponctuels, nos forfaits Care couvrent cela à partir de 199 $/mois.",
    es: "Responda con lo que haya notado — lo revisaré directamente. Si prefiere un ajuste continuo en lugar de correcciones puntuales, nuestros planes Care cubren eso desde 199 $/mes.",
  },
  "post_launch_30d.cta": {
    en: "Open workspace",
    fr: "Ouvrir l'espace",
    es: "Abrir el espacio",
  },

  // ─── invoice (existing, client-facing) ────────────────────────
  "invoice.subject": {
    en: "Invoice ready: {{amount}} — CrecyStudio",
    fr: "Facture prête : {{amount}} — CrecyStudio",
    es: "Factura lista: {{amount}} — CrecyStudio",
  },
  "invoice.preheader": {
    en: "Invoice for {{amount}} is ready to pay.",
    fr: "Facture de {{amount}} prête au paiement.",
    es: "Factura de {{amount}} lista para pagar.",
  },
  "invoice.headline_named": {
    en: "Your invoice is ready, {{name}}.",
    fr: "Votre facture est prête, {{name}}.",
    es: "Su factura está lista, {{name}}.",
  },
  "invoice.headline_unnamed": {
    en: "Your invoice is ready.",
    fr: "Votre facture est prête.",
    es: "Su factura está lista.",
  },
  "invoice.eyebrow": {
    en: "{{type}} invoice",
    fr: "Facture de {{type}}",
    es: "Factura de {{type}}",
  },
  "invoice.cta": {
    en: "Pay this invoice",
    fr: "Payer cette facture",
    es: "Pagar esta factura",
  },
  "invoice.notes_label": { en: "Notes", fr: "Notes", es: "Notas" },
  "invoice.portal_link": {
    en: "You can also access this invoice and the project workspace anytime from <a href=\"{{url}}\" style=\"color:#111111;text-decoration:underline\">your portal</a>.",
    fr: "Vous pouvez également accéder à cette facture et à l'espace projet à tout moment depuis <a href=\"{{url}}\" style=\"color:#111111;text-decoration:underline\">votre portail</a>.",
    es: "También puede acceder a esta factura y al espacio del proyecto en cualquier momento desde <a href=\"{{url}}\" style=\"color:#111111;text-decoration:underline\">su portal</a>.",
  },
  "invoice.row_amount": { en: "Amount", fr: "Montant", es: "Monto" },
  "invoice.row_type": { en: "Type", fr: "Type", es: "Tipo" },
  "invoice.row_project": { en: "Project", fr: "Projet", es: "Proyecto" },
  "invoice.row_due": { en: "Due", fr: "Échéance", es: "Vencimiento" },

  // ─── certificate (existing) ───────────────────────────────────
  "certificate.subject": {
    en: "Your signed project agreement — CrecyStudio",
    fr: "Votre contrat de projet signé — CrecyStudio",
    es: "Su contrato de proyecto firmado — CrecyStudio",
  },
  "certificate.preheader": {
    en: "Your signed agreement and Certificate of Completion are attached.",
    fr: "Votre contrat signé et le Certificat d'achèvement sont joints.",
    es: "Su contrato firmado y el Certificado de finalización están adjuntos.",
  },
  "certificate.headline": {
    en: "Your signed agreement, {{name}}.",
    fr: "Votre contrat signé, {{name}}.",
    es: "Su contrato firmado, {{name}}.",
  },
  "certificate.headline_anon": {
    en: "Your signed agreement.",
    fr: "Votre contrat signé.",
    es: "Su contrato firmado.",
  },
  "certificate.eyebrow": {
    en: "Certificate of Completion enclosed",
    fr: "Certificat d'achèvement inclus",
    es: "Certificado de finalización incluido",
  },
  "certificate.body_thanks": {
    en: "Thank you for accepting the project agreement. Your signed copy and Certificate of Completion are attached as a single PDF — keep it somewhere safe for your records.",
    fr: "Merci d'avoir accepté le contrat de projet. Votre copie signée et le Certificat d'achèvement sont joints en un seul PDF — conservez-le précieusement.",
    es: "Gracias por aceptar el contrato del proyecto. Su copia firmada y el Certificado de finalización están adjuntos como un único PDF — guárdelo en un lugar seguro.",
  },
  "certificate.body_verify": {
    en: "You can re-download or independently verify the certificate at any time using the links below.",
    fr: "Vous pouvez retélécharger ou vérifier indépendamment le certificat à tout moment via les liens ci-dessous.",
    es: "Puede volver a descargar o verificar de forma independiente el certificado en cualquier momento mediante los enlaces a continuación.",
  },
  "certificate.cta": {
    en: "Download certificate",
    fr: "Télécharger le certificat",
    es: "Descargar el certificado",
  },
  "certificate.verify_label": {
    en: "Independent verification",
    fr: "Vérification indépendante",
    es: "Verificación independiente",
  },

  // ─── messaging (studio → client) ──────────────────────────────
  "messaging.subject": {
    en: "New message from CrecyStudio about your project",
    fr: "Nouveau message de CrecyStudio sur votre projet",
    es: "Nuevo mensaje de CrecyStudio sobre su proyecto",
  },
  "messaging.preheader": {
    en: "{{sender}} sent you a new message in your project workspace.",
    fr: "{{sender}} vous a envoyé un nouveau message dans votre espace projet.",
    es: "{{sender}} le envió un nuevo mensaje en su espacio del proyecto.",
  },
  "messaging.headline": {
    en: "A new message is waiting for you, {{name}}.",
    fr: "Un nouveau message vous attend, {{name}}.",
    es: "Un nuevo mensaje le espera, {{name}}.",
  },
  "messaging.headline_anon": {
    en: "A new message is waiting for you.",
    fr: "Un nouveau message vous attend.",
    es: "Un nuevo mensaje le espera.",
  },
  "messaging.eyebrow": {
    en: "From {{sender}} at CrecyStudio",
    fr: "De {{sender}} chez CrecyStudio",
    es: "De {{sender}} en CrecyStudio",
  },
  "messaging.preview_label": { en: "Preview", fr: "Aperçu", es: "Vista previa" },
  "messaging.attachment_label": {
    en: "Attachment: {{name}}",
    fr: "Pièce jointe : {{name}}",
    es: "Adjunto: {{name}}",
  },
  "messaging.cta": {
    en: "Open workspace",
    fr: "Ouvrir l'espace",
    es: "Abrir el espacio",
  },
  "messaging.reply_note": {
    en: "Reply directly in your workspace to keep the thread together.",
    fr: "Répondez directement dans votre espace pour garder la conversation au même endroit.",
    es: "Responda directamente en su espacio para mantener la conversación junta.",
  },

  // ─── discovery call (unscheduled confirmation) ────────────────
  "discovery.subject_pending": {
    en: "Discovery call request received — CrecyStudio",
    fr: "Demande d'appel découverte reçue — CrecyStudio",
    es: "Solicitud de llamada de descubrimiento recibida — CrecyStudio",
  },
  "discovery.preheader_pending": {
    en: "I'll confirm a time for your discovery call within 24 hours.",
    fr: "Je vous confirmerai un horaire pour votre appel découverte sous 24 heures.",
    es: "Confirmaré un horario para su llamada de descubrimiento en 24 horas.",
  },
  "discovery.headline_pending": {
    en: "Request received, {{name}}.",
    fr: "Demande reçue, {{name}}.",
    es: "Solicitud recibida, {{name}}.",
  },
  "discovery.headline_pending_anon": {
    en: "Request received.",
    fr: "Demande reçue.",
    es: "Solicitud recibida.",
  },
  "discovery.eyebrow": {
    en: "20-min discovery call",
    fr: "Appel découverte de 20 min",
    es: "Llamada de descubrimiento de 20 min",
  },
  "discovery.body_pending_1": {
    en: "I'll be in touch within 24 hours to confirm a time. No automation — you'll hear from Komlan directly.",
    fr: "Je reviens vers vous sous 24 heures pour confirmer un horaire. Aucune automatisation — vous entendrez Komlan directement.",
    es: "Le escribiré en 24 horas para confirmar un horario. Sin automatización — recibirá noticias de Komlan directamente.",
  },
  "discovery.body_pending_2": {
    en: "If your schedule shifts or you have questions in the meantime, reply to this email and I'll see it directly.",
    fr: "Si votre emploi du temps change ou si vous avez des questions, répondez à cet e-mail — je le verrai directement.",
    es: "Si su agenda cambia o tiene preguntas mientras tanto, responda a este correo y lo veré directamente.",
  },
  "discovery.nextsteps_label": {
    en: "What happens next",
    fr: "La suite",
    es: "Qué sigue",
  },
  "discovery.nextsteps_1": {
    en: "1 Komlan reviews your request personally",
    fr: "1 Komlan examine votre demande personnellement",
    es: "1 Komlan revisa su solicitud personalmente",
  },
  "discovery.nextsteps_2": {
    en: "2 You receive a confirmed time within 24 hours",
    fr: "2 Vous recevez un horaire confirmé sous 24 heures",
    es: "2 Recibe un horario confirmado en 24 horas",
  },
  "discovery.nextsteps_3": {
    en: "3 20 minutes — scope, honest feedback, no pitch",
    fr: "3 20 minutes — portée, retour franc, sans démarchage",
    es: "3 20 minutos — alcance, retroalimentación honesta, sin argumento de venta",
  },

  // ─── discovery call (scheduled) ───────────────────────────────
  "discovery.subject_scheduled": {
    en: "Your discovery call is booked — CrecyStudio",
    fr: "Votre appel découverte est confirmé — CrecyStudio",
    es: "Su llamada de descubrimiento está reservada — CrecyStudio",
  },
  "discovery.preheader_scheduled": {
    en: "Your call is booked for {{slot}}.",
    fr: "Votre appel est confirmé pour {{slot}}.",
    es: "Su llamada está reservada para {{slot}}.",
  },
  "discovery.headline_scheduled": {
    en: "You're on the calendar, {{name}}.",
    fr: "Vous êtes au calendrier, {{name}}.",
    es: "Ya está en el calendario, {{name}}.",
  },
  "discovery.headline_scheduled_anon": {
    en: "You're on the calendar.",
    fr: "Vous êtes au calendrier.",
    es: "Ya está en el calendario.",
  },
  "discovery.booked_for_label": {
    en: "Your call is booked for",
    fr: "Votre appel est prévu le",
    es: "Su llamada está prevista para",
  },
  "discovery.add_to_calendar": {
    en: "Add to your calendar",
    fr: "Ajouter à votre calendrier",
    es: "Añadir a su calendario",
  },
  "discovery.scheduled_attachment_note": {
    en: "A calendar invite is also attached — your email client will offer to add it with one click.",
    fr: "Une invitation calendrier est également jointe — votre client e-mail vous proposera de l'ajouter en un clic.",
    es: "También se adjunta una invitación de calendario — su cliente de correo le ofrecerá añadirla con un clic.",
  },
  "discovery.scheduled_reply_note": {
    en: "Need to reschedule or have a question beforehand? Reply to this email — Komlan will see it directly.",
    fr: "Besoin de reprogrammer ou une question à l'avance ? Répondez à cet e-mail — Komlan le verra directement.",
    es: "¿Necesita reprogramar o tiene una pregunta antes? Responda a este correo — Komlan lo verá directamente.",
  },
  "discovery.expect_label": {
    en: "What to expect on the call",
    fr: "À quoi vous attendre",
    es: "Qué esperar en la llamada",
  },
  "discovery.expect_1": {
    en: "→ Komlan asks sharp questions about your project",
    fr: "→ Komlan pose des questions précises sur votre projet",
    es: "→ Komlan hace preguntas concretas sobre su proyecto",
  },
  "discovery.expect_2": {
    en: "→ You get honest feedback on scope, timeline, and price",
    fr: "→ Vous obtenez un retour franc sur la portée, le calendrier et le prix",
    es: "→ Recibe retroalimentación honesta sobre alcance, calendario y precio",
  },
  "discovery.expect_3": {
    en: "→ A real conversation — no sales pitch",
    fr: "→ Une vraie conversation — sans argumentaire commercial",
    es: "→ Una conversación real — sin argumento de venta",
  },

  // ─── nudges (client-facing) ───────────────────────────────────
  "nudge.asset_missing.subject": {
    en: "Your project is ready for content — CrecyStudio",
    fr: "Votre projet attend votre contenu — CrecyStudio",
    es: "Su proyecto espera su contenido — CrecyStudio",
  },
  "nudge.asset_missing.headline": {
    en: "Time to upload your assets.",
    fr: "Il est temps d'envoyer vos visuels.",
    es: "Hora de subir sus recursos.",
  },
  "nudge.asset_missing.eyebrow": {
    en: "Action needed",
    fr: "Action requise",
    es: "Acción necesaria",
  },
  "nudge.asset_missing.body": {
    en: "The project kicked off five days ago — the next step is your content and assets. Once those land, the first preview is usually ready inside a week.",
    fr: "Le projet a démarré il y a cinq jours — l'étape suivante, ce sont vos contenus et visuels. Une fois reçus, le premier aperçu arrive généralement en moins d'une semaine.",
    es: "El proyecto comenzó hace cinco días — el siguiente paso es su contenido y recursos. Una vez recibidos, la primera vista previa suele estar lista en menos de una semana.",
  },
  "nudge.asset_missing.cta": {
    en: "Upload assets",
    fr: "Téléverser les visuels",
    es: "Subir recursos",
  },
  "nudge.asset_missing.what_label": {
    en: "What to upload",
    fr: "Que téléverser",
    es: "Qué subir",
  },
  "nudge.asset_missing.what_1": {
    en: "→ Logo files (SVG or high-res PNG)",
    fr: "→ Fichiers de logo (SVG ou PNG haute résolution)",
    es: "→ Archivos de logo (SVG o PNG de alta resolución)",
  },
  "nudge.asset_missing.what_2": {
    en: "→ Brand colors and fonts if you have them",
    fr: "→ Couleurs et polices de marque si vous les avez",
    es: "→ Colores y tipografías de marca si los tiene",
  },
  "nudge.asset_missing.what_3": {
    en: "→ Copy or text you want on the site",
    fr: "→ Textes que vous souhaitez sur le site",
    es: "→ Textos que desea en el sitio",
  },
  "nudge.asset_missing.what_4": {
    en: "→ Photos or images — or reply if you'd like help sourcing them",
    fr: "→ Photos ou images — ou répondez si vous voulez de l'aide pour les trouver",
    es: "→ Fotos o imágenes — o responda si quiere ayuda para encontrarlas",
  },

  "nudge.preview_unreviewed.subject": {
    en: "Your preview has been waiting — CrecyStudio",
    fr: "Votre aperçu attend votre retour — CrecyStudio",
    es: "Su vista previa espera su comentario — CrecyStudio",
  },
  "nudge.preview_unreviewed.headline": {
    en: "Your preview is still waiting.",
    fr: "Votre aperçu attend toujours.",
    es: "Su vista previa sigue esperando.",
  },
  "nudge.preview_unreviewed.eyebrow": {
    en: "Review needed",
    fr: "Retour attendu",
    es: "Revisión necesaria",
  },
  "nudge.preview_unreviewed.body": {
    en: "Your website preview has been ready for 48 hours. When you have a moment, take a look and send feedback — even a quick \"looks good\" keeps the build moving.",
    fr: "Votre aperçu de site est prêt depuis 48 heures. Quand vous avez un moment, jetez-y un œil et envoyez vos retours — même un simple « c'est bon » fait avancer le projet.",
    es: "Su vista previa lleva 48 horas lista. Cuando tenga un momento, échele un vistazo y envíe sus comentarios — incluso un rápido «se ve bien» mantiene el proyecto avanzando.",
  },
  "nudge.preview_unreviewed.cta": {
    en: "Open preview",
    fr: "Ouvrir l'aperçu",
    es: "Abrir la vista previa",
  },
  "nudge.preview_unreviewed.fineprint": {
    en: "If you're happy with it as-is, reply with \"ship it\" and I'll move to the next phase.",
    fr: "Si tout vous convient, répondez « on lance » et je passe à la phase suivante.",
    es: "Si está conforme tal cual, responda «adelante» y paso a la siguiente fase.",
  },

  "nudge.deposit_unpaid.subject": {
    en: "Your deposit invoice is still open — CrecyStudio",
    fr: "Votre facture d'acompte reste ouverte — CrecyStudio",
    es: "Su factura de depósito sigue abierta — CrecyStudio",
  },
  "nudge.deposit_unpaid.headline": {
    en: "Your deposit is still open.",
    fr: "Votre acompte reste à régler.",
    es: "Su depósito sigue pendiente.",
  },
  "nudge.deposit_unpaid.eyebrow": {
    en: "Payment reminder",
    fr: "Rappel de paiement",
    es: "Recordatorio de pago",
  },
  "nudge.deposit_unpaid.body": {
    en: "Your deposit invoice is still open. The project kicks off the day it's settled — once the deposit clears, scope confirmation and design direction begin within 24 hours.",
    fr: "Votre facture d'acompte est toujours ouverte. Le projet démarre le jour de son règlement — dès que l'acompte est encaissé, la confirmation de la portée et la direction de design commencent sous 24 heures.",
    es: "Su factura de depósito sigue abierta. El proyecto comienza el día en que se liquida — una vez que el depósito se confirme, la validación del alcance y la dirección de diseño empiezan en 24 horas.",
  },
  "nudge.deposit_unpaid.cta": {
    en: "Pay deposit",
    fr: "Payer l'acompte",
    es: "Pagar el depósito",
  },
  "nudge.deposit_unpaid.fineprint": {
    en: "If anything's blocking the payment, reply and we'll work it out together.",
    fr: "Si quelque chose bloque le paiement, répondez et nous trouverons une solution ensemble.",
    es: "Si algo bloquea el pago, responda y lo resolveremos juntos.",
  },

  "nudge.inactive.subject": {
    en: "A quick check-in on your project — CrecyStudio",
    fr: "Un petit point sur votre projet — CrecyStudio",
    es: "Un breve seguimiento de su proyecto — CrecyStudio",
  },
  "nudge.inactive.headline": {
    en: "There's an update waiting for you.",
    fr: "Une mise à jour vous attend.",
    es: "Hay una actualización esperándole.",
  },
  "nudge.inactive.eyebrow": {
    en: "Project update",
    fr: "Mise à jour du projet",
    es: "Actualización del proyecto",
  },
  "nudge.inactive.body_with_pending": {
    en: "Work has been moving on your project. Here's what's come up since you were last in:",
    fr: "Le travail avance sur votre projet. Voici ce qui s'est passé depuis votre dernière visite :",
    es: "El trabajo ha avanzado en su proyecto. Esto es lo que ha surgido desde su última visita:",
  },
  "nudge.inactive.body_generic": {
    en: "Work has continued on your project — a quick check-in keeps momentum going.",
    fr: "Le travail continue sur votre projet — un petit point garde la dynamique.",
    es: "El trabajo continúa en su proyecto — un breve seguimiento mantiene el ritmo.",
  },
  "nudge.inactive.whats_waiting": {
    en: "What's waiting",
    fr: "Ce qui vous attend",
    es: "Lo que está esperando",
  },
  "nudge.inactive.cta": {
    en: "Open workspace",
    fr: "Ouvrir l'espace",
    es: "Abrir el espacio",
  },
  "nudge.inactive.fineprint": {
    en: "Usually 5 minutes is enough. Reply if you'd rather hop on a quick call instead.",
    fr: "5 minutes suffisent en général. Répondez si vous préférez un court appel.",
    es: "Suelen bastar 5 minutos. Responda si prefiere una llamada rápida.",
  },

  // ─── Invoice type labels (used in receipt + invoice eyebrows) ─
  "invoice_type.deposit": { en: "Deposit", fr: "Acompte", es: "Depósito" },
  "invoice_type.milestone": { en: "Milestone", fr: "Jalon", es: "Hito" },
  "invoice_type.final": { en: "Final", fr: "Solde", es: "Final" },
  "invoice_type.retainer": { en: "Retainer", fr: "Forfait", es: "Retención" },
  "invoice_type.project": { en: "Project", fr: "Projet", es: "Proyecto" },

  // ─── Auth emails (sent via Supabase Send Email Hook) ──────────
  "auth.signup_confirm.subject": {
    en: "Confirm your CrecyStudio account",
    fr: "Confirmez votre compte CrecyStudio",
    es: "Confirme su cuenta de CrecyStudio",
  },
  "auth.signup_confirm.preheader": {
    en: "One click to confirm your email and finish setup.",
    fr: "Un clic pour confirmer votre e-mail et terminer la configuration.",
    es: "Un clic para confirmar su correo y terminar la configuración.",
  },
  "auth.signup_confirm.headline": {
    en: "Confirm your email.",
    fr: "Confirmez votre e-mail.",
    es: "Confirme su correo.",
  },
  "auth.signup_confirm.eyebrow": {
    en: "Account confirmation",
    fr: "Confirmation de compte",
    es: "Confirmación de cuenta",
  },
  "auth.signup_confirm.body": {
    en: "Welcome. To finish creating your account and open your workspace, confirm your email with the button below. This keeps your account safe and lets us send you project updates.",
    fr: "Bienvenue. Pour finaliser la création de votre compte et ouvrir votre espace, confirmez votre e-mail avec le bouton ci-dessous. Cela protège votre compte et nous permet de vous envoyer les mises à jour du projet.",
    es: "Bienvenido. Para terminar de crear su cuenta y abrir su espacio, confirme su correo con el botón a continuación. Esto mantiene su cuenta segura y nos permite enviarle las actualizaciones del proyecto.",
  },
  "auth.signup_confirm.cta": {
    en: "Confirm email",
    fr: "Confirmer l'e-mail",
    es: "Confirmar correo",
  },
  "auth.signup_confirm.expires": {
    en: "This link expires in 24 hours. If you didn't create a CrecyStudio account, you can safely ignore this email.",
    fr: "Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte CrecyStudio, vous pouvez ignorer cet e-mail.",
    es: "Este enlace caduca en 24 horas. Si no creó una cuenta de CrecyStudio, puede ignorar este correo.",
  },

  "auth.magic_link.subject": {
    en: "Your CrecyStudio sign-in link",
    fr: "Votre lien de connexion CrecyStudio",
    es: "Su enlace de inicio de sesión de CrecyStudio",
  },
  "auth.magic_link.preheader": {
    en: "One-click sign in to your CrecyStudio workspace.",
    fr: "Connexion en un clic à votre espace CrecyStudio.",
    es: "Inicio de sesión con un clic en su espacio CrecyStudio.",
  },
  "auth.magic_link.headline": {
    en: "Sign in to CrecyStudio.",
    fr: "Connectez-vous à CrecyStudio.",
    es: "Inicie sesión en CrecyStudio.",
  },
  "auth.magic_link.eyebrow": {
    en: "Sign-in link",
    fr: "Lien de connexion",
    es: "Enlace de inicio de sesión",
  },
  "auth.magic_link.body": {
    en: "Click the button below to sign in. No password needed.",
    fr: "Cliquez sur le bouton ci-dessous pour vous connecter. Aucun mot de passe requis.",
    es: "Haga clic en el botón a continuación para iniciar sesión. Sin contraseña.",
  },
  "auth.magic_link.cta": {
    en: "Sign in",
    fr: "Se connecter",
    es: "Iniciar sesión",
  },
  "auth.magic_link.expires": {
    en: "This link expires in 1 hour and can only be used once. If you didn't request it, ignore this email — your account stays secure.",
    fr: "Ce lien expire dans 1 heure et ne peut être utilisé qu'une seule fois. Si vous n'en avez pas fait la demande, ignorez cet e-mail — votre compte reste sécurisé.",
    es: "Este enlace caduca en 1 hora y solo se puede usar una vez. Si no lo solicitó, ignore este correo — su cuenta sigue segura.",
  },

  "auth.recovery.subject": {
    en: "Reset your CrecyStudio password",
    fr: "Réinitialisez votre mot de passe CrecyStudio",
    es: "Restablezca su contraseña de CrecyStudio",
  },
  "auth.recovery.preheader": {
    en: "Reset your CrecyStudio password.",
    fr: "Réinitialisez votre mot de passe CrecyStudio.",
    es: "Restablezca su contraseña de CrecyStudio.",
  },
  "auth.recovery.headline": {
    en: "Reset your password.",
    fr: "Réinitialisez votre mot de passe.",
    es: "Restablezca su contraseña.",
  },
  "auth.recovery.eyebrow": {
    en: "Password reset",
    fr: "Réinitialisation du mot de passe",
    es: "Restablecimiento de contraseña",
  },
  "auth.recovery.body": {
    en: "Use the button below to set a new password. The link is single-use.",
    fr: "Utilisez le bouton ci-dessous pour définir un nouveau mot de passe. Le lien est à usage unique.",
    es: "Use el botón a continuación para establecer una nueva contraseña. El enlace es de un solo uso.",
  },
  "auth.recovery.cta": {
    en: "Set a new password",
    fr: "Définir un nouveau mot de passe",
    es: "Establecer nueva contraseña",
  },
  "auth.recovery.expires": {
    en: "This link expires in 1 hour. If you didn't request a password reset, ignore this email — your current password keeps working.",
    fr: "Ce lien expire dans 1 heure. Si vous n'avez pas demandé de réinitialisation, ignorez cet e-mail — votre mot de passe actuel reste valide.",
    es: "Este enlace caduca en 1 hora. Si no solicitó el restablecimiento, ignore este correo — su contraseña actual sigue funcionando.",
  },

  "auth.invite.subject": {
    en: "You're invited to CrecyStudio",
    fr: "Vous êtes invité(e) sur CrecyStudio",
    es: "Está invitado a CrecyStudio",
  },
  "auth.invite.preheader": {
    en: "Accept your invite to join CrecyStudio.",
    fr: "Acceptez votre invitation à rejoindre CrecyStudio.",
    es: "Acepte su invitación para unirse a CrecyStudio.",
  },
  "auth.invite.headline": {
    en: "You're invited.",
    fr: "Vous êtes invité(e).",
    es: "Está invitado.",
  },
  "auth.invite.eyebrow": {
    en: "CrecyStudio invitation",
    fr: "Invitation CrecyStudio",
    es: "Invitación a CrecyStudio",
  },
  "auth.invite.body": {
    en: "You've been invited to join CrecyStudio. Accept the invitation below to set a password and open your workspace.",
    fr: "Vous avez été invité(e) à rejoindre CrecyStudio. Acceptez l'invitation ci-dessous pour définir un mot de passe et ouvrir votre espace.",
    es: "Ha sido invitado a unirse a CrecyStudio. Acepte la invitación a continuación para establecer una contraseña y abrir su espacio.",
  },
  "auth.invite.cta": {
    en: "Accept invitation",
    fr: "Accepter l'invitation",
    es: "Aceptar invitación",
  },
  "auth.invite.expires": {
    en: "This invitation link expires in 7 days.",
    fr: "Ce lien d'invitation expire dans 7 jours.",
    es: "Este enlace de invitación caduca en 7 días.",
  },

  "auth.email_change.subject": {
    en: "Confirm your new email address",
    fr: "Confirmez votre nouvelle adresse e-mail",
    es: "Confirme su nueva dirección de correo",
  },
  "auth.email_change.preheader": {
    en: "Confirm the email change on your CrecyStudio account.",
    fr: "Confirmez le changement d'e-mail sur votre compte CrecyStudio.",
    es: "Confirme el cambio de correo en su cuenta CrecyStudio.",
  },
  "auth.email_change.headline": {
    en: "Confirm your new email.",
    fr: "Confirmez votre nouvel e-mail.",
    es: "Confirme su nuevo correo.",
  },
  "auth.email_change.eyebrow": {
    en: "Email change",
    fr: "Changement d'e-mail",
    es: "Cambio de correo",
  },
  "auth.email_change.body": {
    en: "Confirm this email address to finish updating your CrecyStudio sign-in. Until you confirm, your previous email keeps working.",
    fr: "Confirmez cette adresse pour finaliser la mise à jour de votre identifiant CrecyStudio. Tant que vous n'avez pas confirmé, votre ancien e-mail reste actif.",
    es: "Confirme esta dirección para terminar de actualizar su inicio de sesión de CrecyStudio. Hasta que confirme, su correo anterior sigue funcionando.",
  },
  "auth.email_change.cta": {
    en: "Confirm new email",
    fr: "Confirmer le nouvel e-mail",
    es: "Confirmar nuevo correo",
  },
  "auth.email_change.expires": {
    en: "This link expires in 24 hours. If you didn't request this change, contact support immediately.",
    fr: "Ce lien expire dans 24 heures. Si vous n'avez pas demandé ce changement, contactez immédiatement le support.",
    es: "Este enlace caduca en 24 horas. Si no solicitó este cambio, contacte con soporte de inmediato.",
  },
  "auth.email_change.body_old": {
    en: "Someone is changing the email on your CrecyStudio account from this address to <strong>{{newEmail}}</strong>. If this was you, no action is needed — the new address will receive its own confirmation. If this wasn't you, change your password immediately and contact support.",
    fr: "Quelqu'un modifie l'e-mail de votre compte CrecyStudio de cette adresse vers <strong>{{newEmail}}</strong>. Si c'était vous, aucune action n'est requise — la nouvelle adresse recevra sa propre confirmation. Si ce n'était pas vous, modifiez immédiatement votre mot de passe et contactez le support.",
    es: "Alguien está cambiando el correo de su cuenta CrecyStudio de esta dirección a <strong>{{newEmail}}</strong>. Si fue usted, no se requiere acción — la nueva dirección recibirá su propia confirmación. Si no fue usted, cambie su contraseña inmediatamente y contacte con soporte.",
  },

  // ─── Project type labels ──────────────────────────────────────
  "lane.website": { en: "website", fr: "site web", es: "sitio web" },
  "lane.web_app": { en: "custom app", fr: "application sur-mesure", es: "aplicación personalizada" },
  "lane.automation": { en: "automation", fr: "automatisation", es: "automatización" },
  "lane.ecommerce": { en: "store", fr: "boutique", es: "tienda" },
  "lane.rescue": { en: "site rescue", fr: "sauvetage de site", es: "rescate de sitio" },
  "lane.ai_integration": { en: "AI integration", fr: "intégration IA", es: "integración de IA" },
  "lane.project": { en: "project", fr: "projet", es: "proyecto" },
};

// `vars` values are inserted verbatim — caller is responsible for HTML
// escaping any user-controlled content before passing it in.
export function t(
  key: string,
  lang: EmailLocale = "en",
  vars?: Record<string, string | number>,
): string {
  const entry = STRINGS[key];
  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[emailStrings] missing key: ${key}`);
    }
    return key;
  }
  let value = entry[lang] || entry.en;
  if (vars) {
    for (const [name, raw] of Object.entries(vars)) {
      value = value.split(`{{${name}}}`).join(String(raw ?? ""));
    }
  }
  return value;
}

export function laneLabel(projectType: string | null | undefined, lang: EmailLocale): string {
  const key = `lane.${(projectType || "project").toLowerCase()}`;
  return t(STRINGS[key] ? key : "lane.project", lang);
}

// Returns the right greeting based on whether a name is available.
// `name` should be raw (not HTML-escaped); the helper does NOT escape
// for you. Callers that put the result inside HTML must wrap it in
// escHtml when name is interpolated.
export function greeting(name: string | null | undefined, lang: EmailLocale): string {
  const trimmed = (name || "").trim();
  return trimmed
    ? t("common.greeting", lang, { name: trimmed })
    : t("common.greeting_anon", lang);
}

export function invoiceTypeLabel(type: string | null | undefined, lang: EmailLocale): string {
  const key = `invoice_type.${(type || "project").toLowerCase()}`;
  return t(STRINGS[key] ? key : "invoice_type.project", lang);
}
