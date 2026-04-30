import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  isAdminEmail,
  safeNextPath,
} from "@/lib/supabase/server";

type SearchParams = {
  error?: string;
  message?: string;
  next?: string;
  token?: string;
  email?: string;
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (await Promise.resolve(searchParams || {})) as SearchParams;

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

    // FIXED: Properly aliased 'error' to 'authError'
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

    // Customer flow: Fixed trailing slash bug. Now accepts "/portal" and "/portal/xyz"
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
    <div
      className="authPage" style={{
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "#0b0b0c",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          padding: 20,
        }}
      >
        <h1 className="h2">Sign in</h1>
        <p className="pDark">
          Admins and clients use the same login page. Admins are redirected to the
          internal dashboard. Clients are redirected to their project portal.
        </p>

        {message ? (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(0, 180, 120, 0.12)",
              border: "1px solid rgba(0, 180, 120, 0.35)",
              fontSize: 14,
            }}
          >
            {message}
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255, 80, 80, 0.12)",
              border: "1px solid rgba(255, 80, 80, 0.35)",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : null}

        <form action={signIn} >
          <input type="hidden" name="next" value={next || ""} />
          <input type="hidden" name="token" value={token || ""} />

          <div>
            <label className="fieldLabel">
              Email
            </label>
            <input
              name="email"
              type="email"
              defaultValue={prefillEmail}
              required
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
              }}
            />
          </div>

          <div>
            <label className="fieldLabel">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: 4,
              padding: "12px 14px",
              borderRadius: 10,
              border: "none",
              background: "var(--accent)",
              color: "var(--paper)",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
        </form>

        <div className="pDark">
          {token ? (
            <p >
              First time client?{" "}
              <Link
                href={`/auth/create-account?token=${encodeURIComponent(token)}${
                  prefillEmail ? `&email=${encodeURIComponent(prefillEmail)}` : ""
                }`}
              >
                Create your account
              </Link>
            </p>
          ) : (
            <p >
              Clients should use the portal link from their quote/call email to create
              an account.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
