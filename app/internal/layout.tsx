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
    <main className="container" style={{ paddingTop: 8 }}>
      {/* Compact admin toolbar (not a second big header) */}
      <section className="card" style={{ marginBottom: 16 }}>
        <div
          className="cardInner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Admin Console
            </div>
            <div
              style={{
                marginTop: 6,
                fontWeight: 700,
                opacity: 0.9,
                maxWidth: 420,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={user.email ?? ""}
            >
              {user.email}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/internal" className="btn btnGhost">
              Home
            </Link>
            <Link href="/internal/admin" className="btn btnPrimary">
              Unified Dashboard
            </Link>
            <Link href="/internal/ops" className="btn btnGhost">
              Ops Intakes
            </Link>
            <Link href="/portal" className="btn btnGhost">
              Client Portal
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn btnGhost">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </section>

      {children}
    </main>
  );
}