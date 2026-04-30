"use client";

import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/")) return "/";
  return next;
}

export default function ForgotPasswordClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tForgot = useTranslations("auth.forgotPassword");

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

      setMessage(tForgot("success"));
    } catch (err) {
      setError(err instanceof Error ? err.message : tForgot("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="cardInner" >
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          {tForgot("kicker")}
        </div>

        <h1 className="h2" >
          {tForgot("title")}
        </h1>

        <p className="p" style={{ marginTop: 0 }}>
          {tForgot("subtitle")}
        </p>

        <form onSubmit={handleResetEmail} style={{ display: "grid", gap: "1rem" }}>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            required
            autoComplete="email"
          />

          <button className="btn btnPrimary" type="submit" disabled={submitting}>
            {submitting ? tForgot("submitting") : tForgot("submit")}
            <span className="btnArrow">→</span>
          </button>
        </form>

        {message ? (
          <div style={{ padding: 12, border: "1px solid var(--success)", background: "var(--success-bg)", color: "var(--success)", fontSize: 13 }}>
            {message}
          </div>
        ) : null}

        {error ? (
          <div style={{ padding: 12, border: "1px solid var(--accent)", background: "var(--accent-bg)", color: "var(--accent-2)", fontSize: 13, fontWeight: 700 }}>
            <strong>{t("errorPrefix")}</strong> {error}
          </div>
        ) : null}

        <div >
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="btn btnGhost">
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}

