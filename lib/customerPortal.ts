// lib/customerPortal.ts
import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AnyObj = Record<string, any>;

function makeToken() {
  return randomBytes(24).toString("hex");
}

function safeObj(value: unknown): AnyObj {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AnyObj)
    : {};
}

function toTitle(input: string) {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function buildScopeSnapshotFromQuote(quote: AnyObj) {
  const answers = safeObj(quote.answers);
  const breakdown = Array.isArray(quote.breakdown) ? quote.breakdown : [];

  const enabledBooleans = Object.entries(answers)
    .filter(([, v]) => v === true)
    .map(([k]) => toTitle(k))
    .slice(0, 20);

  const stringFields = Object.entries(answers)
    .filter(([, v]) => typeof v === "string" && String(v).trim().length > 0)
    .slice(0, 20)
    .map(([k, v]) => ({ label: toTitle(k), value: String(v) }));

  const arrayFields = Object.entries(answers)
    .filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0)
    .slice(0, 20)
    .map(([k, v]) => ({
      label: toTitle(k),
      values: (v as unknown[]).map((x) => String(x)),
    }));

  return {
    quoteId: quote.id,
    tier: quote.tier ?? null,
    estimateCents: quote.estimate_cents ?? null,
    estimateLowCents: quote.estimate_low_cents ?? null,
    estimateHighCents: quote.estimate_high_cents ?? null,
    status: quote.status ?? null,
    createdAt: quote.created_at ?? null,
    breakdown,
    requestedFeatures: enabledBooleans,
    formSelections: stringFields,
    listSelections: arrayFields,
    notes:
      typeof answers.notes === "string"
        ? answers.notes
        : typeof answers.project_notes === "string"
        ? answers.project_notes
        : null,
  };
}

export async function ensureCustomerPortalForQuoteId(quoteId: string) {
  if (!quoteId) throw new Error("quoteId is required");

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (existingErr) throw existingErr;

  if (existing) {
    return existing;
  }

  const { data: quote, error: quoteErr } = await supabaseAdmin
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteErr) throw quoteErr;
  if (!quote) throw new Error("Quote not found");

  const scopeSnapshot = buildScopeSnapshotFromQuote(quote);

  const { data: created, error: createErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .insert({
      quote_id: quoteId,
      access_token: makeToken(),
      project_status: "new",
      deposit_status: "pending",
      deposit_amount_cents: Math.round(Number(quote.estimate_cents ?? 0) * 0.5) || null,
      scope_snapshot: scopeSnapshot,
    })
    .select("*")
    .single();

  if (createErr) throw createErr;

  // Seed default milestones
  const defaultMilestones = [
    { title: "Kickoff & scope confirmation", status: "todo", sort_order: 10 },
    { title: "Content/assets received", status: "todo", sort_order: 20 },
    { title: "First build draft", status: "todo", sort_order: 30 },
    { title: "Revision round", status: "todo", sort_order: 40 },
    { title: "Launch & handoff", status: "todo", sort_order: 50 },
  ];

  const { error: milestoneErr } = await supabaseAdmin
    .from("customer_portal_milestones")
    .insert(
      defaultMilestones.map((m) => ({
        portal_project_id: created.id,
        ...m,
      }))
    );

  if (milestoneErr) {
    // Don't fail portal creation if milestone seed fails
    console.error("Milestone seed error:", milestoneErr);
  }

  return created;
}

export async function getCustomerPortalBundleByToken(token: string) {
  if (!token) return null;

  const { data: portal, error: portalErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();

  if (portalErr) throw portalErr;
  if (!portal) return null;

  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("*")
    .eq("id", portal.quote_id)
    .maybeSingle();

  let lead: AnyObj | null = null;
  if (quote?.lead_id) {
    const { data } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", quote.lead_id)
      .maybeSingle();
    lead = data ?? null;
  }

  const { data: callRequest } = await supabaseAdmin
    .from("call_requests")
    .select("*")
    .eq("quote_id", portal.quote_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: pieReport } = await supabaseAdmin
    .from("pie_reports")
    .select("*")
    .eq("quote_id", portal.quote_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: milestones } = await supabaseAdmin
    .from("customer_portal_milestones")
    .select("*")
    .eq("portal_project_id", portal.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: assets } = await supabaseAdmin
    .from("customer_portal_assets")
    .select("*")
    .eq("portal_project_id", portal.id)
    .order("created_at", { ascending: false });

  const { data: revisions } = await supabaseAdmin
    .from("customer_portal_revisions")
    .select("*")
    .eq("portal_project_id", portal.id)
    .order("created_at", { ascending: false });

  return {
    portal,
    quote: quote ?? null,
    lead,
    callRequest: callRequest ?? null,
    pieReport: pieReport ?? null,
    milestones: milestones ?? [],
    assets: assets ?? [],
    revisions: revisions ?? [],
  };
}

export async function submitAssetByPortalToken(input: {
  token: string;
  label: string;
  assetType?: string;
  assetUrl?: string;
  notes?: string;
}) {
  const { token, label, assetType, assetUrl, notes } = input;

  const { data: portal, error: portalErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("id")
    .eq("access_token", token)
    .single();

  if (portalErr) throw portalErr;

  const { data, error } = await supabaseAdmin
    .from("customer_portal_assets")
    .insert({
      portal_project_id: portal.id,
      label: label.trim(),
      asset_type: (assetType || "general").trim(),
      asset_url: assetUrl?.trim() || null,
      notes: notes?.trim() || null,
      status: "submitted",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function submitRevisionByPortalToken(input: {
  token: string;
  requestText: string;
}) {
  const { token, requestText } = input;

  const { data: portal, error: portalErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("id")
    .eq("access_token", token)
    .single();

  if (portalErr) throw portalErr;

  const { data, error } = await supabaseAdmin
    .from("customer_portal_revisions")
    .insert({
      portal_project_id: portal.id,
      request_text: requestText.trim(),
      status: "new",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}