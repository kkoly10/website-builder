import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function EcommerceAdminDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(`/internal/admin/ecommerce/${params.id}`)}`);
  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const [{ data: intake }, { data: quote }, { data: call }] = await Promise.all([
    supabaseAdmin.from("ecom_intakes").select("*").eq("id", params.id).maybeSingle(),
    supabaseAdmin.from("ecom_quotes").select("*").eq("ecom_intake_id", params.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("ecom_call_requests").select("*").eq("ecom_intake_id", params.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!intake) notFound();

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div style={{ marginBottom: 12 }}><Link href="/internal/admin/ecommerce" className="btn btnGhost">← Back to E-Commerce Leads</Link></div>

      <div className="card"><div className="cardInner"><div className="kicker"><span className="kickerDot" /> Intake details</div><h1 className="h2">{intake.business_name || "E-Commerce Lead"}</h1><p className="pDark">{intake.contact_name || "—"} • {intake.email || "—"}</p></div></div>

      <div className="grid2" style={{ marginTop: 12 }}>
        <DataCard title="Intake data" content={intake} />
        <DataCard title="Quote summary" content={quote || { status: "No quote yet" }} />
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        <DataCard title="Call status" content={call || { status: "No call request yet" }} />
        <div className="card"><div className="cardInner"><h2 className="h3">Next action</h2><p className="pDark">Use this lane to keep e-commerce records separate from the website quote pipeline. Update status and notes directly in Supabase until inline controls are added.</p></div></div>
      </div>
    </section>
  );
}

function DataCard({ title, content }: { title: string; content: any }) {
  return (
    <div className="card"><div className="cardInner"><h2 className="h3">{title}</h2><pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, color: "var(--muted)" }}>{JSON.stringify(content, null, 2)}</pre></div></div>
  );
}
