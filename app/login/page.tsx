import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="container">
      <section className="section">
        <Suspense fallback={<LoginLoadingCard />}>
          <LoginClient />
        </Suspense>
      </section>
    </main>
  );
}

function LoginLoadingCard() {
  return (
    <div className="card">
      <div className="cardInner">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Loading login…
        </div>

        <div style={{ height: 10 }} />
        <h1 className="h2">Preparing sign-in page</h1>
        <p className="p" style={{ marginTop: 8 }}>
          One moment while we load your login options.
        </p>
      </div>
    </div>
  );
}