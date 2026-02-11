"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type SearchParams = Record<string, string | string[] | undefined>;

type Intake = {
  mode?: string;
  intent?: string;
  intentOther?: string;
  websiteType?: string;
  pages?: string;

  booking?: boolean;
  payments?: boolean;
  blog?: boolean;
  membership?: boolean;

  wantsAutomation?: string;
  wantsBranding?: string;
  wantsContent?: string;
  wantsLogo?: string;

  deadline?: string;
  budget?: string;

  businessName?: string;
  industry?: string;
  location?: string;

  notes?: string;
};

type Props =
  | { searchParams: SearchParams }
  | { intake: Intake; leadEmail: string; leadPhone: string };

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function parseBool(x: string) {
  return x === "true" || x === "1" || x === "yes" || x === "on";
}

function normalizeFromSearchParams(searchParams: SearchParams) {
  const intake: Intake = {
    mode: pick(searchParams, "mode"),
    intent: pick(searchParams, "intent"),
    intentOther: pick(searchParams, "intentOther"),
    websiteType: pick(searchParams, "websiteType"),
    pages: pick(searchParams, "pages"),

    booking: parseBool(pick(searchParams, "booking")),
    payments: parseBool(pick(searchParams, "payments")),
    blog: parseBool(pick(searchParams, "blog")),
    membership: parseBool(pick(searchParams, "membership")),

    wantsAutomation: pick(searchParams, "wantsAutomation"),
    wantsBranding: pick(searchParams, "wantsBranding"),
    wantsContent: pick(searchParams, "wantsContent"),
    wantsLogo: pick(searchParams, "wantsLogo"),

    deadline: pick(searchParams, "deadline"),
    budget: pick(searchParams, "budget"),

    businessName: pick(searchParams, "businessName"),
    industry: pick(searchParams, "industry"),
    location: pick(searchParams, "location"),

    notes: pick(searchParams, "notes"),
  };

  const leadEmail = pick(searchParams, "leadEmail") || pick(searchParams, "email");
  const leadPhone = pick(searchParams, "leadPhone") || pick(searchParams, "phone");

  return { intake, leadEmail, leadPhone };
}

function money(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function EstimateClient(props: Props) {
  const { intake, leadEmail, leadPhone } = useMemo(() => {
    if ("searchParams" in props) return normalizeFromSearchParams(props.searchParams);
    return { intake: props.intake, leadEmail: props.leadEmail, leadPhone: props.leadPhone };
  }, [props]);

  const [showBreakdown, setShowBreakdown] = useState(false);

  const calc = useMemo(() => {
    // base
    let base = 450;

    // website type boost
    const type = (intake.websiteType || "").toLowerCase();
    if (type.includes("landing")) base = 450;
    else if (type.includes("business")) base = 650;
    else if (type.includes("ecommerce") || type.includes("shop")) base = 1100;
    else if (type.includes("portfolio")) base = 550;

    // pages
    const pagesRaw = intake.pages || "";
    let pageCount = 4;
    const m = pagesRaw.match(/\d+/);
    if (m?.[0]) pageCount = clamp(parseInt(m[0], 10), 1, 20);
    base += Math.max(0, pageCount - 4) * 85;

    // features
    const features: { label: string; on: boolean; add: number }[] = [
      { label: "Booking / Scheduling", on: !!intake.booking, add: 180 },
      { label: "Payments / Checkout", on: !!intake.payments, add: 240 },
      { label: "Blog / Articles", on: !!intake.blog, add: 120 },
      { label: "Membership / Login", on: !!intake.membership, add: 320 },
    ];

    // add-ons
    const addons: { label: string; when: boolean; add: number }[] = [
      { label: "Automation setup", when: (intake.wantsAutomation || "").toLowerCase() === "yes", add: 160 },
      { label: "Branding refresh", when: (intake.wantsBranding || "").toLowerCase() === "yes", add: 220 },
      { label: "Content writing help", when: (intake.wantsContent || "").toLowerCase() === "yes", add: 180 },
      { label: "Logo help", when: (intake.wantsLogo || "").toLowerCase() === "yes", add: 160 },
    ];

    let total = base;
    let featuresTotal = 0;
    for (const f of features) if (f.on) featuresTotal += f.add;
    total += featuresTotal;

    let addonsTotal = 0;
    for (const a of addons) if (a.when) addonsTotal += a.add;
    total += addonsTotal;

    // nice range (+/-)
    const low = Math.round(total * 0.92);
    const high = Math.round(total * 1.12);

    return { base, pageCount, features, addons, featuresTotal, addonsTotal, total, low, high };
  }, [intake]);

  return (
    <main className="container" style={{ paddingTop: 56, paddingBottom: 30 }}>
      <section className="panel" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "var(--muted)", fontWeight: 900, letterSpacing: 0.2, fontSize: 12 }}>
              Instant estimate
            </div>
            <h1 style={{ margin: "8px 0 0", fontSize: 34, letterSpacing: -0.6 }}>
              Your website range:{" "}
              <span style={{ background: "linear-gradient(135deg, var(--accentA), var(--accentC))", WebkitBackgroundClip: "text", color: "transparent" }}>
                ${money(calc.low)} – ${money(calc.high)}
              </span>
            </h1>
            <div style={{ marginTop: 10, color: "var(--muted)", lineHeight: 1.6 }}>
              Based on your inputs. If you want, we can lock scope + price after a quick review (usually 5–10 minutes).
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/build" className="btn btnPrimary">
              Start Custom Build →
            </Link>
            <button
              className="btn btnGhost"
              onClick={() => setShowBreakdown((v) => !v)}
              type="button"
              aria-expanded={showBreakdown}
            >
              {showBreakdown ? "Hide breakdown" : "Show breakdown"}
            </button>
          </div>
        </div>

        {/* small “summary pills” */}
        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Pill label="Website type" value={intake.websiteType || "—"} />
          <Pill label="Pages" value={intake.pages || `${calc.pageCount}`} />
          <Pill label="Deadline" value={intake.deadline || "—"} />
          <Pill label="Budget" value={intake.budget || "—"} />
        </div>

        {showBreakdown ? (
          <div style={{ marginTop: 18, display: "grid", gap: 14, gridTemplateColumns: "1.2fr 0.8fr" }}>
            <div className="card" style={{ padding: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>Breakdown</h2>

              <Row label="Base" value={`$${money(calc.base)}`} />
              <Row label="Pages considered" value={`${calc.pageCount}`} />

              <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "12px 0" }} />

              <div style={{ color: "var(--muted)", fontWeight: 900, fontSize: 12, marginBottom: 8 }}>
                Features
              </div>
              {calc.features.filter((x) => x.on).length ? (
                calc.features.filter((x) => x.on).map((f) => (
                  <Row key={f.label} label={f.label} value={`+$${money(f.add)}`} />
                ))
              ) : (
                <div style={{ color: "var(--muted)" }}>No extra features selected.</div>
              )}

              <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "12px 0" }} />

              <div style={{ color: "var(--muted)", fontWeight: 900, fontSize: 12, marginBottom: 8 }}>
                Add-ons
              </div>
              {calc.addons.filter((x) => x.when).length ? (
                calc.addons.filter((x) => x.when).map((a) => (
                  <Row key={a.label} label={a.label} value={`+$${money(a.add)}`} />
                ))
              ) : (
                <div style={{ color: "var(--muted)" }}>No add-ons selected.</div>
              )}

              <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "12px 0" }} />

              <Row label="Estimated total" value={`~ $${money(calc.total)}`} strong />
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>
                Range accounts for complexity + polish. Final price is confirmed after scope review.
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>Your details</h2>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <Meta label="Business name" value={intake.businessName || "—"} />
                <Meta label="Industry" value={intake.industry || "—"} />
                <Meta label="Location" value={intake.location || "—"} />
                <Meta label="Email" value={leadEmail || "—"} />
                <Meta label="Phone" value={leadPhone || "—"} />
              </div>

              {intake.notes ? (
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: "var(--muted)", fontWeight: 900, fontSize: 12 }}>Notes</div>
                  <div style={{ marginTop: 6, lineHeight: 1.6 }}>{intake.notes}</div>
                </div>
              ) : null}

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                <Link href="/build" className="btn btnPrimary">
                  Lock scope + start →
                </Link>
                <Link href="/ai" className="btn btnGhost">
                  Try AI option
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        padding: "10px 12px",
        borderRadius: 999,
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <span style={{ color: "var(--muted)", fontWeight: 900, fontSize: 12 }}>{label}:</span>
      <span style={{ fontWeight: 900 }}>{value}</span>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 8 }}>
      <div style={{ color: "var(--muted)", fontWeight: 800 }}>{label}</div>
      <div style={{ fontWeight: strong ? 900 : 800 }}>{value}</div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ color: "var(--muted)", fontWeight: 900, fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 900, textAlign: "right" }}>{value}</div>
    </div>
  );
}
