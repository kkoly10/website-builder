"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/")) return "/";
  return next;
}

export default function ForgotPasswordClient() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams]
  );

  async function handleResetEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;

      // Goes to callback first, then callback redirects to /reset-password
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) throw error;

      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="cardInner" style={{ display: "grid", gap: 12 }}>
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Password Reset
        </div>

        <h1 className="h2" style={{ margin: 0 }}>
          Reset your password
        </h1>

        <p className="p" style={{ marginTop: 0 }}>
          Enter your email and we’ll send you a reset link.
        </p>

        <form onSubmit={handleResetEmail} style={{ display: "grid", gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            style={inputStyle}
          />

          <button className="btn btnPrimary" type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send Reset Link"}
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

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="btn btnGhost">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.03)",
  color: "rgba(255,255,255,0.95)",
  padding: "12px 14px",
  outline: "none",
};