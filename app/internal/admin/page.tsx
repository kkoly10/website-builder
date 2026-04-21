import { redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { listAdminProjectData } from "@/lib/adminProjectData";
import AdminPipelineClient from "./AdminPipelineClient";

export const dynamic = "force-dynamic";

export default async function WebPipelinePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/internal/admin");
  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const projects = await listAdminProjectData();

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" />
            Website pipeline
          </div>
          <h1 className="h2">Master-detail control for website projects</h1>
          <p className="pDark" style={{ marginTop: 4 }}>
            Triage quotes, adjust pricing, publish workspaces, and manage client-facing
            project state from one shared admin workbench.
          </p>
        </div>
      </div>

      <AdminPipelineClient initialProjects={projects} />
    </section>
  );
}
