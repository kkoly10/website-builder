// app/portal/[token]/page.tsx
import { getPortalBundleByToken } from "@/lib/portal/server";
import PortalClient from "./PortalClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }> | { token: string };
}) {
  const resolved = await Promise.resolve(params);
  const token = resolved.token;

  const result = await getPortalBundleByToken(token);

  if (!result.ok) {
    return (
      <main className="container section">
        <div className="card">
          <div className="cardInner">
            <div className="h2" style={{ marginBottom: 8 }}>
              Client Portal
            </div>
            <p className="p" style={{ marginTop: 0 }}>
              {result.error || "Portal link could not be loaded."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <PortalClient initial={result.data} />;
}