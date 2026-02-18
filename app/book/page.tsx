// app/book/page.tsx
import BookClient from "./BookClient";

export const dynamic = "force-dynamic";

export default function BookPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams?.quoteId;
  const quoteId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  return <BookClient quoteId={quoteId.trim()} />;
}