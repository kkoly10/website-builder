import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";

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

  if (!isAdminEmail(user.email)) {
    redirect("/");
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

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/internal" className="btn btnGhost">
              Internal Home
            </Link>
            <Link href="/internal/admin" className="btn btnGhost">
              Website Pipeline
            </Link>
            <Link href="/internal/ops" className="btn btnPrimary">
              Ops Intakes <span className="btnArrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}