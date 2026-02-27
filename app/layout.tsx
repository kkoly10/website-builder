// app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import BrandLogo from "@/components/brand/BrandLogo";
import SiteFooter from "@/components/site/SiteFooter";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CrecyStudio | Websites & Workflow Systems",
  description: "Custom websites and workflow systems for local service businesses.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let userEmail: string | null = null;
  let admin = false;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    userEmail = data?.user?.email ?? null;
    admin = await isAdminUser({ userId: data?.user?.id ?? null, email: data?.user?.email ?? null });
  } catch {
    userEmail = null;
    admin = false;
  }

  return (
    <html lang="en">
      <body>
        <div className="siteShell">
          <header className="topNav">
            <div className="topNavInner">
              <BrandLogo href="/" showTag />

              <nav className="navLinks">
                <Link href="/systems">Workflow Systems</Link>
                <Link href="/build">Website Quote</Link>
                <Link href="/portal">Client Portal</Link>

                {userEmail ? (
                  <>
                    {admin ? <Link href="/internal/admin">Admin</Link> : null}
                    <Link className="btn btnGhost" href="/auth/signout">
                      Sign out
                    </Link>
                  </>
                ) : (
                  <>
                    <Link className="btn btnPrimary" href="/build">
                      Get Estimate <span className="btnArrow">→</span>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>

          <main className="mainContent">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}