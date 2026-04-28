import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EcommerceSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ecomIntakeId?: string; callRequestId?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="container" style={{ paddingBottom: 80 }}>
      <section className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="card">
          <div className="cardInner" style={{ textAlign: "center", padding: "40px 30px" }}>
            <div className="kicker">Request received</div>
            <h1 className="h1" style={{ marginTop: 10 }}>Your intake and planning call request are saved</h1>
            <p className="pDark">We&apos;ll review your seller profile and follow up with next-step options. Intake ID: <strong>{params.ecomIntakeId?.slice(0, 8) || "—"}</strong> • Call ID: <strong>{params.callRequestId?.slice(0, 8) || "—"}</strong></p>
            <p className="pDark" style={{ marginTop: 8 }}>What happens next: we verify service fit, draft a modular recommendation, and propose a launch plan for website, storage, fulfillment, or management support.</p>
            <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/pricing#ecommerce" className="btn btnGhost">Back to Pricing</Link>
              <Link href="/portal" className="btn btnPrimary">Open Client Portal</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
