import { notFound, redirect } from "next/navigation";
import {
  claimCustomerRecordsForUser,
  createSupabaseServerClient,
  isAdminUser,
} from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpsWorkspaceBundle } from "@/lib/opsWorkspace/server";
import {
  enrichOpsBundle,
  getWorkspaceState,
  makeClientSafeOpsBundle,
} from "@/lib/opsWorkspace/state";
import OpsPortalClient from "./OpsPortalClient";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

type Params = {
  opsIntakeId: string;
};

export default async function OpsPortalWorkspacePage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const resolved = await Promise.resolve(params);
  const opsIntakeId = resolved.opsIntakeId;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/portal/ops/${opsIntakeId}`)}`);
  }

  await claimCustomerRecordsForUser({ userId: user.id, email: user.email });
  const admin = await isAdminUser({ userId: user.id, email: user.email });

  const { data: intake, error: intakeError } = await supabaseAdmin
    .from("ops_intakes")
    .select("id, auth_user_id")
    .eq("id", opsIntakeId)
    .maybeSingle();

  if (intakeError || !intake) {
    notFound();
  }

  if (!admin && intake.auth_user_id !== user.id) {
    redirect("/portal");
  }

  const [bundle, state] = await Promise.all([
    getOpsWorkspaceBundle(opsIntakeId),
    getWorkspaceState(opsIntakeId),
  ]);

  if (!bundle) {
    notFound();
  }

  const enriched = enrichOpsBundle(bundle, state);
  const safeBundle = makeClientSafeOpsBundle(enriched, { isAdmin: !!admin });

  return (
    <>
      <OpsPortalClient initialData={safeBundle} />
      <ScrollReveal />
    </>
  );
}