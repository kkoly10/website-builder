import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InternalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/internal")}`);
  }

  const admin = await isAdminUser({
    userId: user.id,
    email: user.email,
  });

  if (!admin) {
    redirect("/portal");
  }

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <div
        className="card"
        style={{
          marginBottom: 14,
          position: "sticky",
          top: 10,
          zIndex: 20,
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          className="cardInner"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Internal Admin
            </div>
            <div className="p" style={{ marginTop: 6 }}>
              Signed in as <strong>{user.email}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/internal" className="btn btnGhost">
              Internal Home
            </Link>
            <Link href="/internal/admin" className="btn btnGhost">
              Unified Dashboard
            </Link>
            <Link href="/internal/ops" className="btn btnGhost">
              Ops Intakes
            </Link>
            <Link href="/portal" className="btn btnGhost">
              Client Portal
            </Link>

            <form action="/auth/signout" method="post">
              <button type="submit" className="btn btnPrimary">
                Sign out <span className="btnArrow">→</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
