import { Suspense } from "react";
import EstimateClient from "./estimate-client";

export default function EstimatePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading estimate…</div>}>
      <EstimateClient />
    </Suspense>
  );
}