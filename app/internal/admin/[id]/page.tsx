import { notFound, redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  isAdminUser,
} from "@/lib/supabase/server";
import { getCustomerPortalViewByQuoteId } from "@/lib/customerPortal";
import { INTERNAL_HOURLY_RATE } from "@/lib/pricing/config";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ProjectControlClient from "./ProjectControlClient";

export const dynamic = "force-dynamic";

function safeObj(value: any) {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return {};
}

type Params = {
  id: string;
};

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const resolved = await Promise.resolve(params);
  const quoteId = resolved.id;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/internal/admin/${quoteId}`)}`);
  }

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const quoteRes = await supabaseAdmin
    .from("quotes")
    .select("id, debug")
    .eq("id", quoteId)
    .maybeSingle();

  if (quoteRes.error || !quoteRes.data) {
    notFound();
  }

  const portalView = await getCustomerPortalViewByQuoteId(quoteId);
  if (!portalView.ok) notFound();

  const debug = safeObj(quoteRes.data.debug);
  const workspace = portalView.data;

  const initialData = {
    quoteId: workspace.quote.id,
    publicToken: workspace.quote.publicToken,
    workspaceUrl: workspace.quote.publicToken
      ? `/portal/${workspace.quote.publicToken}`
      : "",
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
      discountPercent: debug?.adminPricing?.discountPercent || 0,
      flatAdjustment: debug?.adminPricing?.flatAdjustment || 0,
      hourlyRate: debug?.adminPricing?.hourlyRate || INTERNAL_HOURLY_RATE,
      notes: debug?.adminPricing?.notes || "",
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
        workspace.agreement.ownershipModel ||
        "Managed with project handoff options",
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
    workspaceHistory: workspace.history,
    proposalText: debug?.generatedProposal || "",
    preContractDraft: debug?.generatedPreContract || "",
    publishedAgreementText:
      workspace.agreement.publishedText || debug?.publishedAgreementText || "",
  };

  return <ProjectControlClient initialData={initialData} />;
}
