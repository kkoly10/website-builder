import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InternalLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent("/internal")}`);

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  return (
    <main className="container" style={{ paddingTop: 8 }}>
      <section className="card" style={{ marginBottom: 16 }}>
        <div className="cardInner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div className="kicker"><span className="kickerDot" /> CrecyStudio HQ</div>
            <div style={{ marginTop: 6, fontWeight: 700, opacity: 0.9 }}>{user.email}</div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/internal" className="btn btnGhost">Home</Link>
            
            <Link href="/internal/admin" className="btn btnPrimary" style={{ background: "linear-gradient(180deg, #3b82f6, #2563eb)", borderColor: "#1d4ed8" }}>
              🌐 Web Pipeline
            </Link>

            <Link href="/internal/ops" className="btn btnPrimary" style={{ background: "linear-gradient(180deg, #ff7a18, #e66a00)", borderColor: "#cc5e00" }}>
              ⚙️ Ops Pipeline
            </Link>
            
            <form action="/auth/signout" method="post" style={{ marginLeft: 8 }}>
              <button type="submit" className="btn btnGhost">Sign out</button>
            </form>
          </div>
        </div>
      </section>
      {children}
    </main>
  );
}
