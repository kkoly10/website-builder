import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function AutoSuccessPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Loading…</p>}>
      <SuccessClient />
    </Suspense>
  );
}