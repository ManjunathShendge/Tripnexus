"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/client";

type AuthRequiredSubmitProps = {
  formId: string;
  className?: string;
  loginNextPath?: string;
  children: ReactNode;
};

export function AuthRequiredSubmit({
  formId,
  className,
  loginNextPath = "/",
  children,
}: AuthRequiredSubmitProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    setLoading(false);

    if (data.user) {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      form?.requestSubmit();
      return;
    }

    setOpen(true);
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick} disabled={loading}>
        {loading ? "Checking..." : children}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Sign in required</h3>
            <p className="mt-2 text-sm text-slate-600">
              Please sign in or create an account to continue this action.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/auth/login?next=${encodeURIComponent(loginNextPath)}`}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Sign In
              </Link>
              <Link
                href={`/auth/signup?next=${encodeURIComponent(loginNextPath)}`}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sign Up
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
