import { Suspense } from "react";
import EstimateClient from "./EstimateClient";

export default function EstimatePage() {
  return (
    <Suspense fallback={<Loading />}>
      <EstimateClient />
    </Suspense>
  );
}

function Loading() {
  return (
    <main style={{ maxWidth: 800, margin: "100px auto", padding: 24 }}>
      <h2>Calculating your estimate…</h2>
      <p style={{ color: "#666" }}>
        Please wait while we prepare your project options.
      </p>
    </main>
  );
}
