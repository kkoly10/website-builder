// Renders a JSON-LD <script> for the given graph. Server-only — the
// `graph` object is fully serialized at build/render time and parsed by
// crawlers as data, not executed as code. Centralized so we can change
// the wrapper (e.g. add suppressHydrationWarning or a key) in one place.
export default function StructuredData({ graph }: { graph: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
