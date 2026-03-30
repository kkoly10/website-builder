import { NextRequest, NextResponse } from "next/server";
import {
  claimCustomerRecordsForUser,
  createSupabaseServerClient,
  isAdminUser,
  normalizeEmail,
} from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getParams(
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  return await Promise.resolve(ctx.params);
}

async function fetchBundle(intakeId: string, isAdmin: boolean) {
  const [{ data: intake }, { data: call }, { data: quote }] = await Promise.all([
    supabaseAdmin
      .from("ecom_intakes")
      .select("*")
      .eq("id", intakeId)
      .maybeSingle(),
    supabaseAdmin
      .from("ecom_call_requests")
      .select("*")
      .eq("ecom_intake_id", intakeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("ecom_quotes")
      .select("*")
      .eq("ecom_intake_id", intakeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!intake) return null;

  return {
    intake,
    quote: quote || null,
    call: call || null,
    isAdmin,
  };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await getParams(ctx);

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await claimCustomerRecordsForUser({ userId: user.id, email: user.email });
    const admin = await isAdminUser({ userId: user.id, email: user.email });

    const { data: intake } = await supabaseAdmin
      .from("ecom_intakes")
      .select("id, auth_user_id, email")
      .eq("id", id)
      .maybeSingle();

    if (!intake) {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }

    const userEmail = normalizeEmail(user.email);
    const intakeEmail = normalizeEmail(intake.email);
    const owns = intake.auth_user_id === user.id || (!!userEmail && !!intakeEmail && userEmail === intakeEmail);

    if (!admin && !owns) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const bundle = await fetchBundle(id, !!admin);
    if (!bundle) {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: bundle });
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
    const body = await req.json();
    const actionType = String(body?.type || "");

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdminUser({ userId: user.id, email: user.email });

    const { data: intake } = await supabaseAdmin
      .from("ecom_intakes")
      .select("id, auth_user_id, email")
      .eq("id", id)
      .maybeSingle();

    if (!intake) {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }

    const userEmail = normalizeEmail(user.email);
    const intakeEmail = normalizeEmail(intake.email);
    const owns = intake.auth_user_id === user.id || (!!userEmail && !!intakeEmail && userEmail === intakeEmail);

    if (!admin && !owns) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Get the latest quote for this intake
    const { data: quote } = await supabaseAdmin
      .from("ecom_quotes")
      .select("id, quote_json")
      .eq("ecom_intake_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    switch (actionType) {
      case "agreement_accept": {
        if (!quote) {
          return NextResponse.json({ ok: false, error: "No quote found to accept." }, { status: 400 });
        }
        const existingJson = (quote.quote_json && typeof quote.quote_json === "object") ? quote.quote_json : {};
        const { error } = await supabaseAdmin
          .from("ecom_quotes")
          .update({
            quote_json: {
              ...existingJson,
              agreement_status: "accepted",
              agreement_accepted_at: now,
            },
            updated_at: now,
          })
          .eq("id", quote.id);
        if (error) {
          return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }
        break;
      }

      case "deposit_notice_sent": {
        if (!quote) {
          return NextResponse.json({ ok: false, error: "No quote found." }, { status: 400 });
        }
        const existingJson = (quote.quote_json && typeof quote.quote_json === "object") ? quote.quote_json : {};
        const { error } = await supabaseAdmin
          .from("ecom_quotes")
          .update({
            quote_json: {
              ...existingJson,
              deposit_notice: body.note || "Client reported deposit sent.",
              deposit_notice_sent_at: now,
            },
            updated_at: now,
          })
          .eq("id", quote.id);
        if (error) {
          return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }
        break;
      }

      default:
        return NextResponse.json({ ok: false, error: "Unknown action type." }, { status: 400 });
    }

    const bundle = await fetchBundle(id, !!admin);
    if (!bundle) {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: bundle });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
