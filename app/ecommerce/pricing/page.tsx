import Link from "next/link";
import TrackLink from "@/components/site/TrackLink";

export const dynamic = "force-dynamic";

export default function EcommercePricingPage() {
  return (
    <main style={{
      background: "radial-gradient(900px 480px at 50% 0%, rgba(141,164,255,0.06), transparent 55%), linear-gradient(180deg, #050914 0%, #07101d 46%, #050914 100%)",
      minHeight: "100vh",
    }}>
      <div className="container" style={{ paddingBottom: 64 }}>

        {/* ── Hero ── */}
        <section style={{ textAlign: "center", padding: "72px 0 48px", maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#d6b25d",
            letterSpacing: "0.14em", textTransform: "uppercase",
            marginBottom: 14,
          }}>
            E-commerce pricing
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 500,
            color: "#eef2ff", letterSpacing: "-0.03em", lineHeight: 1.1,
            margin: 0,
          }}>
            Pick the service that matches
            <span style={{ fontStyle: "italic", color: "#ddb764" }}> where you are</span>
          </h1>
          <p style={{
            fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
            fontSize: 16, color: "rgba(226,233,245,0.55)",
            lineHeight: 1.65, marginTop: 16, maxWidth: 540, marginLeft: "auto", marginRight: "auto",
          }}>
            Whether you need a store built, your existing store managed, or a
            broken checkout fixed — pricing is transparent and scoped to what
            you actually need.
          </p>
        </section>

        {/* ── Three Lanes ── */}
        <section style={{
          display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16, marginBottom: 48,
        }}>
          {/* BUILD */}
          <div style={{
            borderRadius: 20, overflow: "hidden",
            border: "1px solid rgba(201,168,76,0.2)",
            background: "linear-gradient(180deg, rgba(14,20,35,0.98), rgba(10,14,24,0.98))",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ height: 3, background: "#c9a84c" }} />
            <div style={{ padding: "24px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{
                display: "inline-flex", alignSelf: "flex-start",
                padding: "5px 10px", borderRadius: 999,
                border: "1px solid rgba(201,168,76,0.25)",
                background: "rgba(201,168,76,0.06)",
                color: "#c9a84c", fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>Build</div>

              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 24, fontWeight: 500, color: "#eef2ff",
                letterSpacing: "-0.02em", margin: "14px 0 10px",
              }}>Build my store</h2>

              <p style={{
                fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
                fontSize: 14, color: "#9aa3b8", lineHeight: 1.6, margin: 0,
              }}>
                You need an online store designed, configured, and launched from
                scratch. We handle the full build — design, products, checkout,
                payments, and shipping.
              </p>

              <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
                <PriceTier label="Basic" price="$1,800" detail="Under 25 products · Standard theme · Single payment gateway" />
                <PriceTier label="Standard" price="$2,500 – $3,500" detail="25–75 products · Custom theme work · Multi-gateway" />
                <PriceTier label="Premium" price="$4,000+" detail="75+ products · Complex config · Subscriptions or multi-currency" />
              </div>

              <div style={{ marginTop: "auto", paddingTop: 20 }}>
                <div style={{ display: "flex" }}>
                  <TrackLink href="/ecommerce/intake" event="cta_ecom_pricing_build"
                    className="btn btnPrimary" >
                    Start store build <span className="btnArrow">→</span>
                  </TrackLink>
                </div>
              </div>
            </div>
          </div>

          {/* RUN */}
          <div style={{
            borderRadius: 20, overflow: "hidden",
            border: "1px solid rgba(93,202,165,0.2)",
            background: "linear-gradient(180deg, rgba(14,20,35,0.98), rgba(10,14,24,0.98))",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ height: 3, background: "#5DCAA5" }} />
            <div style={{ padding: "24px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{
                display: "inline-flex", alignSelf: "flex-start",
                padding: "5px 10px", borderRadius: 999,
                border: "1px solid rgba(93,202,165,0.25)",
                background: "rgba(93,202,165,0.06)",
                color: "#5DCAA5", fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>Run</div>

              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 24, fontWeight: 500, color: "#eef2ff",
                letterSpacing: "-0.02em", margin: "14px 0 10px",
              }}>Run my store</h2>

              <p style={{
                fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
                fontSize: 14, color: "#9aa3b8", lineHeight: 1.6, margin: 0,
              }}>
                You already have a working store but you&apos;re drowning in
                operations. We become your back office — orders, listings,
                customers, returns, and reporting.
              </p>

              <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
                <PriceTier label="Starter" price="$500/mo" detail="Under 100 orders/mo · Listing updates · Order monitoring · Monthly summary" />
                <PriceTier label="Growth" price="$1,000/mo" detail="100–300 orders/mo · Returns · Promos · Analytics · Optimization tips" />
                <PriceTier label="Scale" price="$1,800/mo" detail="300+ orders/mo · Multi-channel · Custom automation · Priority support" />
              </div>

              <div style={{ marginTop: "auto", paddingTop: 20 }}>
                <div style={{ display: "flex" }}>
                  <TrackLink href="/ecommerce/intake" event="cta_ecom_pricing_run"
                    className="btn btnPrimary">
                    Start operations intake <span className="btnArrow">→</span>
                  </TrackLink>
                </div>
              </div>
            </div>
          </div>

          {/* FIX */}
          <div style={{
            borderRadius: 20, overflow: "hidden",
            border: "1px solid rgba(141,164,255,0.2)",
            background: "linear-gradient(180deg, rgba(14,20,35,0.98), rgba(10,14,24,0.98))",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ height: 3, background: "#8da4ff" }} />
            <div style={{ padding: "24px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{
                display: "inline-flex", alignSelf: "flex-start",
                padding: "5px 10px", borderRadius: 999,
                border: "1px solid rgba(141,164,255,0.25)",
                background: "rgba(141,164,255,0.06)",
                color: "#8da4ff", fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>Fix</div>

              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 24, fontWeight: 500, color: "#eef2ff",
                letterSpacing: "-0.02em", margin: "14px 0 10px",
              }}>Fix my store</h2>

              <p style={{
                fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
                fontSize: 14, color: "#9aa3b8", lineHeight: 1.6, margin: 0,
              }}>
                Your store exists but something isn&apos;t working — checkout
                drops, messy fulfillment, broken post-purchase flow. We audit
                the problem and implement fixes in a 2–3 week sprint.
              </p>

              <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
                <PriceTier label="Audit + Fix Sprint" price="$1,200" detail="Full checkout audit · Conversion analysis · 5–10 targeted fixes · 2–3 week delivery" />
                <div style={{
                  padding: "12px 14px", borderRadius: 10,
                  border: "1px dashed rgba(141,164,255,0.15)",
                  background: "rgba(141,164,255,0.03)",
                }}>
                  <div style={{ fontSize: 12, color: "rgba(141,164,255,0.7)", fontWeight: 600, marginBottom: 4 }}>
                    Then transition to managed ops
                  </div>
                  <div style={{ fontSize: 13, color: "#9aa3b8", lineHeight: 1.5 }}>
                    After the sprint, most clients move to a $500–$1,000/mo
                    operations retainer so the fixes stick and the store keeps improving.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "auto", paddingTop: 20 }}>
                <div style={{ display: "flex" }}>
                  <TrackLink href="/ecommerce/intake" event="cta_ecom_pricing_fix"
                    className="btn btnPrimary">
                    Start store audit <span className="btnArrow">→</span>
                  </TrackLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── What's Included ── */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#d6b25d",
              letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10,
            }}>What every client gets</div>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 28, fontWeight: 500, color: "#eef2ff",
              letterSpacing: "-0.02em", margin: 0,
            }}>Included in every engagement</h2>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}>
            {[
              { title: "Private workspace", desc: "Track your project, see status updates, and communicate with us — all in one place." },
              { title: "Transparent pricing", desc: "You see the scope and the price before committing. No hidden fees, no surprise invoices." },
              { title: "You own everything", desc: "Your store, your domain, your data, your customer list. We hand over the keys." },
              { title: "Planning call included", desc: "Every engagement starts with a strategy call to align on goals, priorities, and timeline." },
              { title: "24-hour response time", desc: "Questions, requests, and issues get a response within one business day." },
              { title: "Monthly reporting", desc: "Operations clients get a monthly summary — what we did, what changed, what's next." },
            ].map((item) => (
              <div key={item.title} style={{
                padding: "18px 20px", borderRadius: 14,
                border: "1px solid rgba(68,79,114,0.3)",
                background: "rgba(255,255,255,0.02)",
              }}>
                <div style={{
                  fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
                  fontSize: 15, fontWeight: 700, color: "#eef2ff", marginBottom: 6,
                }}>{item.title}</div>
                <div style={{
                  fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
                  fontSize: 13, color: "#9aa3b8", lineHeight: 1.55,
                }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ marginBottom: 48, maxWidth: 680, margin: "0 auto 48px" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 26, fontWeight: 500, color: "#eef2ff",
              letterSpacing: "-0.02em", margin: 0,
            }}>Common questions</h2>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {[
              {
                q: "Do I need to give you access to my store admin?",
                a: "Yes — we'll need collaborator or staff access to your Shopify, Amazon, or other platform so we can manage listings, orders, and settings on your behalf. You stay the owner; we operate as your team.",
              },
              {
                q: "What if I need a store built AND ongoing operations?",
                a: "Start with the build. Once your store launches, we transition into the monthly operations retainer. Many clients do both — the build fee covers the project, then the monthly fee covers ongoing management.",
              },
              {
                q: "Can I cancel the monthly retainer anytime?",
                a: "Yes. We ask for 30 days' notice so we can wrap up any in-progress work and hand everything back cleanly. No cancellation fees.",
              },
              {
                q: "What platforms do you support?",
                a: "Shopify is our primary platform. We also support WooCommerce, Etsy, Amazon Seller Central, and eBay. If you're on something else, let's talk — we can likely work with it.",
              },
              {
                q: "Do you handle warehousing and shipping?",
                a: "Not yet. Right now we manage the digital operations — listings, orders, customers, and reporting. If you need physical fulfillment, we can help you evaluate and connect with a third-party logistics provider (3PL).",
              },
              {
                q: "What's the difference between the Fix sprint and the Run retainer?",
                a: "The Fix sprint is a one-time deep dive — we find what's broken and implement specific fixes over 2–3 weeks. The Run retainer is ongoing monthly management. Most Fix clients transition to Run after the sprint because the store needs continuous attention to keep improving.",
              },
            ].map((faq) => (
              <details key={faq.q} style={{
                padding: "14px 18px", borderRadius: 12,
                border: "1px solid rgba(68,79,114,0.3)",
                background: "rgba(255,255,255,0.02)",
              }}>
                <summary style={{
                  fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
                  fontSize: 15, fontWeight: 600, color: "#eef2ff",
                  cursor: "pointer", listStyle: "none",
                }}>
                  {faq.q}
                </summary>
                <p style={{
                  fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
                  fontSize: 14, color: "#9aa3b8", lineHeight: 1.65,
                  margin: "10px 0 0",
                }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Closing CTA ── */}
        <section style={{
          borderRadius: 22,
          border: "1px solid rgba(201,168,76,0.2)",
          background: "radial-gradient(800px 300px at 50% 30%, rgba(201,168,76,0.06), transparent 50%), linear-gradient(180deg, rgba(14,20,35,0.98), rgba(10,14,24,0.98))",
          padding: "48px 40px", textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 30, fontWeight: 500, color: "#eef2ff",
            letterSpacing: "-0.03em", maxWidth: 500, margin: "0 auto",
          }}>
            Ready to stop doing
            <span style={{ fontStyle: "italic", color: "#ddb764" }}> everything yourself?</span>
          </h2>
          <p style={{
            fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
            fontSize: 15, color: "rgba(226,233,245,0.5)",
            lineHeight: 1.6, marginTop: 14,
            maxWidth: 460, marginLeft: "auto", marginRight: "auto",
          }}>
            Tell us what you need in a 2-minute intake. We&apos;ll respond
            within 24 hours with a plan and pricing.
          </p>
          <div style={{
            display: "flex", gap: 12, justifyContent: "center",
            marginTop: 22, flexWrap: "wrap",
          }}>
            <TrackLink href="/ecommerce/intake" event="cta_ecom_pricing_closing"
              className="btn btnPrimary btnLg">
              Start your intake <span className="btnArrow">→</span>
            </TrackLink>
            <Link href="/portal" className="btn btnGhost btnLg">
              Client portal
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function PriceTier({ label, price, detail }: { label: string; price: string; detail: string }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(255,255,255,0.02)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{
          fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
          fontSize: 13, fontWeight: 600, color: "#eef2ff",
        }}>{label}</span>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 20, fontWeight: 600, color: "#eef2ff",
          letterSpacing: "-0.02em",
        }}>{price}</span>
      </div>
      <div style={{
        fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
        fontSize: 12, color: "rgba(226,233,245,0.4)",
        lineHeight: 1.5, marginTop: 6,
      }}>{detail}</div>
    </div>
  );
}
