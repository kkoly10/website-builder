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

  // Resolve the quote via either access_token (primary) or public_token (fallback)
  let quoteId: string | null = null;
  let leadEmail: string = "";

  const { data: portalProject } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("quote_id")
    .eq("access_token", token)
    .maybeSingle();

  if (portalProject?.quote_id) {
    quoteId = portalProject.quote_id;
  } else {
    const { data: quoteByToken } = await supabaseAdmin
      .from("quotes")
      .select("id")
      .eq("public_token", token)
      .maybeSingle();
    quoteId = quoteByToken?.id ?? null;
  }

  if (!quoteId) {
    notFound();
  }

  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("lead_email")
    .eq("id", quoteId)
    .maybeSingle();

  if (!quote) {
    notFound();
  }

  const email = user.email.toLowerCase();
  leadEmail = String(quote.lead_email || "").toLowerCase();

  if (!isAdminEmail(email) && email !== leadEmail) {
    redirect(
      `/login?error=${encodeURIComponent("This account does not match the portal email for this project.")}&next=${encodeURIComponent(`/portal/${token}`)}`
    );
  }

  return <>{props.children}</>;
}
