import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import EcomPortalClient from "./EcomPortalClient";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

export default async function EcommercePortalWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(`/portal/ecommerce/${id}`)}`);

  const { data: intake } = await supabaseAdmin
    .from("ecom_intakes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!intake) notFound();

  const userEmail = normalizeEmail(user.email);
  const intakeEmail = normalizeEmail(intake.email);
  const ownsByUserId = intake.auth_user_id && intake.auth_user_id === user.id;
  const ownsByEmail = !!userEmail && !!intakeEmail && userEmail === intakeEmail;

  if (!ownsByUserId && !ownsByEmail) {
    redirect("/portal");
  }

  if (!intake.auth_user_id && ownsByEmail) {
    await supabaseAdmin.from("ecom_intakes").update({ auth_user_id: user.id }).eq("id", intake.id);
  }

  const [{ data: call }, { data: quote }] = await Promise.all([
    supabaseAdmin
      .from("ecom_call_requests")
      .select("*")
      .eq("ecom_intake_id", intake.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("ecom_quotes")
      .select("*")
      .eq("ecom_intake_id", intake.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <>
      <EcomPortalClient
        data={{
          intake,
          quote: quote || null,
          call: call || null,
          isAdmin: false,
        }}
      />
      <ScrollReveal />
    </>
  );
}
