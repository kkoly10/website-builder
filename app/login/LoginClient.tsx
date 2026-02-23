"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    if (!next || !next.startsWith("/")) return "/";
    return next;
  }, [searchParams]);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) return null;

    return createBrowserClient(url, anon);
  }, []);

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("Supabase client is not configured.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setSubmitting(true);

    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo,
        },
      });

      if (error) throw error;

      setMessage("Magic link sent. Check your email to sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send magic link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="cardInner" style={{ display: "grid", gap: 12 }}>
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          CrecyStudio Login
        </div>

        <h1 className="h2" style={{ margin: 0 }}>Sign in</h1>

        <p className="p" style={{ marginTop: 0 }}>
          Use your email and we’ll send you a secure sign-in link.
        </p>

        <form onSubmit={handleMagicLink} style={{ display: "grid", gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.95)",
              padding: "12px 14px",
              outline: "none",
            }}
          />

          <button className="btn btnPrimary" type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send Magic Link"}
            <span className="btnArrow">→</span>
          </button>
        </form>

        {message ? (
          <div
            style={{
              borderRadius: 12,
              padding: 12,
              border: "1px solid rgba(80,220,120,0.35)",
              background: "rgba(80,220,120,0.08)",
            }}
          >
            {message}
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              borderRadius: 12,
              padding: 12,
              border: "1px solid rgba(255,80,80,0.35)",
              background: "rgba(255,80,80,0.08)",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        <div className="p" style={{ marginTop: 4 }}>
          After signing in, you’ll be redirected to: <strong>{nextPath}</strong>
        </div>
      </div>
    </div>
  );
}