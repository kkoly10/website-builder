import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { getEcommerceWorkspaceBundle } from "@/lib/ecommerce/workspace";
import { getGhostProjectSnapshot } from "@/lib/ghost/snapshot";
import GhostProjectSidebar from "@/components/internal/ghost/GhostProjectSidebar";
import EcommerceWorkspaceControlClient from "./EcommerceWorkspaceControlClient";

export const dynamic = "force-dynamic";

type ParamsPromise = Promise<{ id: string }>;

export default async function EcommerceAdminDetailPage(props: { params: ParamsPromise }) {
  const params = await props.params;
  const id = params.id;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(`/internal/admin/ecommerce/${id}`)}`);

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const [bundle, snapshot] = await Promise.all([
    getEcommerceWorkspaceBundle(id, { isAdmin: true }),
    getGhostProjectSnapshot("ecommerce", id),
  ]);

  if (!bundle) notFound();

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 12, alignItems: "start" }}>
        <EcommerceWorkspaceControlClient initialData={bundle} />
        <GhostProjectSidebar lane="ecommerce" projectId={id} snapshot={snapshot} />
      </div>
    </section>
  );
}
