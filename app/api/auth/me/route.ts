import { NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      return NextResponse.json({ email: null, admin: false });
    }

    const admin = await isAdminUser({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({ email: user.email, admin });
  } catch {
    return NextResponse.json({ email: null, admin: false });
  }
}
