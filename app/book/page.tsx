// app/book/page.tsx
import { Suspense } from "react";
import BookClient from "./BookClient";

export const dynamic = "force-dynamic";

function Fallback() {
  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Book
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Loading…</h1>
      <p className="p" style={{ maxWidth: 820, marginTop: 10 }}>
        Preparing your booking step.
      </p>
    </main>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <BookClient />
    </Suspense>
  );
}