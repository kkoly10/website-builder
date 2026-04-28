import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main className="container">
      <section className="section">
        <Suspense fallback={<ResetLoadingCard />}>
          <ResetPasswordClient />
        </Suspense>
      </section>
    </main>
  );
}

function ResetLoadingCard() {
  return (
    <div className="card">
      <div className="cardInner">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Loading reset page…
        </div>
      </div>
    </div>
  );
}