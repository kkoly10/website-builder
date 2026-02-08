import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function InternalPreviewPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) {
    return (
      <main style={{ maxWidth: 1100, margin: "80px auto", padding: 24 }}>
        <h1>PIE — Internal Evaluation</h1>
        <p>Missing token.</p>
      </main>
    );
  }

  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("pie_reports")
    .select("created_at, expires_at, report, projects(lead_email, lead_phone, client_estimate)")
    .eq("token", token)
    .single();

  if (error || !data) {
    return (
      <main style={{ maxWidth: 1100, margin: "80px auto", padding: 24 }}>
        <h1>PIE — Internal Evaluation</h1>
        <p>Report not found or expired.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "80px auto", padding: 24 }}>
      <h1>PIE — Internal Evaluation</h1>

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        <div><strong>Lead:</strong> {data.projects?.lead_email}</div>
        {data.projects?.lead_phone ? <div><strong>Phone:</strong> {data.projects.lead_phone}</div> : null}
        <div><strong>Client Estimate Shown:</strong> ${data.projects?.client_estimate}</div>
        <div><strong>Created:</strong> {new Date(data.created_at).toLocaleString()}</div>
        {data.expires_at ? <div><strong>Expires:</strong> {new Date(data.expires_at).toLocaleString()}</div> : null}
      </div>

      <hr style={{ margin: "18px 0" }} />

      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data.report, null, 2)}</pre>
    </main>
  );
}