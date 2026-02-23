"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/")) return "/";
  return next;
}

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams]
  );

  async function handleUpdatePassword(e: FormEvent) {
    e.preventDefault();
    setError(null);

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

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      router.replace(`/login?reset=1&next=${encodeURIComponent(nextPath)}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update password. Open this page from the reset email link."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="cardInner" style={{ display: "grid", gap: 12 }}>
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Set New Password
        </div>

        <h1 className="h2" style={{ margin: 0 }}>
          Choose a new password
        </h1>

        <p className="p" style={{ marginTop: 0 }}>
          Open this page from the password reset link in your email.
        </p>

        <form onSubmit={handleUpdatePassword} style={{ display: "grid", gap: 10 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (8+ characters)"
            required
            style={inputStyle}
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            style={inputStyle}
          />

          <button className="btn btnPrimary" type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Update Password"}
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