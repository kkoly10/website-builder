"use client";

import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeNextPathOr } from "@/lib/redirects";
import ConversionShell from "@/components/site/ConversionShell";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tLogin = useTranslations("auth.login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(
    () => safeNextPathOr(searchParams.get("next"), "/portal"),
    [searchParams]
  );

  const flashMessage = useMemo(() => {
    if (searchParams.get("signup") === "1") return tLogin("flashSignup");
    if (searchParams.get("reset") === "1") return tLogin("flashReset");
    if (searchParams.get("verified") === "1") return tLogin("flashVerified");
    return null;
  }, [searchParams, tLogin]);

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
      setError(err instanceof Error ? err.message : tLogin("error"));
      setSubmitting(false);
    }
  }

  return (
    <ConversionShell
      kicker={tLogin("kicker")}
      title={tLogin("title")}
      subtitle={tLogin("subtitle")}
      flash={flashMessage}
      footer={
        <>
          <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
            {tLogin("needAccount")} <span style={{ color: "var(--fg)", fontWeight: 700 }}>{tLogin("signUpLink")}</span>
          </Link>
          <Link href={`/forgot-password?next=${encodeURIComponent(nextPath)}`} style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
            {tLogin("forgotPassword")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} style={{ display: "grid", gap: "1rem" }}>
        <div>
          <label className="fieldLabel">{t("emailLabel")}</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="fieldLabel">{t("passwordLabel")}</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            required
            autoComplete="current-password"
          />
        </div>

        <button className="btn btnPrimary" type="submit" disabled={submitting} style={{ marginTop: 8, padding: "12px", fontSize: 15, width: "100%", justifyContent: "center" }}>
          {submitting ? tLogin("submitting") : `${tLogin("submit")} →`}
        </button>
      </form>

      {error && (
        <div style={{ padding: 12, border: "1px solid var(--accent)", background: "var(--accent-bg)", color: "var(--accent-2)", fontSize: 13, fontWeight: 700 }}>
          <strong>{t("errorPrefix")}</strong> {error}
        </div>
      )}
    </ConversionShell>
  );
}
