import Link from "next/link";

export const dynamic = "force-dynamic";

export default function EcommerceBookPage({ searchParams }: { searchParams: { ecomIntakeId?: string } }) {
  return (
    <main className="container" style={{ paddingBottom: 80 }}>
      <section className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="card">
          <div className="cardInner" style={{ padding: 30 }}>
            <div className="kicker">Next Step</div>
            <h1 className="h1" style={{ marginTop: 10 }}>Book your seller planning call</h1>
            <p className="pDark">Your intake{searchParams?.ecomIntakeId ? ` (#${searchParams.ecomIntakeId.slice(0, 8)})` : ""} was received. Share your preferred time windows and we&apos;ll coordinate the best next step.</p>

            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
              <div><label className="fieldLabel">Best time to connect</label><input className="input" placeholder="Morning / Afternoon / Evening" /></div>
              <div><label className="fieldLabel">Preferred days/times</label><input className="input" placeholder="Mon–Wed after 2 PM" /></div>
              <div><label className="fieldLabel">Timezone</label><input className="input" placeholder="America/New_York" /></div>
              <div><label className="fieldLabel">Notes</label><textarea className="input" style={{ minHeight: 90 }} placeholder="Anything we should prepare before the call" /></div>
            </div>

            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/contact" className="btn btnPrimary">Request Seller Strategy Call <span className="btnArrow">→</span></Link>
              <Link href="/ecommerce/pricing" className="btn btnGhost">Book E-commerce Planning Call</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
