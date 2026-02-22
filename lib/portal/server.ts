// lib/portal/server.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type JsonRecord = Record<string, any>;

type PortalMilestone = {
  key: string;
  label: string;
  done: boolean;
  updatedAt?: string | null;
};

type PortalAsset = {
  id: string;
  category: string;
  label: string;
  url: string;
  notes?: string;
  status: "submitted" | "received" | "approved";
  createdAt: string;
};

type PortalRevision = {
  id: string;
  message: string;
  priority: "low" | "normal" | "high";
  status: "new" | "reviewed" | "scheduled" | "done";
  createdAt: string;
};

type PortalStateRow = {
  quote_id: string;
  client_status?: string | null;
  client_updated_at?: string | null;
  client_notes?: string | null;
  milestones?: PortalMilestone[] | null;
  assets?: PortalAsset[] | null;
  revision_requests?: PortalRevision[] | null;
  deposit_amount?: number | null;
  deposit_notes?: string | null;
  admin_public_note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function asObj(v: unknown): JsonRecord {
  if (!v) return {};
  if (typeof v === "object" && !Array.isArray(v)) return v as JsonRecord;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return typeof parsed === "object" && parsed && !Array.isArray(parsed)
        ? (parsed as JsonRecord)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

function asArray<T = any>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function str(v: unknown): string | null {
  if (typeof v === "string") return v;
  return null;
}

function isoNow() {
  return new Date().toISOString();
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parsePieReport(rawPie: any) {
  const report = asObj(rawPie?.report);
  const pricing = asObj(report.pricing);
  const hoursObj = asObj((report as any).hours);
  const timelineObj = asObj((report as any).timeline);
  const discoveryObj = asObj((report as any).discovery);
  const pitchObj = asObj((report as any).pitch);

  const pricingBuffers = asArray<any>(pricing.buffers);
  const upperBuffer =
    pricingBuffers.find((b) => String(b?.label || "").toLowerCase().includes("upper")) ??
    pricingBuffers[0];

  return {
    exists: !!rawPie,
    id: rawPie?.id ?? null,
    score: num(rawPie?.score) ?? num(report.score),
    tier: str(rawPie?.tier) ?? str(report.tier),
    confidence: str(rawPie?.confidence) ?? str(report.confidence),
    summary: str(report.summary) ?? "No PIE summary yet.",
    risks: asArray<string>(report.risks).filter(Boolean),
    pitch: {
      emphasize: asArray<string>(pitchObj.emphasize).filter(Boolean),
      recommend: str(pitchObj.recommend),
      objections: asArray<string>(pitchObj.objections).filter(Boolean),
    },
    pricing: {
      target: num(pricing.target),
      minimum: num(pricing.minimum),
      maximum: num(upperBuffer?.amount),
    },
    hours: {
      min: num(hoursObj.min),
      max: num(hoursObj.max),
    },
    timelineText:
      str((report as any).timelineText) ??
      str(timelineObj.text) ??
      str((report as any).timeline_estimate),
    discoveryQuestions:
      asArray<string>((report as any).discoveryQuestions).filter(Boolean).length > 0
        ? asArray<string>((report as any).discoveryQuestions).filter(Boolean)
        : asArray<string>(discoveryObj.questions).filter(Boolean),
    reportRaw: report,
  };
}

function buildDefaultMilestones(input: {
  quoteStatus: string;
  depositStatus: string;
  assetsCount: number;
}) {
  const { quoteStatus, depositStatus, assetsCount } = input;
  const s = (quoteStatus || "").toLowerCase();
  const isDepositPaid = (depositStatus || "").toLowerCase() === "paid";

  const afterCall = ["call", "proposal", "deposit", "active", "closed_won"].includes(s);
  const scopeLocked = ["proposal", "deposit", "active", "closed_won"].includes(s);
  const buildStarted = ["active", "closed_won"].includes(s);
  const launched = ["closed_won"].includes(s);

  const list: PortalMilestone[] = [
    { key: "quote_submitted", label: "Quote submitted", done: true },
    { key: "discovery_call", label: "Discovery call completed", done: afterCall },
    { key: "scope_confirmed", label: "Scope confirmed", done: scopeLocked },
    { key: "deposit_paid", label: "Deposit paid", done: isDepositPaid },
    { key: "assets_submitted", label: "Content/assets submitted", done: assetsCount > 0 },
    { key: "build_in_progress", label: "Build in progress", done: buildStarted },
    { key: "review_round", label: "Review / revisions", done: false },
    { key: "launch", label: "Launch completed", done: launched },
  ];

  return list;
}

function mergeMilestones(defaults: PortalMilestone[], saved: PortalMilestone[]) {
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

async function getPortalState(quoteId: string): Promise<PortalStateRow | null> {
  const { data, error } = await supabaseAdmin
    .from("quote_portal_state")
    .select("*")
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (error) {
    // Helpful message if table is not created yet
    if (error.message?.toLowerCase().includes("quote_portal_state")) {
      throw new Error(
        'Missing table "quote_portal_state". Run the SQL migration first.'
      );
    }
    throw new Error(error.message);
  }

  return (data as PortalStateRow | null) ?? null;
}

async function upsertPortalState(row: PortalStateRow) {
  const payload = {
    ...row,
    updated_at: isoNow(),
  };

  const { error } = await supabaseAdmin.from("quote_portal_state").upsert(payload, {
    onConflict: "quote_id",
  });

  if (error) {
    if (error.message?.toLowerCase().includes("quote_portal_state")) {
      throw new Error(
        'Missing table "quote_portal_state". Run the SQL migration first.'
      );
    }
    throw new Error(error.message);
  }
}

export async function getPortalBundleByToken(token: string) {
  const { data: quote, error: quoteErr } = await supabaseAdmin
    .from("quotes")
    .select(
      [
        "id",
        "created_at",
        "status",
        "tier_recommended",
        "estimate_total",
        "estimate_low",
        "estimate_high",
        "intake_raw",
        "intake_normalized",
        "scope_snapshot",
        "public_token",
        "deposit_link",
        "deposit_status",
        "deposit_paid_at",
        "lead_id",
      ].join(",")
    )
    .eq("public_token", token)
    .maybeSingle();

  if (quoteErr) {
    return { ok: false as const, error: quoteErr.message };
  }

  if (!quote) {
    return { ok: false as const, error: "Portal link not found." };
  }

  const quoteId = String((quote as any).id);

  const [leadRes, callRes, pieRes, portalState] = await Promise.all([
    (quote as any).lead_id
      ? supabaseAdmin
          .from("leads")
          .select("id,email,phone,name")
          .eq("id", (quote as any).lead_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as any),

    supabaseAdmin
      .from("call_requests")
      .select("status,preferred_times,timezone,notes,best_time_to_call,created_at")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabaseAdmin
      .from("pie_reports")
      .select("id,quote_id,report,score,tier,confidence,created_at")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    getPortalState(quoteId),
  ]);

  const intake = asObj((quote as any).intake_normalized);
  const pie = parsePieReport(pieRes.data);

  const savedAssets = asArray<PortalAsset>(portalState?.assets);
  const savedMilestones = asArray<PortalMilestone>(portalState?.milestones);
  const defaults = buildDefaultMilestones({
    quoteStatus: String((quote as any).status || ""),
    depositStatus: String((quote as any).deposit_status || ""),
    assetsCount: savedAssets.length,
  });

  const mergedMilestones = mergeMilestones(defaults, savedMilestones);

  return {
    ok: true as const,
    data: {
      quote: {
        id: quoteId,
        publicToken: String((quote as any).public_token || ""),
        createdAt: String((quote as any).created_at || ""),
        status: String((quote as any).status || "new"),
        tier: String((quote as any).tier_recommended || "essential"),
        estimate: {
          target: num((quote as any).estimate_total),
          min: num((quote as any).estimate_low),
          max: num((quote as any).estimate_high),
        },
        deposit: {
          status: String((quote as any).deposit_status || "unpaid"),
          paidAt: str((quote as any).deposit_paid_at),
          link: str((quote as any).deposit_link),
          amount:
            num(portalState?.deposit_amount) ??
            (num((quote as any).estimate_total) != null
              ? Math.round((num((quote as any).estimate_total) as number) * 0.5)
              : null),
          notes: str(portalState?.deposit_notes),
        },
      },
      lead: {
        email: str((leadRes.data as any)?.email),
        phone: str((leadRes.data as any)?.phone),
        name: str((leadRes.data as any)?.name),
      },
      scope: {
        websiteType: str(intake.websiteType),
        pages: str(intake.pages),
        intent: str(intake.intent),
        timeline: str(intake.timeline),
        contentReady: str(intake.contentReady),
        domainHosting: str(intake.domainHosting),
        integrations: Array.isArray(intake.integrations)
          ? intake.integrations
          : typeof intake.integrations === "string" && intake.integrations
          ? [intake.integrations]
          : [],
        notes: str(intake.notes),
      },
      callRequest: callRes.data
        ? {
            status: str((callRes.data as any).status),
            bestTime:
              str((callRes.data as any).best_time_to_call) ||
              str((callRes.data as any).preferred_times),
            timezone: str((callRes.data as any).timezone),
            notes: str((callRes.data as any).notes),
          }
        : null,
      pie: {
        exists: pie.exists,
        id: pie.id,
        score: pie.score,
        tier: pie.tier,
        confidence: pie.confidence,
        summary: pie.summary,
        risks: pie.risks,
        pitch: pie.pitch,
        pricing: pie.pricing,
        hours: pie.hours,
        timelineText: pie.timelineText,
        discoveryQuestions: pie.discoveryQuestions,
      },
      portalState: {
        clientStatus: str(portalState?.client_status) || "new",
        clientUpdatedAt: str(portalState?.client_updated_at),
        clientNotes: str(portalState?.client_notes) || "",
        adminPublicNote: str(portalState?.admin_public_note),
        milestones: mergedMilestones,
        assets: savedAssets,
        revisions: asArray<PortalRevision>(portalState?.revision_requests),
      },
    },
  };
}

type PortalActionBody =
  | { type: "client_status"; clientStatus: string; clientNotes?: string }
  | { type: "milestone_toggle"; key: string; done: boolean }
  | {
      type: "asset_add";
      asset: { category: string; label: string; url: string; notes?: string };
    }
  | { type: "revision_add"; revision: { message: string; priority?: string } }
  | { type: "deposit_mark_paid"; note?: string };

export async function applyPortalAction(token: string, body: PortalActionBody) {
  const portal = await getPortalBundleByToken(token);
  if (!portal.ok) return portal;

  const quoteId = portal.data.quote.id;
  const existing = (await getPortalState(quoteId)) ?? { quote_id: quoteId };

  const milestones = asArray<PortalMilestone>(existing.milestones);
  const assets = asArray<PortalAsset>(existing.assets);
  const revisions = asArray<PortalRevision>(existing.revision_requests);

  const patch: PortalStateRow = {
    quote_id: quoteId,
    client_status: existing.client_status ?? "new",
    client_updated_at: existing.client_updated_at ?? null,
    client_notes: existing.client_notes ?? "",
    milestones,
    assets,
    revision_requests: revisions,
    deposit_amount: existing.deposit_amount ?? portal.data.quote.deposit.amount ?? null,
    deposit_notes: existing.deposit_notes ?? null,
    admin_public_note: existing.admin_public_note ?? null,
  };

  switch (body.type) {
    case "client_status": {
      patch.client_status = body.clientStatus || "new";
      patch.client_notes = body.clientNotes ?? patch.client_notes ?? "";
      patch.client_updated_at = isoNow();
      break;
    }

    case "milestone_toggle": {
      const next = [...milestones];
      const idx = next.findIndex((m) => m.key === body.key);
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          done: !!body.done,
          updatedAt: isoNow(),
        };
      } else {
        next.push({
          key: body.key,
          label: body.key,
          done: !!body.done,
          updatedAt: isoNow(),
        });
      }
      patch.milestones = next;
      patch.client_updated_at = isoNow();
      break;
    }

    case "asset_add": {
      const a = body.asset;
      if (!a?.url || !a?.label) {
        return { ok: false as const, error: "Asset label and URL are required." };
      }
      const next: PortalAsset[] = [
        {
          id: makeId(),
          category: (a.category || "General").trim(),
          label: a.label.trim(),
          url: a.url.trim(),
          notes: (a.notes || "").trim(),
          status: "submitted",
          createdAt: isoNow(),
        },
        ...assets,
      ];
      patch.assets = next;
      patch.client_status = "content_submitted";
      patch.client_updated_at = isoNow();
      break;
    }

    case "revision_add": {
      const msg = (body.revision?.message || "").trim();
      if (!msg) {
        return { ok: false as const, error: "Revision request message is required." };
      }
      const next: PortalRevision[] = [
        {
          id: makeId(),
          message: msg,
          priority:
            body.revision?.priority === "low" ||
            body.revision?.priority === "high" ||
            body.revision?.priority === "normal"
              ? body.revision.priority
              : "normal",
          status: "new",
          createdAt: isoNow(),
        },
        ...revisions,
      ];
      patch.revision_requests = next;
      patch.client_status = "revision_requested";
      patch.client_updated_at = isoNow();
      break;
    }

    case "deposit_mark_paid": {
      patch.client_status = "deposit_sent";
      patch.client_notes = [patch.client_notes, body.note || "Client marked deposit as paid."]
        .filter(Boolean)
        .join("\n")
        .trim();
      patch.client_updated_at = isoNow();
      break;
    }

    default:
      return { ok: false as const, error: "Unknown portal action." };
  }

  await upsertPortalState(patch);
  return getPortalBundleByToken(token);
}