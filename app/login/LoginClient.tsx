"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/")) return "/";
  return next;
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams]
  );

  const flashMessage = useMemo(() => {
    if (searchParams.get("signup") === "1") {
      return "Account created. You can sign in now.";
    }
    if (searchParams.get("reset") === "1") {
      return "Password updated. Sign in with your new password.";
    }
    if (searchParams.get("verified") === "1") {
      return "Email verified. You can sign in now.";
    }
    return null;
  }, [searchParams]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in.");
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

        <h1 className="h2" style={{ margin: 0 }}>
          Sign in with email and password
        </h1>

        <p className="p" style={{ marginTop: 0 }}>
          Access your customer portal or internal dashboard.
        </p>

        {flashMessage ? (
          <div
            style={{
              borderRadius: 12,
              padding: 12,
              border: "1px solid rgba(80,220,120,0.35)",
              background: "rgba(80,220,120,0.08)",
            }}
          >
            {flashMessage}
          </div>
        ) : null}

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 10 }}>
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
            placeholder="Password"
            required
            style={inputStyle}
          />

          <button className="btn btnPrimary" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
            <span className="btnArrow">→</span>
          </button>
        </form>

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
          Redirect after login: <strong>{nextPath}</strong>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="btn btnGhost">
            Create Account
          </Link>
          <Link
            href={`/forgot-password?next=${encodeURIComponent(nextPath)}`}
            className="btn btnGhost"
          >
            Forgot Password
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