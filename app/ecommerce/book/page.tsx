import Link from "next/link";
import EcommerceBookClient from "./EcommerceBookClient";

export const dynamic = "force-dynamic";

export default async function EcommerceBookPage({
  searchParams,
}: {
  searchParams: Promise<{ ecomIntakeId?: string }>;
}) {
  const params = await searchParams;
  const ecomIntakeId = String(params?.ecomIntakeId || "").trim();

  if (!ecomIntakeId) {
    return (
      <main className="container" style={{ paddingBottom: 80 }}>
        <section className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="card"><div className="cardInner" style={{ padding: 30 }}><div className="kicker">Missing intake</div><h1 className="h2">We need your intake first</h1><p className="pDark">Start with the e-commerce intake so we can attach your call request to the right seller profile.</p><Link href="/ecommerce/intake" className="btn btnPrimary">Go to E-Commerce Intake</Link></div></div>
        </section>
      </main>
    );
  }

  return <EcommerceBookClient ecomIntakeId={ecomIntakeId} />;
}
