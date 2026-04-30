"use client";

import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/")) return "/";
  return next;
}

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tReset = useTranslations("auth.resetPassword");

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
      setError(tReset("minLengthError"));
      return;
    }

    if (password !== confirmPassword) {
      setError(tReset("mismatchError"));
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
      setError(err instanceof Error ? err.message : tReset("error"));
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="cardInner" >
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          {tReset("kicker")}
        </div>

        <h1 className="h2" >
          {tReset("title")}
        </h1>

        <p className="p" style={{ marginTop: 0 }}>
          {tReset("subtitle")}
        </p>

        <form onSubmit={handleUpdatePassword} style={{ display: "grid", gap: "1rem" }}>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={tReset("newPasswordPlaceholder")}
            required
            autoComplete="new-password"
          />

          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={tReset("confirmPasswordPlaceholder")}
            required
            autoComplete="new-password"
          />

          <button className="btn btnPrimary" type="submit" disabled={submitting}>
            {submitting ? tReset("submitting") : tReset("submit")}
            <span className="btnArrow">→</span>
          </button>
        </form>

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

