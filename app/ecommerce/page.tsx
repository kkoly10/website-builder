import Link from "next/link";

export const dynamic = "force-dynamic";

const SERVICES = [
  {
    title: "Website Building & Store Setup",
    bullets: ["Business websites", "E-commerce store setup", "Product page setup", "Mobile-friendly design", "Hosting and maintenance"],
  },
  {
    title: "Marketplace Management",
    bullets: ["Listing setup", "Product uploads", "Store organization", "Ongoing management support", "Seller operations help"],
  },
  {
    title: "Inventory Storage",
    bullets: ["Shelf or pallet storage", "Inventory organization", "Product handling", "Flexible storage plans"],
  },
  {
    title: "Fulfillment Support",
    bullets: ["Pick and pack", "Shipping coordination", "Order support", "Returns handling"],
  },
  {
    title: "Virtual Business Support",
    bullets: ["Customer support", "Data entry", "Product uploads", "Admin tasks", "Order support"],
  },
];

export default function EcommercePage() {
  return (
    <main className="container" style={{ paddingBottom: 80 }}>
      <section className="section" style={{ padding: "80px 0 60px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <div className="kicker">E-Commerce Operations Support</div>
        <h1 className="h1" style={{ marginTop: 12 }}>We help online sellers build, manage, and scale their e-commerce operations.</h1>
        <p className="p" style={{ marginTop: 20, fontSize: 20 }}>
          From website setup and marketplace support to inventory storage and fulfillment, we help growing sellers stop doing everything themselves.
        </p>
        <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/ecommerce/intake" className="btn btnPrimary">Get an E-Commerce Quote <span className="btnArrow">→</span></Link>
          <Link href="/ecommerce/pricing" className="btn btnGhost">See Pricing</Link>
        </div>
        <div className="pills" style={{ justifyContent: "center", marginTop: 22 }}>
          <span className="pill">Website Setup</span><span className="pill">Amazon / eBay / Shopify Support</span><span className="pill">Inventory Storage</span><span className="pill">Fulfillment Help</span><span className="pill">Flexible Plans</span>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}><div className="kicker">Who this is for</div><h2 className="h2" style={{ marginTop: 10 }}>Built for sellers in different growth stages</h2></div>
        <div className="grid3">
          {[["New Sellers", "Launch cleanly with the right storefront, listing structure, and support setup."], ["Growing Store Owners", "Offload tasks as order volume increases so your business keeps moving."], ["Multi-Channel Sellers", "Coordinate your operations across marketplace channels with less friction."]].map(([title, desc]) => (
            <div className="card" key={title}><div className="cardInner"><h3 className="h3">{title}</h3><p className="pDark">{desc}</p></div></div>
          ))}
        </div>
      </section>

      <section className="section" style={{ borderTop: "1px solid var(--stroke)", paddingTop: 56 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}><div className="kicker">Core services</div><h2 className="h2" style={{ marginTop: 10 }}>Mix and match the support you need</h2></div>
        <div style={{ display: "grid", gap: 14 }}>
          {SERVICES.map((service) => (
            <div className="card" key={service.title}><div className="cardInner" style={{ padding: 26 }}><h3 className="h3">{service.title}</h3><ul style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.8 }}>{service.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></div></div>
          ))}
        </div>
      </section>

      <section className="section"><div className="card"><div className="cardInner" style={{ padding: 30 }}><div className="kicker">How it works</div><div style={{ display: "grid", gap: 12, marginTop: 10 }}>{["Tell us what you need", "Get a custom recommendation", "Choose your plan", "Grow with support behind the scenes"].map((text, i) => <div key={text} style={{ display: "flex", gap: 10 }}><strong style={{ minWidth: 24 }}>{i + 1}.</strong><span className="pDark" style={{ margin: 0 }}>{text}</span></div>)}</div></div></div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="card" style={{ background: "var(--panel2)" }}><div className="cardInner" style={{ padding: 30 }}><div className="kicker">Why sellers work with us</div><h2 className="h2" style={{ marginTop: 12 }}>Digital setup + operations support in one lane</h2><p className="pDark">Most teams can help with website setup or seller operations. We bridge both sides — storefront setup, marketplace execution, and practical inventory/fulfillment support — so your growth doesn&apos;t break your back-office.</p></div></div></section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}><div className="kicker">Pricing preview</div><h2 className="h2" style={{ marginTop: 10 }}>Modular pricing by service lane</h2></div>
        <div className="grid2">{["Website Setup", "Storage", "Fulfillment", "Management Support"].map((item) => <div className="card" key={item}><div className="cardInner"><h3 className="h3">{item}</h3><p className="pDark">Starting at custom-fit levels based on scope and volume.</p></div></div>)}</div>
        <div style={{ marginTop: 18, textAlign: "center" }}><Link href="/ecommerce/pricing" className="btn btnGhost">View Full Pricing</Link></div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}><div style={{ textAlign: "center", marginBottom: 20 }}><div className="kicker">Example use cases</div></div><div className="grid2">{["Website only", "Storage only", "Fulfillment only", "Full-service support"].map((useCase) => <div className="card" key={useCase}><div className="cardInner"><h3 className="h3">{useCase}</h3></div></div>)}</div></section>

      <section className="section" style={{ paddingTop: 0 }}><div style={{ textAlign: "center", marginBottom: 20 }}><div className="kicker">FAQ preview</div></div><div style={{ display: "grid", gap: 10 }}>{["Do I have to use all the services?", "Can I get only a website?", "Can I get only storage or fulfillment?", "Do you support Amazon, eBay, and Shopify sellers?"].map((q) => <div className="card" key={q}><div className="cardInner" style={{ fontWeight: 700 }}>{q}</div></div>)}</div></section>

      <section className="section" style={{ paddingTop: 10 }}><div className="card"><div className="cardInner" style={{ textAlign: "center", padding: "40px 26px" }}><h2 className="h2">Ready to build a stronger e-commerce operation?</h2><div style={{ marginTop: 18, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}><Link href="/ecommerce/intake" className="btn btnPrimary">Get an E-Commerce Quote <span className="btnArrow">→</span></Link><Link href="/ecommerce/pricing" className="btn btnGhost">See Pricing</Link></div></div></div></section>
    </main>
  );
}
