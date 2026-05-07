// app/api/internal/portal/admin-update/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  ensureCustomerPortalForQuoteId,
  transitionDesignDirectionByQuoteId,
  type DesignDirectionAdminAction,
} from "@/lib/customerPortal";
import { requireAdminRoute } from "@/lib/routeAuth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIpFromHeaders } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_DD_ACTIONS: DesignDirectionAdminAction[] = [
  "mark_under_review",
  "request_changes",
  "approve",
  "lock",
];

type MilestoneInput = {
  title: string;
  status?: string;
  notes?: string;
  due_date?: string | null;
  sort_order?: number;
};

export async function POST(req: Request) {
  try {
    const authErr = await requireAdminRoute();
    if (authErr) return authErr;

    const body = await req.json();
    const quoteId = String(body?.quoteId || "").trim();

    if (!quoteId) {
      return NextResponse.json(
        { ok: false, error: "quoteId is required" },
        { status: 400 }
      );
    }

    const portal = await ensureCustomerPortalForQuoteId(quoteId);

    const patch: Record<string, any> = {};
    if (typeof body.projectStatus === "string") patch.project_status = body.projectStatus;
    if (typeof body.depositStatus === "string") patch.deposit_status = body.depositStatus;
    if (typeof body.depositCheckoutUrl === "string") patch.deposit_checkout_url = body.depositCheckoutUrl || null;
    if (typeof body.depositAmountCents === "number") patch.deposit_amount_cents = body.depositAmountCents;
    if (typeof body.kickoffNotes === "string") patch.kickoff_notes = body.kickoffNotes || null;

    if (Object.keys(patch).length > 0) {
      const { error: updateErr } = await supabaseAdmin
        .from("customer_portal_projects")
        .update(patch)
        .eq("id", portal.id);

      if (updateErr) throw updateErr;
    }

    if (Array.isArray(body.milestones)) {
      const milestones = body.milestones as MilestoneInput[];

      const { error: delErr } = await supabaseAdmin
        .from("customer_portal_milestones")
        .delete()
        .eq("portal_project_id", portal.id);

      if (delErr) throw delErr;

      if (milestones.length > 0) {
        const rows = milestones.map((m, idx) => ({
          portal_project_id: portal.id,
          title: String(m.title || "").trim() || `Milestone ${idx + 1}`,
          status: String(m.status || "todo"),
          notes: m.notes?.trim() || null,
          due_date: m.due_date || null,
          sort_order: typeof m.sort_order === "number" ? m.sort_order : (idx + 1) * 10,
        }));

        const { error: insErr } = await supabaseAdmin
          .from("customer_portal_milestones")
          .insert(rows);

        if (insErr) throw insErr;
      }
    }

    // Design direction transition (Phase 2B). Optional — only runs if the
    // body includes `designDirection`. The other patches above run first
    // so admin can update notes, deposit, and milestones in the same call
    // before flipping the direction status.
    if (body?.designDirection && typeof body.designDirection === "object") {
      const dd = body.designDirection as Record<string, unknown>;
      const action = String(dd.action || "").trim() as DesignDirectionAdminAction;
      if (!VALID_DD_ACTIONS.includes(action)) {
        return NextResponse.json(
          { ok: false, error: "Unknown designDirection action." },
          { status: 400 },
        );
      }

      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      try {
        await transitionDesignDirectionByQuoteId({
          quoteId,
          action,
          publicNote: typeof dd.publicNote === "string" ? dd.publicNote : null,
          internalNote: typeof dd.internalNote === "string" ? dd.internalNote : null,
          actor: {
            userId: user?.id ?? null,
            email: user?.email ?? null,
            ip: getIpFromHeaders(req.headers),
            userAgent: req.headers.get("user-agent") || null,
          },
        });
      } catch (err: any) {
        return NextResponse.json(
          { ok: false, error: err?.message || "Design direction transition failed." },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({ ok: true, portalId: portal.id });
  } catch (err: any) {
    console.error("portal/admin-update error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update portal" },
      { status: 500 }
    );
  }
}