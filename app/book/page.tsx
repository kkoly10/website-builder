// app/book/page.tsx
import BookClient from "./BookClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default function BookPage({ searchParams }: { searchParams: SearchParams }) {
  const quoteId = pick(searchParams, "quoteId").trim();
  return <BookClient quoteId={quoteId} />;
}