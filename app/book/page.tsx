// app/book/page.tsx
import BookClient from "./BookClient";

export const dynamic = "force-dynamic";

export default function BookPage({
  searchParams,
}: {
  searchParams: { quoteId?: string };
}) {
  const quoteId = typeof searchParams?.quoteId === "string" ? searchParams.quoteId : "";
  return <BookClient quoteId={quoteId} />;
}