"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/")) return "/";
  return next;
}

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams]
  );

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const origin = window.location.origin;
      const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
        },
      });

      if (error) throw error;

      // If email confirmation is disabled in Supabase, session may exist immediately.
      if (data.session) {
        router.replace(nextPath);
        router.refresh();
        return;
      }

      setMessage(
        "Account created. Check your email to verify your account, then sign in."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="cardInner" style={{ display: "grid", gap: 12 }}>
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          CrecyStudio Signup
        </div>

        <h1 className="h2" style={{ margin: 0 }}>
          Create your account
        </h1>

        <p className="p" style={{ marginTop: 0 }}>
          Use this account to track your project and access your portal.
        </p>

        <form onSubmit={handleSignup} style={{ display: "grid", gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            style={inputStyle}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ characters)"
            required
            style={inputStyle}
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
            style={inputStyle}
          />

          <button className="btn btnPrimary" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Account"}
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
            Already have an account?
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