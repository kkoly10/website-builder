import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default function BookPage({ searchParams }: { searchParams: SearchParams }) {
  const quoteId = pick(searchParams, "quoteId").trim();

  // ✅ Replace with your Calendly link (or keep as-is for now)
  const CALENDLY_URL =
    "https://calendly.com/YOUR_HANDLE/crecystudio-scope-call?hide_event_type_details=1&hide_gdpr_banner=1";

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Scope Call
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Book your scope call</h1>
      <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
        We’ll confirm your scope, answer questions, and recommend the cleanest plan.
        <br />
        <strong>Payment happens after the call</strong> — once scope is locked, we send your deposit link.
      </p>

      <div style={{ height: 18 }} />

      {quoteId ? (
        <section className="panel" style={{ marginBottom: 18 }}>
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Reference</div>
            <div className="smallNote">Keep this for your records.</div>
          </div>
          <div className="panelBody">
            <div className="smallNote">
              Quote ID: <code style={{ fontWeight: 900 }}>{quoteId}</code>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 950 }}>Choose a time</div>
          <div className="smallNote">
            If the embedded scheduler doesn’t load, use the button below.
          </div>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 12 }}>
          <a className="btn btnPrimary" href={CALENDLY_URL} target="_blank" rel="noreferrer">
            Open scheduler <span className="btnArrow">→</span>
          </a>

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <iframe
              src={CALENDLY_URL}
              style={{ width: "100%", height: 820, border: 0 }}
              title="Calendly booking"
            />
          </div>

          <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
            <Link className="btn btnGhost" href="/estimate">
              Back to estimate
            </Link>
            <Link className="btn btnGhost" href="/">
              Back home
            </Link>
          </div>

          <div className="smallNote" style={{ opacity: 0.8 }}>
            After the call: we lock scope → send deposit link → kickoff checklist.
          </div>
        </div>
      </section>

      <div className="footer">
        © {new Date().getFullYear()} CrecyStudio. Built to convert. Clear scope. Clean builds.
        <div className="footerLinks">
          <Link href="/">Home</Link>
          <Link href="/estimate">Estimate</Link>
          <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
        </div>
      </div>
    </main>
  );
}