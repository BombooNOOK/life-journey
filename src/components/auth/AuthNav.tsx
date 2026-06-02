"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";

function AuthSeparator() {
  return (
    <span className="mx-1 shrink-0 select-none px-0.5 text-stone-300 sm:mx-1.5" aria-hidden>
      |
    </span>
  );
}

const authActionClass =
  "shrink-0 whitespace-nowrap text-xs text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline sm:text-sm";

export function AuthNav() {
  const router = useRouter();
  const { user, loading, signOutUser } = useFirebaseAuth();
  const cookieLoggedIn = isLjLoggedInOnClient();

  const showLogout = Boolean(user) || (loading && cookieLoggedIn);
  const showLogin = !showLogout && (!loading || !cookieLoggedIn);

  if (showLogout) {
    return (
      <>
        <AuthSeparator />
        <button
          type="button"
          className={`${authActionClass} cursor-pointer border-0 bg-transparent p-0`}
          onClick={() => {
            void (async () => {
              await signOutUser();
              router.push("/");
              router.refresh();
            })();
          }}
        >
          ログアウト
        </button>
      </>
    );
  }

  if (showLogin) {
    return (
      <>
        <AuthSeparator />
        <Link href="/login" className={authActionClass}>
          ログイン
        </Link>
      </>
    );
  }

  return null;
}
