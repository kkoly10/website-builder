// app/editor/layout.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Website Editor — CrecyStudio",
};

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?next=/editor");
    }
  } catch {
    redirect("/login?next=/editor");
  }

  return (
    <>
      <style>{`
        .topNav,
        .footer,
        nav {
          display: none !important;
        }
        .mainContent {
          padding: 0 !important;
          margin: 0 !important;
        }
        body {
          overflow: hidden;
        }
      `}</style>
      {children}
    </>
  );
}
