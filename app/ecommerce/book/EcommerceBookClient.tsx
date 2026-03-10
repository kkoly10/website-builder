"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics/client";

type Props = {
  ecomIntakeId: string;
};

export default function EcommerceBookClient({ ecomIntakeId }: Props) {
  const router = useRouter();
  const [bestTime, setBestTime] = useState("Morning");
  const [preferredTimes, setPreferredTimes] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const intakeShort = useMemo(() => ecomIntakeId.slice(0, 8), [ecomIntakeId]);
  useEffect(() => {
    trackEvent({ event: "ecom_call_booking_viewed", page: "/ecommerce/book" });
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch {}
  }, []);


  const submit = async () => {
    if (!ecomIntakeId) {
      trackEvent({ event: "ecom_call_booking_dropoff", page: "/ecommerce/book", metadata: { reason: "missing_intake" } });
      setError("Missing intake id. Please return to the intake form first.");
      return;
    }

    if (!bestTime.trim()) {
      trackEvent({ event: "ecom_call_booking_dropoff", page: "/ecommerce/book", metadata: { reason: "missing_best_time" } });
      setError("Please select your best time to connect.");
      return;
    }

    setSubmitting(true);
    setError("");
    trackEvent({ event: "ecom_call_booking_submit_attempted", page: "/ecommerce/book" });

    try {
      const res = await fetch("/api/ecommerce/request-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ecomIntakeId, bestTime, preferredTimes, timezone, notes }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Request failed.");
      trackEvent({ event: "ecom_call_booking_submit_succeeded", page: "/ecommerce/book" });

      router.push(data.nextUrl || `/ecommerce/success?ecomIntakeId=${encodeURIComponent(ecomIntakeId)}`);
    } catch (err: any) {
      trackEvent({ event: "ecom_call_booking_submit_failed", page: "/ecommerce/book" });
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <main className="container" style={{ paddingBottom: 80 }}>
      <section className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="card">
          <div className="cardInner" style={{ padding: 30 }}>
            <div className="kicker">Next Step</div>
            <h1 className="h1" style={{ marginTop: 10 }}>Book or update your seller planning call</h1>
            <p className="pDark">Your intake #{intakeShort || "pending"} is in. Share your preferred times and we&apos;ll coordinate your next strategy call.</p>

            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
              <div>
                <label className="fieldLabel">Best time to connect *</label>
                <select className="select" value={bestTime} onChange={(e) => setBestTime(e.target.value)}>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Flexible</option>
                </select>
              </div>
              <div>
                <label className="fieldLabel">Preferred days/times</label>
                <input className="input" value={preferredTimes} onChange={(e) => setPreferredTimes(e.target.value)} placeholder="Mon–Wed after 2 PM" />
              </div>
              <div>
                <label className="fieldLabel">Timezone</label>
                <input className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="America/New_York" />
              </div>
              <div>
                <label className="fieldLabel">Notes</label>
                <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ minHeight: 90 }} placeholder="Anything we should prepare before the call" />
              </div>
            </div>

            {error ? <p style={{ color: "#ef4444", marginTop: 12 }}>{error}</p> : null}

            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btnPrimary" onClick={submit} disabled={submitting}>
                {submitting ? "Saving..." : "Book / Update Call"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
