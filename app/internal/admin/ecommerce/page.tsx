import { redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { getEcommerceAdminRows } from "@/lib/ecommerce/workspace";
import EcommercePipelineClient from "./EcommercePipelineClient";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

export default async function EcommerceAdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/internal/admin/ecommerce");

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  const rows = await getEcommerceAdminRows();

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" />
            E-Commerce HQ
          </div>
          <h1 className="h2">Store build, run, and fix pipeline</h1>
          <p className="pDark" style={{ marginTop: 4 }}>
            Review e-commerce intakes by service path, stage, workspace status, and client-facing delivery state.
          </p>
        </div>
      </div>

      <EcommercePipelineClient initialRows={rows} />
      <ScrollReveal />
    </section>
  );
}
