import { Suspense } from "react";
import SignupClient from "./SignupClient";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <main className="container">
      <section className="section">
        <Suspense fallback={<SignupLoadingCard />}>
          <SignupClient />
        </Suspense>
      </section>
    </main>
  );
}

function SignupLoadingCard() {
  return (
    <div className="card">
      <div className="cardInner">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Loading signup…
        </div>
        <div style={{ height: 10 }} />
        <h1 className="h2">Preparing account setup</h1>
      </div>
    </div>
  );
}