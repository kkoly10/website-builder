import { notFound, redirect } from "next/navigation";
import {
  claimCustomerRecordsForUser,
  createSupabaseServerClient,
  isAdminUser,
} from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpsWorkspaceBundle } from "@/lib/opsWorkspace/server";
import OpsPortalClient from "./OpsPortalClient";

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
    .select("id, auth_user_id, email")
    .eq("id", opsIntakeId)
    .maybeSingle();

  if (intakeError) {
    throw new Error(intakeError.message);
  }

  if (!intake) {
    notFound();
  }

  if (!admin && intake.auth_user_id !== user.id) {
    redirect("/portal");
  }

  const bundle = await getOpsWorkspaceBundle(opsIntakeId);
  if (!bundle) {
    notFound();
  }

  return <OpsPortalClient initialData={bundle} />;
}
