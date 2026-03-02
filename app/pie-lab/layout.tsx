// app/pie-lab/layout.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PieLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      redirect("/login?next=/pie-lab");
    }
  } catch {
    redirect("/login?next=/pie-lab");
  }

  return <>{children}</>;
}
