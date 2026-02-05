import { Suspense } from "react";
import EstimateClient from "./EstimateClient";

export const dynamic = "force-dynamic";

export default function EstimatePage() {
  return (
    <Suspense fallback={<Loading />}>
      <EstimateClient />
    </Suspense>
  );
}

function Loading() {
  return (
    <main style={{ maxWidth: 900, margin: "120px auto", padding: 24 }}>
      <h2 style={{ fontSize: 28 }}>Preparing your estimate…</h2>
      <p style={{ color: "#666" }}>
        We’re reviewing your answers and matching you with the right build
        option.
      </p>
    </main>
  );
}