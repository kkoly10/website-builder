import { NextRequest, NextResponse } from "next/server";
import {
  claimCustomerRecordsForUser,
  createSupabaseServerClient,
  isAdminUser,
} from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpsWorkspaceBundle } from "@/lib/opsWorkspace/server";
import {
  enrichOpsBundle,
  getWorkspaceState,
  saveWorkspaceState,
  makeClientSafeOpsBundle,
} from "@/lib/opsWorkspace/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getParams(
  ctx: { params: Promise<{ opsIntakeId: string }> | { opsIntakeId: string } }
) {
  return await Promise.resolve(ctx.params);
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ opsIntakeId: string }> | { opsIntakeId: string } }
) {
  try {
    const { opsIntakeId } = await getParams(ctx);

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await claimCustomerRecordsForUser({ userId: user.id, email: user.email });
    const admin = await isAdminUser({ userId: user.id, email: user.email });

    const { data: intake, error } = await supabaseAdmin
      .from("ops_intakes")
      .select("id, auth_user_id")
      .eq("id", opsIntakeId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!intake) {
      return NextResponse.json({ ok: false, error: "Ops intake not found." }, { status: 404 });
    }

    if (!admin && intake.auth_user_id !== user.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const [bundle, state] = await Promise.all([
      getOpsWorkspaceBundle(opsIntakeId),
      getWorkspaceState(opsIntakeId),
    ]);

    if (!bundle) {
      return NextResponse.json({ ok: false, error: "Workspace not found." }, { status: 404 });
    }

    const enriched = enrichOpsBundle(bundle, state);
    const data = makeClientSafeOpsBundle(enriched, { isAdmin: !!admin });

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ opsIntakeId: string }> | { opsIntakeId: string } }
) {
  try {
    const { opsIntakeId } = await getParams(ctx);
    const body = await req.json();
    const actionType = String(body?.type || "");

    // Auth check
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdminUser({ userId: user.id, email: user.email });

    const { data: intake } = await supabaseAdmin
      .from("ops_intakes")
      .select("id, auth_user_id")
      .eq("id", opsIntakeId)
      .maybeSingle();

    if (!intake) {
      return NextResponse.json({ ok: false, error: "Ops intake not found." }, { status: 404 });
    }

    if (!admin && intake.auth_user_id !== user.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const state = await getWorkspaceState(opsIntakeId);
    const now = new Date().toISOString();

    switch (actionType) {
      case "agreement_accept": {
        await saveWorkspaceState(opsIntakeId, {
          ...state,
          agreementStatus: "accepted",
          agreementAcceptedAt: now,
          lastSavedAt: now,
        });
        break;
      }

      case "deposit_notice_sent": {
        await saveWorkspaceState(opsIntakeId, {
          ...state,
          depositNotice: body.note || "Client reported deposit sent.",
          depositNoticeSentAt: now,
          lastSavedAt: now,
        });
        break;
      }

      default:
        return NextResponse.json({ ok: false, error: "Unknown action type." }, { status: 400 });
    }

    // Return refreshed bundle
    const [bundle, freshState] = await Promise.all([
      getOpsWorkspaceBundle(opsIntakeId),
      getWorkspaceState(opsIntakeId),
    ]);

    if (!bundle) {
      return NextResponse.json({ ok: false, error: "Workspace not found." }, { status: 404 });
    }

    const enriched = enrichOpsBundle(bundle, freshState);
    const data = makeClientSafeOpsBundle(enriched, { isAdmin: !!admin });

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}