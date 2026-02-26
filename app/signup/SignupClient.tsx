"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/")) return "/portal";
  return next;
}

export default function SignupClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams]
  );

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (signUpError) throw signUpError;
      
      // Successfully created -> push to login with confirmation flag
      router.push(`/login?signup=1&next=${encodeURIComponent(nextPath)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
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
            CrecyStudio Registration
          </div>
          <h1 className="h2" style={{ margin: 0 }}>Create Account</h1>
          <p className="pDark" style={{ marginTop: 6 }}>
            Register to view your quotes and project workspaces.
          </p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "grid", gap: 12 }}>
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
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <button className="btn btnPrimary" type="submit" disabled={submitting} style={{ marginTop: 8, padding: "12px", fontSize: 15, width: "100%", justifyContent: "center" }}>
            {submitting ? "Creating account..." : "Sign Up →"}
          </button>
        </form>

        {error && (
          <div style={{ borderRadius: 8, padding: 12, border: "1px solid var(--accentStroke)", background: "var(--bg2)", color: "var(--accent)", fontSize: 13, fontWeight: 700 }}>
            <strong>Error: </strong> {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", borderTop: "1px solid var(--stroke)", paddingTop: 16, marginTop: 8 }}>
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
            Already have an account? <span style={{ color: "var(--fg)", fontWeight: 700 }}>Sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
