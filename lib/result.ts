// Shared Result<T> type for validation/parse helpers across the codebase.
//
// Why this exists: Next.js 16 + Turbopack's TypeScript checker has a known
// quirk where it stops narrowing discriminated unions across imported
// helper boundaries. The classic
//   type R<T> = { ok: true; value: T } | { ok: false; error: string }
// shape narrows fine in tsc / tsc --strict, then breaks on the Vercel
// build with errors like:
//   "Property 'error' does not exist on type '{ ok: true; value: T }'"
// after a `if (!result.ok)` check.
//
// We've hit this 4+ times in this codebase. Rather than re-inventing the
// fix each time, this module exports the non-discriminated shape that's
// portable across both checkers: both fields are always present, null
// fills the inactive slot. Callers read result.ok first then either
// result.value or result.error without TypeScript needing to narrow.
//
// Use okResult() / errResult() to construct values so the shape is
// consistent everywhere.

export type Result<T> = {
  ok: boolean;
  value: T | null;
  error: string | null;
};

export function okResult<T>(value: T): Result<T> {
  return { ok: true, value, error: null };
}

export function errResult<T = never>(error: string): Result<T> {
  return { ok: false, value: null, error };
}

// Type guard that lets callers narrow if they really want to. Most code
// can just check `if (!result.ok)` since both fields exist regardless.
export function isOk<T>(result: Result<T>): result is Result<T> & { value: T } {
  return result.ok && result.value !== null;
}
