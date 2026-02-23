// app/internal/layout.tsx
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  isAdminEmail,
} from "@/lib/supabase/server";

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/internal/admin");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/auth/login?error=Admin access required.");
  }

  return <>{children}</>;
}