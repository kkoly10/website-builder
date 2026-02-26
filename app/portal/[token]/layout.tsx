import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function PortalTokenLayout(props: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const params = await props.params;
  const token = params.token;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect(`/login?next=${encodeURIComponent(`/portal/${token}`)}`);
  }

  const { data: quote, error } = await supabaseAdmin
    .from("quotes")
    .select("id, lead_email, public_token")
    .eq("public_token", token)
    .single();

  if (error || !quote) {
    notFound(); 
  }

  const email = user.email.toLowerCase();
  const leadEmail = String(quote.lead_email || "").toLowerCase();

  if (!isAdminEmail(email) && email !== leadEmail) {
    redirect(
      `/login?error=${encodeURIComponent("This account does not match the portal email for this project.")}&next=${encodeURIComponent(`/portal/${token}`)}`
    );
  }

  return <>{props.children}</>;
}
