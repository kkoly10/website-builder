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

  // Phase 3.8 follow-up: if the silo migration created a unified portal
  // for this silo ecom intake, redirect to the new tokenized URL. Makes
  // /portal/[token] the canonical home; this silo page only renders for
  // un-migrated rows (none today, but kept as a safety net).
  const { data: candidates } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("access_token, scope_snapshot")
    .eq("project_type", "ecommerce");
  const match = (candidates ?? []).find((p) => {
    const m = (p as any)?.scope_snapshot?.silo_migration;
    return m?.source === "ecom_intake" && m?.original_id === id;
  });
  if (match?.access_token) {
    redirect(`/portal/${match.access_token}`);
  }

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
