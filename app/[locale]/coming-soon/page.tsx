"use client";

import { useMemo, useState } from "react";
import { getEcomInterestEndpoint } from "@/lib/forms";

type SellerType = "Amazon seller" | "Shopify store owner" | "eBay seller" | "Planning to sell online" | "Just curious";
type InterestOption = "Inventory storage" | "Order fulfillment" | "Marketplace management" | "Website + e-commerce setup" | "Not sure yet";
type VolumeOption = "Not selling yet" | "Under 100 orders / month" | "100-500 orders / month" | "500+ orders / month";

export default function ComingSoonPage() {
  const endpoint = useMemo(() => getEcomInterestEndpoint(), []);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sellerType, setSellerType] = useState<SellerType>("Planning to sell online");
  const [interests, setInterests] = useState<InterestOption[]>([]);
  const [volume, setVolume] = useState<VolumeOption>("Not selling yet");

  function toggleInterest(v: InterestOption) {
    setInterests((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!endpoint) { setError("Missing form endpoint."); return; }
    if (!email.trim()) { setError("Please enter your email."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, seller_type: sellerType, interests: interests.length ? interests.join(", ") : "-", monthly_order_volume: volume, source: "coming-soon-page", timestamp: new Date().toISOString() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && (data.error || data.message)) || "Submission failed.");
      setSubmitted(true);
    } catch (err: any) { setError(err?.message || "Something went wrong."); }
    finally { setSubmitting(false); }
  }

  return (
    <main className="container section" >
      <a href="/" className="pDark">Back to home</a>
      <h1 className="h1">E-commerce Support <span className="pDark">(Coming Later)</span></h1>
      <p className="p">We are exploring additional support services for online sellers including fulfillment and marketplace operations.<br /><strong>This is not live yet.</strong> We are currently focused on website projects.</p>
      <p className="p">If this is something you would be interested in, join our early-interest list below. There is no commitment.</p>

      <section className="panel">
        {submitted ? (
          <div className="panelBody">
            <h2 className="h2">You are on the list</h2>
            <p className="p">Thanks. Your interest has been noted. We will reach out if we move forward.</p>
            <a href="/" className="btn btnGhost">Back to home</a>
          </div>
        ) : (
          <>
            <div className="panelHeader">
              <h2 className="h2">Join Early Interest</h2>
              <p className="pDark">No obligation. No sales emails.</p>
            </div>
            <div className="panelBody">
              <form onSubmit={submit}>
                <div><div className="fieldLabel">Email address *</div><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@email.com" required /></div>
                <div><div className="fieldLabel">What best describes you?</div>
                  <div className="checkGrid">{(["Amazon seller","Shopify store owner","eBay seller","Planning to sell online","Just curious"] as SellerType[]).map((opt) => (<button key={opt} type="button" onClick={() => setSellerType(opt)} className={`btn ${sellerType === opt ? "btnPrimary" : "btnGhost"}`}>{opt}</button>))}</div>
                </div>
                <div><div className="fieldLabel">What interests you? (optional)</div>
                  <div className="checkGrid">{(["Inventory storage","Order fulfillment","Marketplace management","Website + e-commerce setup","Not sure yet"] as InterestOption[]).map((opt) => (<button key={opt} type="button" onClick={() => toggleInterest(opt)} className={`btn ${interests.includes(opt) ? "btnPrimary" : "btnGhost"}`}>{opt}</button>))}</div>
                  <p className="smallNote">Pick one or more.</p>
                </div>
                <div><div className="fieldLabel">Monthly order volume (optional)</div>
                  <select className="select" value={volume} onChange={(e) => setVolume(e.target.value as VolumeOption)}><option>Not selling yet</option><option>Under 100 orders / month</option><option>100-500 orders / month</option><option>500+ orders / month</option></select>
                </div>
                {error && <div className="hint" style={{ borderColor: "var(--accentStroke)", color: "var(--accent)" }}>{error}</div>}
                <button type="submit" disabled={submitting} className="btn btnPrimary wFull">{submitting ? "Submitting..." : "Join Early Interest"}</button>
                <p className="smallNote">By submitting, you agree to be contacted if we launch this service.</p>
              </form>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
