// app/internal/project/[quoteId]/page.tsx
import { createClient } from "@supabase/supabase-js";
import ProjectWorkspaceClient from "./ProjectWorkspaceClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function makeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function InternalProjectWorkspacePage({
  params,
}: {
  params: { quoteId: string };
}) {
  const quoteId = params.quoteId;
  const supabase = makeAdminClient();

  // Ensure project exists (via RPC)
  const ensureRes = await supabase.rpc("ensure_project_for_quote", { p_quote_id: quoteId });
  const projectId = ensureRes.data ? String(ensureRes.data) : null;

  let project: any = null;
  let quote: any = null;
  let pie: any = null;
  let snapshots: any[] = [];
  let changeOrders: any[] = [];

  if (projectId) {
    const [projectRes, quoteRes, pieRes, snapRes, coRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
      supabase.from("quotes").select("*").eq("id", quoteId).maybeSingle(),
      supabase
        .from("pie_reports")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_scope_snapshots")
        .select("*")
        .eq("project_id", projectId)
        .order("version_no", { ascending: false }),
      supabase
        .from("project_change_orders")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);

    project = projectRes.data ?? null;
    quote = quoteRes.data ?? null;
    pie = pieRes.data ?? null;
    snapshots = snapRes.data ?? [];
    changeOrders = coRes.data ?? [];
  }

  return (
    <div className="container" style={{ paddingTop: 16, paddingBottom: 24 }}>
      <h1 style={{ marginBottom: 6 }}>Project Workspace</h1>
      <div className="smallNote" style={{ marginBottom: 14 }}>
        Manage scope snapshots and change orders for this quote/project.
      </div>

      {!projectId ? (
        <div className="card">
          <div className="cardInner">
            Could not load or create a project for quote <code>{quoteId}</code>.
          </div>
        </div>
      ) : (
        <ProjectWorkspaceClient
          quoteId={quoteId}
          projectId={projectId}
          project={project}
          quote={quote}
          pie={pie}
          initialSnapshots={snapshots}
          initialChangeOrders={changeOrders}
        />
      )}
    </div>
  );
}