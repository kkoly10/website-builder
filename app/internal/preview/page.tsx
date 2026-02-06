import { Suspense } from "react";
import InternalPreviewClient from "./InternalPreviewClient";

export const dynamic = "force-dynamic";

export default function InternalPreviewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <InternalPreviewClient />
    </Suspense>
  );
}

function Loading() {
  return (
    <main style={{ maxWidth: 1100, margin: "80px auto", padding: 24 }}>
      <h1>PIE — Internal Evaluation</h1>
      <p style={{ color: "#666" }}>Loading internal report…</p>
    </main>
  );
}