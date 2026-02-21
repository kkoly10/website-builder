// app/api/internal/portal/admin-update/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ensureCustomerPortalForQuoteId } from "@/lib/customerPortal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MilestoneInput = {
  title: string;
  status?: string;
  notes?: string;
  due_date?: string | null;
  sort_order?: number;
};

export async function POST(req: Request) {
  try {
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

    return NextResponse.json({ ok: true, portalId: portal.id });
  } catch (err: any) {
    console.error("portal/admin-update error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update portal" },
      { status: 500 }
    );
  }
}