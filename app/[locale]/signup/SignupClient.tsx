"use client";

import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/")) return "/portal";
  return next;
}

export default function SignupClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("auth");
  const tSignup = useTranslations("auth.signup");

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
      router.push(`/login?signup=1&next=${encodeURIComponent(nextPath)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : tSignup("error"));
      setSubmitting(false);
    }
  }

  return (
    <div className="card" style={{ border: "1px solid var(--accent)" }}>
      <div className="cardInner">
        <div>
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            {tSignup("kicker")}
          </div>
          <h1 className="h2">{tSignup("title")}</h1>
          <p className="pDark" style={{ marginTop: 6 }}>
            {tSignup("subtitle")}
          </p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "grid", gap: "1rem" }}>
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
              autoComplete="new-password"
              minLength={8}
            />
            <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
              {tSignup("minLengthHint")}
            </div>
          </div>

          <button className="btn btnPrimary" type="submit" disabled={submitting} style={{ marginTop: 8, padding: "12px", fontSize: 15, width: "100%", justifyContent: "center" }}>
            {submitting ? tSignup("submitting") : `${tSignup("submit")} →`}
          </button>
        </form>

        {error && (
          <div style={{ padding: 12, border: "1px solid var(--accent)", background: "var(--accent-bg)", color: "var(--accent-2)", fontSize: 13, fontWeight: 700 }}>
            <strong>{t("errorPrefix")}</strong> {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", borderTop: "1px solid var(--stroke)", paddingTop: 16, marginTop: 8 }}>
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
            {tSignup("haveAccount")} <span style={{ color: "var(--fg)", fontWeight: 700 }}>{tSignup("signInLink")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
