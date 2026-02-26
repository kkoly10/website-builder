import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="container" style={{ padding: "80px 0", maxWidth: 440, margin: "0 auto" }}>
      <Suspense fallback={<LoginLoadingCard />}>
        <LoginClient />
      </Suspense>
    </main>
  );
}

function LoginLoadingCard() {
  return (
    <div className="card">
      <div className="cardInner">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Authenticating
        </div>
        <h1 className="h2" style={{ marginTop: 8 }}>Preparing sign-in...</h1>
      </div>
    </div>
  );
}
