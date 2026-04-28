import Link from "next/link";
import EcommerceBookClient from "./EcommerceBookClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function EcommerceBookPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const sp = await Promise.resolve(searchParams);
  const ecomIntakeId = pick(sp, "ecomIntakeId").trim();

  if (!ecomIntakeId) {
    return (
      <main className="container" style={{ paddingBottom: 80 }}>
        <section className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="card">
            <div className="cardInner" style={{ padding: 30 }}>
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                E-commerce Booking
              </div>

              <div style={{ height: 10 }} />
              <h1 className="h2">Missing e-commerce intake</h1>
              <p className="pDark">
                Start from the e-commerce intake page so we can attach the booking to the right
                submission.
              </p>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/ecommerce/intake" className="btn btnPrimary">
                  Start E-commerce Intake <span className="btnArrow">→</span>
                </Link>
                <Link href="/" className="btn btnGhost">
                  Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <EcommerceBookClient ecomIntakeId={ecomIntakeId} />;
}
