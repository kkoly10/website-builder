import { NextRequest, NextResponse } from "next/server";
import {
  claimCustomerRecordsForUser,
  createSupabaseServerClient,
  isAdminUser,
  normalizeEmail,
} from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getEcommerceWorkspaceBundle,
  makeClientSafeEcommerceBundle,
  saveEcommerceWorkspaceState,
} from "@/lib/ecommerce/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getParams(
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  return await Promise.resolve(ctx.params);
}

async function resolveAccess(intakeId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "Unauthorized", status: 401 };

  await claimCustomerRecordsForUser({ userId: user.id, email: user.email });
  const admin = await isAdminUser({ userId: user.id, email: user.email });

  const { data: intake } = await supabaseAdmin
    .from("ecom_intakes")
    .select("id, auth_user_id, email")
    .eq("id", intakeId)
    .maybeSingle();

  if (!intake) return { ok: false as const, error: "Not found.", status: 404 };

  const userEmail = normalizeEmail(user.email);
  const intakeEmail = normalizeEmail(intake.email);
  const owns = intake.auth_user_id === user.id || (!!userEmail && !!intakeEmail && userEmail === intakeEmail);

  if (!admin && !owns) {
    return { ok: false as const, error: "Forbidden", status: 403 };
  }

  if (!intake.auth_user_id && owns) {
    await supabaseAdmin.from("ecom_intakes").update({ auth_user_id: user.id }).eq("id", intake.id);
  }

  return { ok: true as const, user, admin: !!admin };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await getParams(ctx);
    const access = await resolveAccess(id);
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
    }

    const bundle = await getEcommerceWorkspaceBundle(id, { isAdmin: access.admin });
    if (!bundle) {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: makeClientSafeEcommerceBundle(bundle, { isAdmin: access.admin }) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await getParams(ctx);
    const access = await resolveAccess(id);
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
    }

    const body = await req.json();
    const actionType = String(body?.type || "").trim();
    const now = new Date().toISOString();

    switch (actionType) {
      case "agreement_accept": {
        const save = await saveEcommerceWorkspaceState({
          ecomIntakeId: id,
          savedBy: access.admin ? "admin" : "client",
          patch: {
            agreementStatus: "accepted",
            agreementAcceptedAt: now,
          },
        });
        if (!save.ok) {
          return NextResponse.json({ ok: false, error: save.error }, { status: 500 });
        }
        break;
      }

      case "deposit_notice_sent": {
        const save = await saveEcommerceWorkspaceState({
          ecomIntakeId: id,
          savedBy: access.admin ? "admin" : "client",
          patch: {
            depositNotice: String(body?.note || "Client reported deposit sent.").trim(),
            depositNoticeSentAt: now,
          },
        });
        if (!save.ok) {
          return NextResponse.json({ ok: false, error: save.error }, { status: 500 });
        }
        break;
      }

      default:
        return NextResponse.json({ ok: false, error: "Unknown action type." }, { status: 400 });
    }

    const bundle = await getEcommerceWorkspaceBundle(id, { isAdmin: access.admin });
    if (!bundle) {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: makeClientSafeEcommerceBundle(bundle, { isAdmin: access.admin }) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
