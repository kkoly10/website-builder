// app/api/internal/admin/change-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function num(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function ensureProjectIdForQuote(quoteId: string): Promise<string> {
  const rpc = await supabaseAdmin.rpc("ensure_project_for_quote", { p_quote_id: quoteId });
  if (rpc.error) throw new Error(rpc.error.message || "Failed to ensure project");
  if (!rpc.data) throw new Error("ensure_project_for_quote returned no project id");
  return String(rpc.data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "");

    if (!action) {
      return NextResponse.json({ ok: false, error: "Missing action" }, { status: 400 });
    }

    if (action === "create") {
      const quoteId = String(body?.quoteId || "");
      if (!quoteId) {
        return NextResponse.json({ ok: false, error: "Missing quoteId" }, { status: 400 });
      }

      const projectId = await ensureProjectIdForQuote(quoteId);

      const insertRes = await supabaseAdmin
        .from("project_change_orders")
        .insert({
          project_id: projectId,
          quote_id: quoteId,
          base_snapshot_id: body?.baseSnapshotId || null,
          title: body?.title || "Scope change",
          reason: body?.reason || null,
          client_message: body?.clientMessage || null,
          admin_notes: body?.adminNotes || null,
          delta_price: num(body?.deltaPrice),
          delta_hours: num(body?.deltaHours),
          status: body?.status || "requested",
          requested_by: body?.requestedBy || "admin",
          details: body?.details && typeof body.details === "object" ? body.details : {},
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (insertRes.error) throw new Error(insertRes.error.message);

      return NextResponse.json({ ok: true, changeOrder: insertRes.data });
    }

    if (action === "update") {
      const changeOrderId = String(body?.changeOrderId || "");
      if (!changeOrderId) {
        return NextResponse.json({ ok: false, error: "Missing changeOrderId" }, { status: 400 });
      }

      const patch: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (typeof body?.title === "string") patch.title = body.title;
      if (typeof body?.reason === "string") patch.reason = body.reason;
      if (typeof body?.clientMessage === "string") patch.client_message = body.clientMessage;
      if (typeof body?.adminNotes === "string") patch.admin_notes = body.adminNotes;
      if (body?.deltaPrice !== undefined) patch.delta_price = num(body.deltaPrice);
      if (body?.deltaHours !== undefined) patch.delta_hours = num(body.deltaHours);
      if (typeof body?.status === "string") {
        patch.status = body.status;
        if (body.status === "approved") patch.approved_at = new Date().toISOString();
      }
      if (body?.appliedSnapshotId !== undefined) {
        patch.applied_snapshot_id = body.appliedSnapshotId || null;
        if (body?.status === "applied") patch.applied_at = new Date().toISOString();
      }
      if (body?.details && typeof body.details === "object") patch.details = body.details;

      const { data, error } = await supabaseAdmin
        .from("project_change_orders")
        .update(patch)
        .eq("id", changeOrderId)
        .select("*")
        .single();

      if (error) throw new Error(error.message);

      return NextResponse.json({ ok: true, changeOrder: data });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}