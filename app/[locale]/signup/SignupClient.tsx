"use client";

import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeNextPathOr } from "@/lib/redirects";
import ConversionShell from "@/components/site/ConversionShell";

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
    () => safeNextPathOr(searchParams.get("next"), "/portal"),
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
    <ConversionShell
      kicker={tSignup("kicker")}
      title={tSignup("title")}
      subtitle={tSignup("subtitle")}
      footer={
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none", margin: "0 auto" }}>
          {tSignup("haveAccount")} <span style={{ color: "var(--fg)", fontWeight: 700 }}>{tSignup("signInLink")}</span>
        </Link>
      }
    >
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
    </ConversionShell>
  );
}
