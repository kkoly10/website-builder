"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safeNextPath(next: string | null) {
  // Enhanced: Defaults to /portal instead of /
  if (!next || !next.startsWith("/")) return "/portal";
  return next;
}

export default function LoginClient() {
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
    if (searchParams.get("signup") === "1") return "Account created. You can sign in now.";
    if (searchParams.get("reset") === "1") return "Password updated. Sign in with your new password.";
    if (searchParams.get("verified") === "1") return "Email verified. You can sign in now.";
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

      // Important: route through callback so ADMIN_EMAILS admin logic runs
      window.location.assign(`/auth/callback?next=${encodeURIComponent(nextPath)}`);
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in.");
      setSubmitting(false);
    }
  }

  return (
    <div className="card" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.4)", border: "1px solid var(--accentStroke)" }}>
      <div className="cardInner" style={{ display: "grid", gap: 16 }}>
        
        <div>
          {/* RESTORED BRANDING */}
          <div className="kicker" style={{ marginBottom: 8 }}>
            <span className="kickerDot" aria-hidden="true" />
            CrecyStudio Login
          </div>
          <h1 className="h2" style={{ margin: 0 }}>Welcome Back</h1>
          <p className="pDark" style={{ marginTop: 6 }}>
            Sign in to access your project workspaces.
          </p>
        </div>

        {flashMessage && (
          <div style={{ borderRadius: 8, padding: 12, border: "1px solid var(--stroke)", background: "var(--panel2)", color: "var(--fg)", fontSize: 13 }}>
            {flashMessage}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
          <div>
            <label className="fieldLabel">Email Address</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="fieldLabel">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button className="btn btnPrimary" type="submit" disabled={submitting} style={{ marginTop: 8, padding: "12px", fontSize: 15, width: "100%", justifyContent: "center" }}>
            {submitting ? "Authenticating..." : "Sign In →"}
          </button>
        </form>

        {error && (
          <div style={{ borderRadius: 8, padding: 12, border: "1px solid var(--accentStroke)", background: "var(--bg2)", color: "var(--accent)", fontSize: 13, fontWeight: 700 }}>
            <strong>Error: </strong> {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--stroke)", paddingTop: 16, marginTop: 8 }}>
          <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
            Need an account? <span style={{ color: "var(--fg)", fontWeight: 700 }}>Sign up</span>
          </Link>
          <Link href={`/forgot-password?next=${encodeURIComponent(nextPath)}`} style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
}
