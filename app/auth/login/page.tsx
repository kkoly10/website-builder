// app/auth/login/page.tsx
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      redirect(
        `/auth/login?error=${encodeURIComponent(
          error?.message || "Invalid login credentials."
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
    if (nextPath && nextPath.startsWith("/portal/")) {
      redirect(nextPath);
    }

    if (tokenRaw) {
      redirect(`/portal/${tokenRaw}`);
    }

    // Fallback if customer logs in without a portal link
    redirect("/");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
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
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Sign in</h1>
        <p style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.5 }}>
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

        <form action={signIn} style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <input type="hidden" name="next" value={next || ""} />
          <input type="hidden" name="token" value={token || ""} />

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
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
            <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
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
              background: "#ff7a18",
              color: "#111",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
        </form>

        <div style={{ marginTop: 14, fontSize: 14, opacity: 0.9 }}>
          {token ? (
            <p style={{ margin: 0 }}>
              First time client?{" "}
              <Link
                href={`/auth/create-account?token=${encodeURIComponent(token)}${
                  prefillEmail ? `&email=${encodeURIComponent(prefillEmail)}` : ""
                }`}
                style={{ color: "#ffb26b" }}
              >
                Create your account
              </Link>
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Clients should use the portal link from their quote/call email to create
              an account.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}