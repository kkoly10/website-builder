import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main className="container">
      <section className="section">
        <Suspense fallback={<ForgotLoadingCard />}>
          <ForgotPasswordClient />
        </Suspense>
      </section>
    </main>
  );
}

function ForgotLoadingCard() {
  return (
    <div className="card">
      <div className="cardInner">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Loading password reset…
        </div>
      </div>
    </div>
  );
}