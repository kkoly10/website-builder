import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ProjectWorkspaceClient from "./ProjectWorkspaceClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// NEXT.JS 15+ FIX: params is now a Promise
type ParamsPromise = Promise<{ quoteId: string }>;

export default async function InternalProjectWorkspacePage(props: { params: ParamsPromise }) {
  // NEXT.JS 15+ FIX: Await the params before using them
  const params = await props.params;
  const quoteId = params.quoteId;

  // Ensure project exists (via RPC)
  const ensureRes = await supabaseAdmin.rpc("ensure_project_for_quote", { p_quote_id: quoteId });
  const projectId = ensureRes.data ? String(ensureRes.data) : null;

  let project: any = null;
  let quote: any = null;
  let pie: any = null;
  let snapshots: any[] = [];
  let changeOrders: any[] = [];

  if (projectId) {
    const [projectRes, quoteRes, pieRes, snapRes, coRes] = await Promise.all([
      supabaseAdmin.from("projects").select("*").eq("id", projectId).maybeSingle(),
      supabaseAdmin.from("quotes").select("*").eq("id", quoteId).maybeSingle(),
      supabaseAdmin
        .from("pie_reports")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("project_scope_snapshots")
        .select("*")
        .eq("project_id", projectId)
        .order("version_no", { ascending: false }),
      supabaseAdmin
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
    <div className="container" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 1000 }}>
      <div className="kicker"><span className="kickerDot" /> Admin Area</div>
      <h1 className="h1" style={{ marginTop: 12, marginBottom: 6 }}>Project Workspace</h1>
      <div className="pDark" style={{ marginBottom: 24 }}>
        Manage scope snapshots, change orders, and final deliverables for this build.
      </div>

      {!projectId ? (
        <div className="card">
          <div className="cardInner" style={{ color: "#ffb4b4" }}>
            Could not load or create a project for quote <code>{quoteId}</code>. Check your database RPC functions.
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
