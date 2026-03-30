import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ProjectControlClient from "./ProjectControlClient";

export const dynamic = "force-dynamic";

function safeObj(v: any) {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return {};
}

function cleanList(values: unknown): string[] {
  if (Array.isArray(values)) {
    return values.map((v) => String(v || "").trim()).filter(Boolean);
  }

  if (typeof values === "string" && values.trim()) {
    return values
      .split(/[,|\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function parsePages(value: unknown): string[] {
  const raw = String(value || "").trim();
  if (!raw) return [];

  if (raw.toLowerCase().includes("one pager")) {
    return ["Homepage / One-page flow"];
  }

  const match = raw.match(/\d+/);
  if (match) {
    const count = Number(match[0]);
    if (Number.isFinite(count) && count > 0) {
      return Array.from({ length: count }, (_, i) => `Page ${i + 1}`);
    }
  }

  return [raw];
}

type Milestone = {
  key: string;
  label: string;
  done: boolean;
  updatedAt?: string | null;
};

function buildDefaultMilestones(input: {
  quoteStatus: string;
  depositStatus: string;
  assetsCount: number;
}): Milestone[] {
  const s = String(input.quoteStatus || "").toLowerCase();
  const isDepositPaid = String(input.depositStatus || "").toLowerCase() === "paid";

  const afterCall = ["call", "proposal", "deposit", "active", "closed_won"].includes(s);
  const scopeLocked = ["proposal", "deposit", "active", "closed_won"].includes(s);
  const buildStarted = ["active", "closed_won"].includes(s);
  const launched = ["closed_won"].includes(s);

  return [
    { key: "quote_submitted", label: "Quote submitted", done: true },
    { key: "discovery_call", label: "Discovery call completed", done: afterCall },
    { key: "scope_confirmed", label: "Scope confirmed", done: scopeLocked },
    { key: "deposit_paid", label: "Deposit paid", done: isDepositPaid },
    { key: "assets_submitted", label: "Content/assets submitted", done: input.assetsCount > 0 },
    { key: "build_in_progress", label: "Build in progress", done: buildStarted },
    { key: "review_round", label: "Review / revisions", done: false },
    { key: "launch", label: "Launch completed", done: launched },
  ];
}

function mergeMilestones(defaults: Milestone[], saved: Milestone[]): Milestone[] {
  const savedMap = new Map(saved.map((m) => [m.key, m]));
  return defaults.map((d) => {
    const s = savedMap.get(d.key);
    if (!s) return d;
    return {
      ...d,
      done: typeof s.done === "boolean" ? s.done : d.done,
      updatedAt: s.updatedAt ?? d.updatedAt ?? null,
    };
  });
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

  if (!user) redirect(`/login?next=${encodeURIComponent(`/internal/admin/${quoteId}`)}`);

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const [quoteRes, pieRes, callRes, portalStateRes] = await Promise.all([
    supabaseAdmin
      .from("quotes")
      .select("*, leads(email, name)")
      .eq("id", quoteId)
      .maybeSingle(),

    supabaseAdmin
      .from("pie_reports")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabaseAdmin
      .from("call_requests")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabaseAdmin
      .from("quote_portal_state")
      .select("*")
      .eq("quote_id", quoteId)
      .maybeSingle(),
  ]);

  if (quoteRes.error) {
    throw new Error(quoteRes.error.message);
  }

  const quote = quoteRes.data;
  if (!quote) notFound();

  const lead = Array.isArray(quote.leads) ? quote.leads[0] : quote.leads;
  const debug = safeObj(quote.debug);
  const intake = safeObj(quote.intake_normalized);
  const portalAdmin = safeObj(debug.portalAdmin);
  const scopeSnapshotRaw = safeObj(quote.scope_snapshot);
  const historyRaw = safeObj(debug.workspaceHistory);
  const portalState = portalStateRes.data || null;
  const pie = pieRes.data || null;
  const call = callRes.data || null;

  const baseTarget =
    quote.estimate_total ||
    quote.quote_json?.estimateComputed?.total ||
    quote.quote_json?.estimate?.target ||
    0;

  const baseMin =
    quote.estimate_low ||
    quote.quote_json?.estimateComputed?.low ||
    quote.quote_json?.estimate?.min ||
    0;

  const baseMax =
    quote.estimate_high ||
    quote.quote_json?.estimateComputed?.high ||
    quote.quote_json?.estimate?.max ||
    0;

  const assets = Array.isArray(portalState?.assets) ? portalState.assets : [];
  const revisions = Array.isArray(portalState?.revision_requests)
    ? portalState.revision_requests
    : [];
  const savedMilestones = Array.isArray(portalState?.milestones)
    ? portalState.milestones
    : [];

  const mergedMilestones = mergeMilestones(
    buildDefaultMilestones({
      quoteStatus: quote.status || "",
      depositStatus: quote.deposit_status || "",
      assetsCount: assets.length,
    }),
    savedMilestones
  );

  const initialData = {
    quoteId: quote.id,
    publicToken: quote.public_token || "",
    workspaceUrl: quote.public_token ? `/portal/${quote.public_token}` : "",
    createdAt: quote.created_at,
    status: quote.status || "new",
    tier: quote.tier_recommended || quote.quote_json?.estimate?.tierRecommended || "—",

    leadName: lead?.name || quote.quote_json?.contactName || "Unknown Lead",
    leadEmail: quote.lead_email || lead?.email || quote.quote_json?.leadEmail || "No Email",

    estimate: {
      target: baseTarget,
      min: baseMin,
      max: baseMax,
    },

    pie: {
      exists: !!pie,
      score: pie?.score || pie?.report?.lead_score || null,
      tier: pie?.tier || pie?.report?.recommended_tier || null,
      summary: pie?.summary || pie?.report?.summary || "",
    },

    callRequest: call
      ? {
          status: call.status || "new",
          bestTime: call.best_time_to_call || call.preferred_times || "",
          timezone: call.timezone || "",
          notes: call.notes || "",
        }
      : null,

    adminPricing: {
      discountPercent: debug?.adminPricing?.discountPercent || 0,
      flatAdjustment: debug?.adminPricing?.flatAdjustment || 0,
      hourlyRate: debug?.adminPricing?.hourlyRate || 40,
      notes: debug?.adminPricing?.notes || "",
    },

    scopeSnapshot: {
      tierLabel:
        scopeSnapshotRaw.tierLabel ||
        scopeSnapshotRaw.packageName ||
        quote.tier_recommended ||
        "Website Scope",
      platform:
        scopeSnapshotRaw.platform ||
        scopeSnapshotRaw.stack ||
        intake.domainHosting ||
        "To be finalized",
      timeline:
        scopeSnapshotRaw.timeline ||
        scopeSnapshotRaw.timelineText ||
        intake.timeline ||
        "Aligned during scoping",
      revisionPolicy:
        scopeSnapshotRaw.revisionPolicy ||
        scopeSnapshotRaw.revisions ||
        "Revision structure aligned during scope approval",
      pagesIncluded:
        cleanList(scopeSnapshotRaw.pagesIncluded).length > 0
          ? cleanList(scopeSnapshotRaw.pagesIncluded)
          : parsePages(intake.pages),
      featuresIncluded:
        cleanList(scopeSnapshotRaw.featuresIncluded).length > 0
          ? cleanList(scopeSnapshotRaw.featuresIncluded)
          : cleanList(intake.integrations),
      exclusions:
        cleanList(scopeSnapshotRaw.exclusions).length > 0
          ? cleanList(scopeSnapshotRaw.exclusions)
          : ["Third-party fees", "Custom post-launch growth work"],
    },

    portalAdmin: {
      previewUrl: portalAdmin.previewUrl || "",
      productionUrl: portalAdmin.productionUrl || "",
      previewStatus: portalAdmin.previewStatus || "Awaiting published preview",
      previewNotes: portalAdmin.previewNotes || "",
      previewUpdatedAt: portalAdmin.previewUpdatedAt || "",
      clientReviewStatus: portalAdmin.clientReviewStatus || "Preview pending",
      agreementStatus: portalAdmin.agreementStatus || "Not published yet",
      agreementModel: portalAdmin.agreementModel || "Managed build agreement",
      ownershipModel: portalAdmin.ownershipModel || "Managed with project handoff options",
      agreementPublishedAt: portalAdmin.agreementPublishedAt || "",
      launchStatus: portalAdmin.launchStatus || "Not ready",
      domainStatus: portalAdmin.domainStatus || "Pending",
      analyticsStatus: portalAdmin.analyticsStatus || "Pending",
      formsStatus: portalAdmin.formsStatus || "Pending",
      seoStatus: portalAdmin.seoStatus || "Pending",
      handoffStatus: portalAdmin.handoffStatus || "Pending",
      launchNotes: portalAdmin.launchNotes || "",
    },

    depositStatus: quote.deposit_status || "",

    portalStateAdmin: {
      clientStatus: portalState?.client_status || "new",
      clientNotes: portalState?.client_notes || "",
      adminPublicNote: portalState?.admin_public_note || "",
      depositAmount:
        portalState?.deposit_amount ??
        (baseTarget ? Math.round(baseTarget * 0.5) : 0),
      depositNotes: portalState?.deposit_notes || "",
      milestones: mergedMilestones,
    },

    clientSync: {
      lastClientUpdate: portalState?.client_updated_at || "",
      assets,
      revisions,
    },

    workspaceHistory: {
      scopeVersions: Array.isArray(historyRaw.scopeVersions) ? historyRaw.scopeVersions : [],
      changeOrders: Array.isArray(historyRaw.changeOrders) ? historyRaw.changeOrders : [],
    },

    proposalText: debug?.generatedProposal || "",
    preContractDraft: debug?.generatedPreContract || "",
    publishedAgreementText: debug?.publishedAgreementText || "",
  };

  return <ProjectControlClient initialData={initialData} />;
}