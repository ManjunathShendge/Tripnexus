"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/client";

function getInitial(user: User) {
  const email = user.email ?? "";
  return email.length > 0 ? email[0].toUpperCase() : "U";
}

export function UserNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(data.user ?? null);
      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Sign In
      </Link>
    );
  }

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer">
        <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-white px-2 py-1.5 shadow-sm hover:bg-orange-50">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {getInitial(user)}
          </span>
          <span className="hidden max-w-32 truncate text-xs font-medium text-slate-700 sm:inline">
            {user.email}
          </span>
        </div>
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
        <Link
          href="/account/profile"
          className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Profile
        </Link>
        <Link
          href="/account/orders"
          className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          My Orders
        </Link>
        <Link
          href="/cart"
          className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Cart
        </Link>
        <Link
          href="/stays"
          className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Stay Booking
        </Link>
        <Link
          href="/account/become-vendor"
          className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Add Business
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 w-full rounded-xl bg-rose-50 px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-100"
        >
          Sign Out
        </button>
      </div>
    </details>
  );
}
