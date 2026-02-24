import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !isAdminEmail(user.email)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const opsIntakeId = String(body?.opsIntakeId ?? "").trim();

    if (!opsIntakeId) {
      return NextResponse.json(
        { ok: false, error: "Missing opsIntakeId" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("ops_intakes")
      .update({
        status: "contacted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", opsIntakeId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "contacted" });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}