// app/deposit/cancel/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default function DepositCancelPage({ searchParams }: { searchParams: SearchParams }) {
  const quoteId = pick(searchParams, "quoteId").trim();

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Deposit
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Payment canceled</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        No worries — you can return to your quote and try again.
      </p>

      {quoteId ? (
        <p className="smallNote" style={{ marginTop: 10 }}>
          Quote ID: <code>{quoteId}</code>
        </p>
      ) : null}

      <div style={{ height: 18 }} />

      <a className="btn btnPrimary" href="/">
        Back home <span className="btnArrow">→</span>
      </a>
    </main>
  );
}