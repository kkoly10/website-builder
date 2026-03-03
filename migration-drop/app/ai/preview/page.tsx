import { Suspense } from "react";
import PreviewClient from "./preview-client";

export default function AIPreviewPage() {
  return (
    <Suspense fallback={<div>Loading AI preview…</div>}>
      <PreviewClient />
    </Suspense>
  );
}
