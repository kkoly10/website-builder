import { INTERNAL_HOURLY_RATE } from "@/lib/pricing/config";
import { getCustomerPortalViewByQuoteId } from "@/lib/customerPortal";
import { listProjectActivityByQuoteId, type ProjectActivityItem } from "@/lib/projectActivity";
import { listProjectInvoicesByQuoteId, type ProjectInvoiceView } from "@/lib/projectInvoices";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Milestone = { key: string; label: string; done: boolean; updatedAt?: string | null };
type ClientAsset = {
  id: string;
  category: string;
  label: string;
  url: string;
  notes?: string;
  status: string;
  createdAt: string;
};
type ClientRevision = {
  id: string;
  message: string;
  priority: string;
  status: string;
  createdAt: string;
};
type ScopeVersion = {
  id: string;
  createdAt: string;
  label: string;
  summary: string;
  tierLabel: string;
  platform: string;
  timeline: string;
  revisionPolicy: string;
  pagesIncluded: string[];
  featuresIncluded: string[];
  exclusions: string[];
};
type ChangeOrder = {
  id: string;
  createdAt: string;
  title: string;
  summary: string;
  priceImpact: string;
  timelineImpact: string;
  scopeImpact: string;
  status: string;
};
type PortalMessage = {
  id: string;
  senderRole: "client" | "studio" | "internal";
  senderName: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  attachment: {
    url: string | null;
    name: string | null;
    type: string | null;
    size: number | null;
  } | null;
};
type MessageSummary = {
  unreadCount: number;
  lastPreview: string;
  lastAt: string;
  lastRole: "client" | "studio" | "internal" | null;
};

export type ProjectType =
  | "website"
  | "web_app"
  | "automation"
  | "ecommerce"
  | "rescue";

export type AdminProjectData = {
  quoteId: string;
  projectType: ProjectType;
  publicToken: string;
  workspaceUrl: string;
  createdAt: string;
  status: string;
  tier: string;
  leadName: string;
  leadEmail: string;
  estimate: { target: number; min: number; max: number };
  pie: { exists: boolean; score: number | null; tier: string | null; summary: string };
  callRequest: { status: string; bestTime: string; timezone: string; notes: string } | null;
  adminPricing: {
    discountPercent: number;
    flatAdjustment: number;
    hourlyRate: number;
    notes: string;
  };
  scopeSnapshot: {
    tierLabel: string;
    platform: string;
    timeline: string;
    revisionPolicy: string;
    pagesIncluded: string[];
    featuresIncluded: string[];
    exclusions: string[];
  };
  portalAdmin: {
    previewUrl: string;
    productionUrl: string;
    previewStatus: string;
    previewNotes: string;
    previewUpdatedAt: string;
    clientReviewStatus: string;
    agreementStatus: string;
    agreementModel: string;
    ownershipModel: string;
    agreementPublishedAt: string;
    launchStatus: string;
    domainStatus: string;
    analyticsStatus: string;
    formsStatus: string;
    seoStatus: string;
    handoffStatus: string;
    launchNotes: string;
  };
  depositStatus: string;
  portalStateAdmin: {
    clientStatus: string;
    clientNotes: string;
    adminPublicNote: string;
    depositAmount: number;
    depositNotes: string;
    milestones: Milestone[];
  };
  clientSync: {
    lastClientUpdate: string;
    assets: ClientAsset[];
    revisions: ClientRevision[];
  };
  invoices: ProjectInvoiceView[];
  activityFeed: ProjectActivityItem[];
  messages: PortalMessage[];
  messageSummary: MessageSummary;
  workspaceHistory: {
    scopeVersions: ScopeVersion[];
    changeOrders: ChangeOrder[];
  };
  proposalText: string;
  preContractDraft: string;
  publishedAgreementText: string;
  agreementAcceptance: {
    acceptedAt: string;
    acceptedByEmail: string;
    acceptedFromIp: string;
    agreementVersionHash: string;
  } | null;
};

function safeObj(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, any>;
}

function summarizeMessages(messages: PortalMessage[]): MessageSummary {
  const lastMessage = messages[messages.length - 1];
  return {
    unreadCount: messages.filter(
      (message) => message.senderRole === "client" && !message.readAt
    ).length,
    lastPreview:
      lastMessage?.body ||
      (lastMessage?.attachment?.name ? `Attachment: ${lastMessage.attachment.name}` : ""),
    lastAt: lastMessage?.createdAt || "",
    lastRole: lastMessage?.senderRole || null,
  };
}

const VALID_PROJECT_TYPES: ProjectType[] = [
  "website",
  "web_app",
  "automation",
  "ecommerce",
  "rescue",
];

function coerceProjectType(value: unknown): ProjectType {
  if (typeof value === "string" && (VALID_PROJECT_TYPES as string[]).includes(value)) {
    return value as ProjectType;
  }
  return "website";
}

function toAdminProjectData(
  workspace: any,
  debug: Record<string, any>,
  projectType: ProjectType,
): AdminProjectData {
  const messages: PortalMessage[] = Array.isArray(workspace.messages) ? workspace.messages : [];
  return {
    quoteId: workspace.quote.id,
    projectType,
    publicToken: workspace.quote.publicToken,
    workspaceUrl: workspace.quote.publicToken ? `/portal/${workspace.quote.publicToken}` : "",
    createdAt: workspace.quote.createdAt,
    status: workspace.quote.status,
    tier: workspace.quote.tier,
    leadName: workspace.lead.name || "Unknown Lead",
    leadEmail: workspace.lead.email || "No Email",
    estimate: {
      target: workspace.quote.estimate.target || 0,
      min: workspace.quote.estimate.min || 0,
      max: workspace.quote.estimate.max || 0,
    },
    pie: {
      exists: !!workspace.pie.exists,
      score: workspace.pie.score,
      tier: workspace.pie.tier,
      summary: workspace.pie.summary || "",
    },
    callRequest: workspace.callRequest
      ? {
          status: workspace.callRequest.status || "new",
          bestTime: workspace.callRequest.bestTime || "",
          timezone: workspace.callRequest.timezone || "",
          notes: workspace.callRequest.notes || "",
        }
      : null,
    adminPricing: {
      discountPercent: debug.adminPricing?.discountPercent || 0,
      flatAdjustment: debug.adminPricing?.flatAdjustment || 0,
      hourlyRate: debug.adminPricing?.hourlyRate || INTERNAL_HOURLY_RATE,
      notes: debug.adminPricing?.notes || "",
    },
    scopeSnapshot: workspace.scopeSnapshot,
    portalAdmin: {
      previewUrl: workspace.preview.url || "",
      productionUrl: workspace.preview.productionUrl || "",
      previewStatus: workspace.preview.status || "Awaiting published preview",
      previewNotes: workspace.preview.notes || "",
      previewUpdatedAt: workspace.preview.updatedAt || "",
      clientReviewStatus: workspace.preview.clientReviewStatus || "Preview pending",
      agreementStatus: workspace.agreement.status || "Not published yet",
      agreementModel: workspace.agreement.model || "Managed build agreement",
      ownershipModel:
        workspace.agreement.ownershipModel || "Managed with project handoff options",
      agreementPublishedAt: workspace.agreement.publishedAt || "",
      launchStatus: workspace.launch.status || "Not ready",
      domainStatus: workspace.launch.domainStatus || "Pending",
      analyticsStatus: workspace.launch.analyticsStatus || "Pending",
      formsStatus: workspace.launch.formsStatus || "Pending",
      seoStatus: workspace.launch.seoStatus || "Pending",
      handoffStatus: workspace.launch.handoffStatus || "Pending",
      launchNotes: workspace.launch.notes || "",
    },
    depositStatus: workspace.quote.deposit.status || "",
    portalStateAdmin: {
      clientStatus: workspace.portalState.clientStatus || "new",
      clientNotes: workspace.portalState.clientNotes || "",
      adminPublicNote: workspace.portalState.adminPublicNote || "",
      depositAmount: workspace.quote.deposit.amount || 0,
      depositNotes: workspace.quote.deposit.notes || "",
      milestones: workspace.portalState.milestones,
    },
    clientSync: {
      lastClientUpdate: workspace.portalState.clientUpdatedAt || "",
      assets: workspace.portalState.assets,
      revisions: workspace.portalState.revisions,
    },
    invoices: Array.isArray(workspace.invoices) ? workspace.invoices : [],
    activityFeed: Array.isArray(workspace.activityFeed) ? workspace.activityFeed : [],
    messages,
    messageSummary: summarizeMessages(messages),
    workspaceHistory: workspace.history,
    proposalText: debug.generatedProposal || "",
    preContractDraft: debug.generatedPreContract || "",
    publishedAgreementText:
      workspace.agreement.publishedText || debug.publishedAgreementText || "",
    agreementAcceptance: debug.agreementAcceptance
      ? {
          acceptedAt: debug.agreementAcceptance.acceptedAt || "",
          acceptedByEmail: debug.agreementAcceptance.acceptedByEmail || "",
          acceptedFromIp: debug.agreementAcceptance.acceptedFromIp || "",
          agreementVersionHash: debug.agreementAcceptance.agreementVersionHash || "",
        }
      : null,
  };
}

export async function getAdminProjectDataByQuoteId(quoteId: string) {
  const [workspaceRes, quoteRes, invoices, activityFeed] = await Promise.all([
    getCustomerPortalViewByQuoteId(quoteId, { includeInternal: true }),
    supabaseAdmin
      .from("quotes")
      .select("id, debug, project_type")
      .eq("id", quoteId)
      .maybeSingle(),
    listProjectInvoicesByQuoteId(quoteId),
    listProjectActivityByQuoteId(quoteId, { limit: 80 }),
  ]);

  if (!workspaceRes.ok || quoteRes.error || !quoteRes.data) {
    return null;
  }

  return toAdminProjectData(
    { ...workspaceRes.data, invoices, activityFeed },
    safeObj(quoteRes.data.debug),
    coerceProjectType((quoteRes.data as { project_type?: unknown }).project_type),
  );
}

export async function listAdminProjectData() {
  const quotesRes = await supabaseAdmin
    .from("quotes")
    .select("id")
    .order("created_at", { ascending: false });

  if (quotesRes.error) {
    return [];
  }

  const results = await Promise.allSettled(
    (quotesRes.data ?? []).map((quote) => getAdminProjectDataByQuoteId(quote.id))
  );

  return results
    .filter((result): result is PromiseFulfilledResult<AdminProjectData | null> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((result): result is AdminProjectData => Boolean(result));
}
