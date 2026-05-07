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

  // Phase 3.8 follow-up: if the silo migration created a unified portal
  // for this silo intake, redirect to the new tokenized URL. Makes
  // /portal/[token] the canonical home; this silo page only renders for
  // un-migrated rows (none today, but kept as a safety net).
  // Filtered server-side via the project_type narrowing then matched in
  // JS — the migrated set is ~16 rows so the overhead is negligible and
  // we avoid supabase-js JSON-path filter syntax fragility.
  const { data: candidates } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("access_token, scope_snapshot")
    .eq("project_type", "automation");
  const match = (candidates ?? []).find((p) => {
    const m = (p as any)?.scope_snapshot?.silo_migration;
    return m?.source === "ops_intake" && m?.original_id === opsIntakeId;
  });
  if (match?.access_token) {
    redirect(`/portal/${match.access_token}`);
  }

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