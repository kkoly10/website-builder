import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getEcommerceWorkspaceBundle, makeClientSafeEcommerceBundle } from "@/lib/ecommerce/workspace";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(`/portal/ecommerce/${id}`)}`);

  const { data: intake } = await supabaseAdmin
    .from("ecom_intakes")
    .select("id, auth_user_id, email")
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

  const bundle = await getEcommerceWorkspaceBundle(id, { isAdmin: false });
  if (!bundle) notFound();

  return (
    <>
      <EcomPortalClient data={makeClientSafeEcommerceBundle(bundle, { isAdmin: false })} />
      <ScrollReveal />
    </>
  );
}
