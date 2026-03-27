import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { getOpsWorkspaceBundle } from "@/lib/opsWorkspace/server";
import { enrichOpsBundle, getWorkspaceState } from "@/lib/opsWorkspace/state";
import OpsProjectControlClient from "./OpsProjectControlClient";

export const dynamic = "force-dynamic";

type Params = {
  id: string;
};

export default async function OpsAdminDetailPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const resolved = await Promise.resolve(params);
  const opsIntakeId = resolved.id;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/internal/admin/ops/${opsIntakeId}`)}`);
  }

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const [bundle, state] = await Promise.all([
    getOpsWorkspaceBundle(opsIntakeId),
    getWorkspaceState(opsIntakeId),
  ]);

  if (!bundle) notFound();

  return <OpsProjectControlClient initialData={enrichOpsBundle(bundle, state)} />;
}