import { Suspense } from "react";
import SignupClient from "./SignupClient";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <main className="container" style={{ padding: "80px 0", maxWidth: 440, margin: "0 auto" }}>
      <Suspense fallback={<SignupLoadingCard />}>
        <SignupClient />
      </Suspense>
    </main>
  );
}

function SignupLoadingCard() {
  return (
    <div className="card">
      <div className="cardInner">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Registration
        </div>
        <h1 className="h2" style={{ marginTop: 8 }}>Preparing signup...</h1>
      </div>
    </div>
  );
}
