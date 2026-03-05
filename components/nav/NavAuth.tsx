"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NavAuthProps = {
  customBuildHref: string;
};

export default function NavAuth({ customBuildHref }: NavAuthProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;

        const email = data?.user?.email ?? null;
        setUserEmail(email);

        if (email) {
          // Check admin status via lightweight API call
          const res = await fetch("/api/auth/me");
          if (!cancelled && res.ok) {
            const json = await res.json();
            setAdmin(!!json.admin);
          }
        }
      } catch {
        // Auth check failed — stay logged out
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Before auth loads, show the default CTA (same as logged-out state)
  if (!loaded) {
    return (
      <>
        <Link href={customBuildHref} className="btn btnPrimary">
          Get Quote <span className="btnArrow">&rarr;</span>
        </Link>
      </>
    );
  }

  if (userEmail) {
    return (
      <>
        {admin ? <Link href="/internal/admin">Admin Dashboard</Link> : null}
        <form action="/auth/signout" method="post" className="navForm">
          <button type="submit" className="btn btnGhost">
            Sign out
          </button>
        </form>
      </>
    );
  }

  return (
    <Link href={customBuildHref} className="btn btnPrimary">
      Get Quote <span className="btnArrow">&rarr;</span>
    </Link>
  );
}

export function NavAuthMobile({ customBuildHref }: NavAuthProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;

        const email = data?.user?.email ?? null;
        setUserEmail(email);

        if (email) {
          const res = await fetch("/api/auth/me");
          if (!cancelled && res.ok) {
            const json = await res.json();
            setAdmin(!!json.admin);
          }
        }
      } catch {
        // Auth check failed
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) {
    return (
      <Link href="/login" className="mobileMenuMutedLink">
        Log in
      </Link>
    );
  }

  if (userEmail) {
    return (
      <>
        {admin ? <Link href="/internal/admin">Admin Dashboard</Link> : null}
        <form action="/auth/signout" method="post" className="mobileMenuForm">
          <button type="submit" className="btn btnGhost mobileMenuSignout">
            Sign out
          </button>
        </form>
      </>
    );
  }

  return (
    <Link href="/login" className="mobileMenuMutedLink">
      Log in
    </Link>
  );
}
