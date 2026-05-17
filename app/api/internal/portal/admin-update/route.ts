// app/api/internal/portal/admin-update/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  editDesignDirectionPayloadByQuoteId,
  editDirectionPayloadByQuoteId,
  ensureCustomerPortalForQuoteId,
  transitionDesignDirectionByQuoteId,
  transitionDirectionByQuoteId,
  type DesignDirectionAdminAction,
  type DirectionAdminAction,
} from "@/lib/customerPortal";
import { requireAdminRoute, enforceAdminRateLimit } from "@/lib/routeAuth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIpFromHeaders } from "@/lib/rateLimit";
import { logProjectActivityByPortalId } from "@/lib/projectActivity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_DD_ACTIONS: DesignDirectionAdminAction[] = [
  "mark_under_review",
  "request_changes",
  "approve",
  "lock",
  "unlock",
];

const VALID_DIRECTION_ACTIONS: DirectionAdminAction[] = [
  "mark_under_review",
  "request_changes",
  "approve",
  "lock",
  "unlock",
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
    const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-portal-update", limit: 30 });
    if (rlErr) return rlErr;

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

      // Audit log for admin patches. Without this entry, status flips
      // (deposit_status, project_status) and kickoff_notes edits left
      // no trail in project_activity — admins couldn't reconstruct
      // who changed what and when. Captures the actor's user_id +
      // email + ip + the field names changed (not the values, to keep
      // the log compact and free of sensitive payloads).
      try {
        const supabase = await createSupabaseServerClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await logProjectActivityByPortalId({
          portalProjectId: portal.id,
          actorRole: "studio",
          eventType: "admin_portal_update",
          summary: `Admin updated portal fields: ${Object.keys(patch).join(", ")}.`,
          payload: {
            fields: Object.keys(patch),
            actorUserId: user?.id ?? null,
            actorEmail: user?.email ?? null,
            actorIp: getIpFromHeaders(req.headers),
          },
          clientVisible: false,
        });
      } catch (logErr) {
        // Non-fatal: the patch already succeeded. Log to console so
        // we notice gaps in audit coverage but don't fail the request.
        console.error("admin-update audit log error:", logErr);
      }
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
    let updatedDesignDirection = null;
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
        updatedDesignDirection = await transitionDesignDirectionByQuoteId({
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

    // Phase 3.5: lane-agnostic direction transition for non-website lanes.
    // Mutually exclusive with designDirection — admins of website projects
    // use designDirection; admins of other lanes use direction. The route
    // accepts both shapes so a single admin client can dispatch correctly.
    let updatedDirection = null;
    if (body?.direction && typeof body.direction === "object") {
      const dd = body.direction as Record<string, unknown>;
      const action = String(dd.action || "").trim() as DirectionAdminAction;
      if (!VALID_DIRECTION_ACTIONS.includes(action)) {
        return NextResponse.json(
          { ok: false, error: "Unknown direction action." },
          { status: 400 },
        );
      }

      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      try {
        updatedDirection = await transitionDirectionByQuoteId({
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
          { ok: false, error: err?.message || "Direction transition failed." },
          { status: 400 },
        );
      }
    }

    // Admin payload edits (typo fixes, fill-ins for off-portal submits).
    // Mutually exclusive with the transition blocks above — admin should
    // either flip status or edit fields, not both in one call. The body
    // shape mirrors the transition shape (designDirectionEdit /
    // directionEdit) so dispatch is unambiguous.
    if (body?.designDirectionEdit && typeof body.designDirectionEdit === "object") {
      const dde = body.designDirectionEdit as Record<string, unknown>;
      const patch = dde.patch && typeof dde.patch === "object" ? dde.patch : null;
      if (!patch) {
        return NextResponse.json(
          { ok: false, error: "designDirectionEdit.patch is required." },
          { status: 400 },
        );
      }

      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      try {
        updatedDesignDirection = await editDesignDirectionPayloadByQuoteId({
          quoteId,
          patch: patch as any,
          actor: {
            userId: user?.id ?? null,
            email: user?.email ?? null,
            ip: getIpFromHeaders(req.headers),
          },
        });
      } catch (err: any) {
        return NextResponse.json(
          { ok: false, error: err?.message || "Design direction edit failed." },
          { status: 400 },
        );
      }
    }

    if (body?.directionEdit && typeof body.directionEdit === "object") {
      const de = body.directionEdit as Record<string, unknown>;
      const payload = de.payload && typeof de.payload === "object" ? de.payload : null;
      if (!payload) {
        return NextResponse.json(
          { ok: false, error: "directionEdit.payload is required." },
          { status: 400 },
        );
      }

      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      try {
        updatedDirection = await editDirectionPayloadByQuoteId({
          quoteId,
          payload: payload as Record<string, unknown>,
          actor: {
            userId: user?.id ?? null,
            email: user?.email ?? null,
            ip: getIpFromHeaders(req.headers),
          },
        });
      } catch (err: any) {
        return NextResponse.json(
          { ok: false, error: err?.message || "Direction edit failed." },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      portalId: portal.id,
      // Returned so the admin UI can update local state without a separate
      // refetch. Null when the call didn't include the corresponding block.
      designDirection: updatedDesignDirection,
      direction: updatedDirection,
    });
  } catch (err: any) {
    console.error("portal/admin-update error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update portal" },
      { status: 500 }
    );
  }
}