// app/internal/dashboard/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkInternalAccess } from "@/lib/internalAuth";
import InternalDashboardClient from "./InternalDashboardClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function InternalDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const token = pick(searchParams, "token").trim() || null;

  const access = checkInternalAccess(token);
  if (!access.ok) {
    return (
      <main style={{ padding: 32, fontFamily: "ui-sans-serif, system-ui" }}>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Internal Dashboard</h1>
        <p style={{ color: "#b00", fontWeight: 700 }}>Unauthorized</p>
        <p style={{ marginTop: 10, opacity: 0.85 }}>
          Add <code>?token=YOUR_INTERNAL_DASHBOARD_TOKEN</code> to the URL.
        </p>
        <p style={{ marginTop: 10, opacity: 0.85 }}>
          Set <code>INTERNAL_DASHBOARD_TOKEN</code> in Vercel env vars to secure this page.
        </p>
      </main>
    );
  }

  const { data: quotes, error } = await supabaseAdmin
    .from("quotes")
    .select(
      `
      id,
      created_at,
      status,
      tier_recommended,
      estimate_total,
      estimate_low,
      estimate_high,
      debug,
      leads (
        email,
        phone,
        name
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <InternalDashboardClient
      initialToken={token || ""}
      initialWarning={access.warning || ""}
      initialQuotes={quotes ?? []}
      initialError={error?.message ?? ""}
    />
  );
}