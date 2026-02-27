import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  isAdminEmail,
  safeNextPath,
} from "@/lib/supabase/server";

// Next.js 15+ Search Params type
type SearchParamsPromise = Promise<{
  error?: string;
  message?: string;
  next?: string;
  token?: string;
  email?: string;
}>;

export const dynamic = "force-dynamic";

export default async function LoginPage(props: { searchParams: SearchParamsPromise }) {
  const sp = await props.searchParams;

  const error = sp.error || "";
  const message = sp.message || "";
  const next = safeNextPath(sp.next || null);
  const token = sp.token || "";
  const prefillEmail = sp.email || "";

  async function signIn(formData: FormData) {
    "use server";

    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const nextRaw = String(formData.get("next") || "");
    const tokenRaw = String(formData.get("token") || "");

    const nextPath = safeNextPath(nextRaw);

    if (!email || !password) {
      redirect(
        `/auth/login?error=${encodeURIComponent(
          "Email and password are required."
        )}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}${
          tokenRaw ? `&token=${encodeURIComponent(tokenRaw)}` : ""
        }&email=${encodeURIComponent(email)}`
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      redirect(
        `/auth/login?error=${encodeURIComponent(
          authError?.message || "Invalid login credentials."
        )}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}${
          tokenRaw ? `&token=${encodeURIComponent(tokenRaw)}` : ""
        }&email=${encodeURIComponent(email)}`
      );
    }

    const userEmail = data.user.email?.toLowerCase() || "";
    const admin = isAdminEmail(userEmail);

    if (admin) {
      if (nextPath && nextPath.startsWith("/internal")) {
        redirect(nextPath);
      }
      redirect("/internal/admin");
    }

    // Customer flow
    if (nextPath && nextPath.startsWith("/portal")) {
      redirect(nextPath);
    }

    if (tokenRaw) {
      redirect(`/portal/${tokenRaw}`);
    }

    // Fallback if customer logs in without a portal link
    redirect("/portal");
  }

  return (
    <main className="container" style={{ padding: "80px 0", maxWidth: 440, margin: "0 auto" }}>
      <div className="card" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.4)", border: "1px solid var(--accentStroke)" }}>
        <div className="cardInner" style={{ display: "grid", gap: 16 }}>
          
          <div>
            <div className="kicker" style={{ marginBottom: 8 }}>
              <span className="kickerDot" aria-hidden="true" />
              CrecyStudio Login
            </div>
            <h1 className="h2" style={{ margin: 0 }}>Welcome Back</h1>
            <p className="pDark" style={{ marginTop: 6 }}>
              Sign in to access your project workspaces.
            </p>
          </div>

          {message ? (
            <div style={{ borderRadius: 8, padding: 12, border: "1px solid var(--stroke)", background: "var(--panel2)", color: "var(--fg)", fontSize: 13 }}>
              {message}
            </div>
          ) : null}

          {error ? (
            <div style={{ borderRadius: 8, padding: 12, border: "1px solid var(--accentStroke)", background: "var(--bg2)", color: "var(--accent)", fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          ) : null}

          <form action={signIn} style={{ display: "grid", gap: 12 }}>
            <input type="hidden" name="next" value={next || ""} />
            <input type="hidden" name="token" value={token || ""} />

            <div>
              <label className="fieldLabel">Email Address</label>
              <input
                className="input"
                name="email"
                type="email"
                defaultValue={prefillEmail}
                required
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="fieldLabel">Password</label>
              <input
                className="input"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button className="btn btnPrimary" type="submit" style={{ marginTop: 8, padding: "12px", fontSize: 15, width: "100%", justifyContent: "center" }}>
              Sign In →
            </button>
          </form>

          {/* RESTORED: Gatekeeper Logic for Signups */}
          <div style={{ borderTop: "1px solid var(--stroke)", paddingTop: 16, marginTop: 8, textAlign: "center", fontSize: 13 }}>
            {token ? (
              <span style={{ color: "var(--muted)" }}>
                First time client?{" "}
                <Link 
                  href={`/signup?token=${encodeURIComponent(token)}${prefillEmail ? `&email=${encodeURIComponent(prefillEmail)}` : ""}${next ? `&next=${encodeURIComponent(next)}` : ""}`}
                  style={{ color: "var(--fg)", fontWeight: 700, textDecoration: "none" }}
                >
                  Create your account
                </Link>
              </span>
            ) : (
              <span style={{ color: "var(--muted)", lineHeight: 1.5, display: "inline-block" }}>
                Clients should use the secure portal link from their quote or email to create an account.
              </span>
            )}
            
            <div style={{ marginTop: 12 }}>
              <Link href="/forgot-password" style={{ color: "var(--muted)", textDecoration: "none" }}>
                Forgot Password?
              </Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
