import { NextRequest, NextResponse } from "next/server";
import {
  claimCustomerRecordsForUser,
  createSupabaseServerClient,
  isAdminUser,
} from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpsWorkspaceBundle } from "@/lib/opsWorkspace/server";

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

    const bundle = await getOpsWorkspaceBundle(opsIntakeId);
    if (!bundle) {
      return NextResponse.json({ ok: false, error: "Workspace not found." }, { status: 404 });
    }

    // Filter out admin-only fields for client portal
    const clientSafe = {
      ...bundle,
      ghostAdmin: {
        ...bundle.ghostAdmin,
        starterPrompts: [], // admin-only
      },
      intake: {
        ...bundle.intake,
        notes: "", // internal intake notes
      },
    };

    return NextResponse.json({ ok: true, data: admin ? bundle : clientSafe });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
