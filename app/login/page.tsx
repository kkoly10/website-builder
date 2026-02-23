"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) return null;
    return createClient(url, anon);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!supabase) {
      setError("Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      const next = searchParams.get("next") || "/internal/admin";
      router.replace(next);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "20px auto" }}>
      <div className="card">
        <div className="cardInner">
          <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Login</div>
          <div className="smallNote" style={{ marginBottom: 14 }}>
            Admin and returning clients can sign in here.
          </div>

          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: 10 }}>
              <label className="fieldLabel">Email</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="fieldLabel">Password</label>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <div style={{ marginBottom: 10, color: "#ffb4b4", fontSize: 13 }}>{error}</div>
            ) : null}

            {info ? (
              <div style={{ marginBottom: 10, color: "#b8f7c2", fontSize: 13 }}>{info}</div>
            ) : null}

            <div className="row" style={{ gap: 10, marginTop: 6 }}>
              <button className="btn btnPrimary" type="submit" disabled={busy}>
                {busy ? "Signing in..." : "Sign in"}
              </button>

              <Link href="/signup" className="btn btnGhost">
                Create account
              </Link>
            </div>
          </form>

          <div className="smallNote" style={{ marginTop: 14 }}>
            New clients can still use the estimate flow first, then create an account after the scope call.
          </div>
        </div>
      </div>
    </div>
  );
}