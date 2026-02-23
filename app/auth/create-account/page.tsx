// app/auth/create-account/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  getSiteUrl,
  safeNextPath,
} from "@/lib/supabase/server";

type SearchParams = {
  token?: string;
  error?: string;
  message?: string;
  email?: string;
};

export default async function CreateAccountPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (await Promise.resolve(searchParams || {})) as SearchParams;

  const token = sp.token || "";
  const error = sp.error || "";
  const message = sp.message || "";
  const prefillEmail = sp.email || "";

  async function createAccount(formData: FormData) {
    "use server";

    const token = String(formData.get("token") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!token) {
      redirect(
        `/auth/create-account?error=${encodeURIComponent(
          "Missing portal token."
        )}`
      );
    }

    if (!email || !password) {
      redirect(
        `/auth/create-account?token=${encodeURIComponent(
          token
        )}&error=${encodeURIComponent(
          "Email and password are required."
        )}&email=${encodeURIComponent(email)}`
      );
    }

    if (password.length < 6) {
      redirect(
        `/auth/create-account?token=${encodeURIComponent(
          token
        )}&error=${encodeURIComponent(
          "Password must be at least 6 characters."
        )}&email=${encodeURIComponent(email)}`
      );
    }

    const supabase = await createSupabaseServerClient();

    // Verify token belongs to a project and email matches that project lead
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, quote_id, lead_email, portal_token")
      .eq("portal_token", token)
      .single();

    if (projectError || !project) {
      redirect(
        `/auth/create-account?token=${encodeURIComponent(
          token
        )}&error=${encodeURIComponent("Invalid or expired portal link.")}`
      );
    }

    const projectLeadEmail = String(project.lead_email || "").toLowerCase();

    if (!projectLeadEmail || projectLeadEmail !== email) {
      redirect(
        `/auth/create-account?token=${encodeURIComponent(
          token
        )}&error=${encodeURIComponent(
          `This portal is linked to ${projectLeadEmail || "another email"}. Use that email to create the account.`
        )}&email=${encodeURIComponent(email)}`
      );
    }

    const nextPath = `/portal/${token}`;
    const emailRedirectTo = `${getSiteUrl()}auth/callback?next=${encodeURIComponent(
      nextPath
    )}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      redirect(
        `/auth/create-account?token=${encodeURIComponent(
          token
        )}&error=${encodeURIComponent(error.message)}&email=${encodeURIComponent(
          email
        )}`
      );
    }

    // Best effort: mark client status as invited/account_created if your schema allows it
    // We keep it generic/safe and ignore failures.
    try {
      await supabase
        .from("projects")
        .update({ client_status: "account_created" })
        .eq("id", project.id);
    } catch {
      // ignore
    }

    // If email confirmation is OFF, Supabase may return a session immediately
    if (data.session) {
      redirect(nextPath);
    }

    redirect(
      `/auth/login?message=${encodeURIComponent(
        "Account created. Check your email to confirm, then sign in."
      )}&next=${encodeURIComponent(nextPath)}&token=${encodeURIComponent(
        token
      )}&email=${encodeURIComponent(email)}`
    );
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
          maxWidth: 560,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          padding: 20,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
          Create client account
        </h1>
        <p style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.5 }}>
          This is for clients after the quote/call stage so they can access their
          portal, upload assets, and track project progress.
        </p>

        {!token ? (
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
            Missing portal token. Use the client portal link from the quote/call email.
          </div>
        ) : null}

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
              whiteSpace: "pre-wrap",
            }}
          >
            {error}
          </div>
        ) : null}

        <form
          action={createAccount}
          style={{ marginTop: 14, display: "grid", gap: 12 }}
        >
          <input type="hidden" name="token" value={token} />

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
              Email (must match quote email)
            </label>
            <input
              name="email"
              type="email"
              defaultValue={prefillEmail}
              required
              placeholder="client@example.com"
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
              minLength={6}
              placeholder="At least 6 characters"
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
            disabled={!token}
            style={{
              marginTop: 4,
              padding: "12px 14px",
              borderRadius: 10,
              border: "none",
              background: token ? "#ff7a18" : "#666",
              color: "#111",
              fontWeight: 800,
              cursor: token ? "pointer" : "not-allowed",
            }}
          >
            Create account
          </button>
        </form>

        <div style={{ marginTop: 14, fontSize: 14 }}>
          <Link
            href={`/auth/login${
              token ? `?token=${encodeURIComponent(token)}` : ""
            }${prefillEmail ? `${token ? "&" : "?"}email=${encodeURIComponent(prefillEmail)}` : ""}`}
            style={{ color: "#ffb26b" }}
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}