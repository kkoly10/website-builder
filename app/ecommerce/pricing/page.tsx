import Link from "next/link";

export const dynamic = "force-dynamic";

const GROUPS = [
  {
    title: "Website Design Only",
    who: "Best for sellers who need a storefront first and plan to run fulfillment in-house.",
    billing: "Mostly one-time setup",
    rows: ["Basic business website: $450–$750 one-time", "E-commerce website: $900–$1,500 one-time", "Premium/custom build: $2,000+"],
  },
  {
    title: "Website + Hosting",
    who: "Best for sellers who want ongoing technical care after launch.",
    billing: "One-time + recurring",
    rows: ["Basic hosting: starting at $25/month", "Managed hosting: starting at $75/month", "Full care: starting at $150/month"],
  },
  {
    title: "Storage Only",
    who: "Best for inventory-heavy sellers needing organized monthly storage support.",
    billing: "Recurring monthly",
    rows: ["Shelf storage: monthly pricing", "Pallet storage: monthly pricing", "Oversize inventory: custom quote"],
  },
  {
    title: "Fulfillment Only",
    who: "Best for sellers ready to outsource pick/pack and shipping coordination.",
    billing: "Usage-based recurring",
    rows: ["Per-order pricing", "Additional item pricing", "Returns processing add-on"],
  },
  {
    title: "Marketplace Management",
    who: "Best for multi-channel sellers needing listing and catalog management support.",
    billing: "Recurring monthly",
    rows: ["Basic management: monthly", "Full management: monthly", "Optional setup fee"],
  },
  {
    title: "Full-Service Seller Support",
    who: "Best for operators wanting one team across setup, storage, fulfillment, and admin.",
    billing: "Custom blended plan",
    rows: ["Custom monthly plans", "Pricing based on service mix", "Custom plans available"],
  },
];

export default function EcommercePricingPage() {
  return (
    <main className="container" style={{ paddingBottom: 80 }}>
      <section className="section" style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", paddingTop: 72 }}>
        <div className="kicker">E-Commerce Ops Pricing</div>
        <h1 className="h1" style={{ marginTop: 10 }}>Modular pricing for seller operations</h1>
        <p className="p" style={{ marginTop: 18 }}>Choose only what you need. Rates below are starting points and typical ranges. Final pricing depends on your order volume, service mix, and implementation complexity.</p>
      </section>

      <section className="section" style={{ paddingTop: 16 }}>
        <div className="grid2" style={{ alignItems: "stretch" }}>
          {GROUPS.map((group) => (
            <div className="card" key={group.title}>
              <div className="cardInner" style={{ height: "100%" }}>
                <h2 className="h3">{group.title}</h2>
                <p className="pDark" style={{ margin: "6px 0 0", fontSize: 13 }}><strong>Who this is for:</strong> {group.who}</p>
                <p className="pDark" style={{ margin: "4px 0 0", fontSize: 13 }}><strong>Billing model:</strong> {group.billing}</p>
                <ul style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.8 }}>{group.rows.map((row) => <li key={row}>{row}</li>)}</ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="card">
          <div className="cardInner">
            <h2 className="h3">Common plan examples</h2>
            <div className="grid2">
              <div className="pDark"><strong>Website only:</strong> one-time build plus optional monthly hosting/care.</div>
              <div className="pDark"><strong>Storage only:</strong> monthly shelf/pallet capacity with custom oversize add-ons.</div>
              <div className="pDark"><strong>Fulfillment only:</strong> per-order + per-item model, optional returns handling.</div>
              <div className="pDark"><strong>Full-service support:</strong> setup + management + storage + fulfillment under one blended plan.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="card" style={{ background: "var(--panel2)" }}>
          <div className="cardInner" style={{ textAlign: "center", padding: "36px 24px" }}>
            <h2 className="h2">Get pricing mapped to your exact operation</h2>
            <p className="pDark">Custom plans available across setup, storage, fulfillment, and management support.</p>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}><Link href="/ecommerce/intake" className="btn btnPrimary">Get My Custom Quote <span className="btnArrow">→</span></Link></div>
          </div>
        </div>
      </section>
    </main>
  );
}
