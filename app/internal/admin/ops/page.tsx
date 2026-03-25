import { redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { getOpsAdminRows } from "@/lib/opsWorkspace/server";
import OpsPipelineClient from "./OpsPipelineClient";

export const dynamic = "force-dynamic";

export default async function OpsAdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/internal/admin/ops");

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const rows = await getOpsAdminRows();

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" />
            Ops HQ
          </div>
          <h1 className="h2">Workflow Systems Pipeline</h1>
          <p className="pDark" style={{ marginTop: 4 }}>
            Review ops intakes, discovery status, PIE diagnosis, recommended tools,
            and the internal Ghost Admin blueprint for each workflow project.
          </p>
        </div>
      </div>

      <OpsPipelineClient initialRows={rows} />
    </section>
  );
}
