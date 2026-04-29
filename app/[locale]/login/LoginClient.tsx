"use client";

import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safeNextPath(next: string | null) {
  // Enhanced: Defaults to /portal instead of /
  if (!next || !next.startsWith("/")) return "/portal";
  return next;
}

export default function LoginClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tLogin = useTranslations("auth.login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
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
    <div className="card" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.4)", border: "1px solid var(--accentStroke)" }}>
      <div className="cardInner" >

        <div>
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            {tLogin("kicker")}
          </div>
          <h1 className="h2" >{tLogin("title")}</h1>
          <p className="pDark" style={{ marginTop: 6 }}>
            {tLogin("subtitle")}
          </p>
        </div>

        {flashMessage && (
          <div style={{ borderRadius: 8, padding: 12, border: "1px solid var(--stroke)", background: "var(--panel2)", color: "var(--fg)", fontSize: 13 }}>
            {flashMessage}
          </div>
        )}

        <form onSubmit={handleLogin} >
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
          <div style={{ borderRadius: 8, padding: 12, border: "1px solid var(--accentStroke)", background: "var(--bg2)", color: "var(--accent)", fontSize: 13, fontWeight: 700 }}>
            <strong>{t("errorPrefix")}</strong> {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--stroke)", paddingTop: 16, marginTop: 8 }}>
          <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
            {tLogin("needAccount")} <span style={{ color: "var(--fg)", fontWeight: 700 }}>{tLogin("signUpLink")}</span>
          </Link>
          <Link href={`/forgot-password?next=${encodeURIComponent(nextPath)}`} style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
            {tLogin("forgotPassword")}
          </Link>
        </div>
      </div>
    </div>
  );
}
