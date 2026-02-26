import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";

export default async function PortalTokenLayout(props: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  // NEXT.JS 15+ FIX: Await params
  const params = await props.params;
  const token = params.token;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect(`/login?next=${encodeURIComponent(`/portal/${token}`)}&token=${encodeURIComponent(token)}`);
  }

  // FIX: Fetch from the 'quotes' table using public_token, since the dashboard is quote-driven.
  const { data: quote, error } = await supabase
    .from("quotes")
    .select("id, lead_email, public_token")
    .eq("public_token", token)
    .single();

  if (error || !quote) {
    notFound(); // Triggers the Next.js 404 page if token is invalid
  }

  const email = user.email.toLowerCase();
  const leadEmail = String(quote.lead_email || "").toLowerCase();

  // Security Gate
  if (!isAdminEmail(email) && email !== leadEmail) {
    redirect(
      `/login?error=${encodeURIComponent("This account does not match the portal email for this project.")}&next=${encodeURIComponent(`/portal/${token}`)}`
    );
  }

  return <>{props.children}</>;
}
