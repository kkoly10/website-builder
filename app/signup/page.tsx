"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
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
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      if (data.session) {
        // If email confirmation is OFF, user may be logged in immediately.
        router.replace("/internal/admin");
        router.refresh();
        return;
      }

      // If email confirmation is ON
      setInfo("Account created. Check your email to confirm, then sign in.");
    } catch (err: any) {
      setError(err?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "20px auto" }}>
      <div className="card">
        <div className="cardInner">
          <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Create account</div>
          <div className="smallNote" style={{ marginBottom: 14 }}>
            Clients usually create an account after the scope call, but you can also create one now.
          </div>

          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: 10 }}>
              <label className="fieldLabel">Full name</label>
              <input
                className="input"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

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
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
                {busy ? "Creating..." : "Create account"}
              </button>

              <Link href="/login" className="btn btnGhost">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}