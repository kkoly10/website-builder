import { NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

export async function requireAdminRoute(): Promise<NextResponse | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = await isAdminUser({
      userId: user?.id ?? null,
      email: user?.email ?? null,
    });

    if (!admin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    return null; // authorized
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
