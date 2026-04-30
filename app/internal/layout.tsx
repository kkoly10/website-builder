import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import GhostCommandBar from "@/components/internal/ghost/GhostCommandBar";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InternalLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent("/internal")}`);

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) redirect("/portal");

  return (
    <main className="container" style={{ paddingTop: 8 }}>
      <section className="card">
        <div className="cardInner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="kicker">
              <span className="kickerDot" /> CrecyStudio HQ
            </div>
            <div style={{ marginTop: 6, fontWeight: 700, opacity: 0.9 }}>{user.email}</div>
          </div>

          <div>
            <Link href="/internal" className="btn btnGhost">
              Home
            </Link>

            <Link href="/internal/dashboard" className="btn btnGhost">
              Dashboard
            </Link>

            <Link href="/internal/admin" className="btn btnGhost">
              Web Pipeline
            </Link>

            <Link href="/internal/admin/ecommerce" className="btn btnGhost">
              E-commerce
            </Link>

            <Link href="/internal/admin/ops" className="btn btnGhost">
              Ops Pipeline
            </Link>

            <Link href="/internal/ghost/messages" className="btn btnGhost">
              Message Lab
            </Link>

            <form action="/auth/signout" method="post" style={{ marginLeft: 8 }}>
              <button type="submit" className="btn btnGhost">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </section>

      <GhostCommandBar />
      {children}
    </main>
  );
}
