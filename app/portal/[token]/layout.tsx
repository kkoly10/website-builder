// app/portal/[token]/layout.tsx
import { notFound, redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  isAdminEmail,
} from "@/lib/supabase/server";

export default async function PortalTokenLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }> | { token: string };
}) {
  const { token } = await Promise.resolve(params as any);

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect(
      `/auth/login?next=${encodeURIComponent(`/portal/${token}`)}&token=${encodeURIComponent(token)}`
    );
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, lead_email, portal_token")
    .eq("portal_token", token)
    .single();

  if (error || !project) {
    notFound();
  }

  const email = user.email.toLowerCase();
  const leadEmail = String(project.lead_email || "").toLowerCase();

  if (!isAdminEmail(email) && email !== leadEmail) {
    redirect(
      `/auth/login?error=${encodeURIComponent(
        "This account does not match the portal email for this project."
      )}&next=${encodeURIComponent(`/portal/${token}`)}&token=${encodeURIComponent(
        token
      )}`
    );
  }

  return <>{children}</>;
}