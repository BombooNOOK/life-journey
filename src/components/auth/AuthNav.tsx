"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";

/** sm 以上でメインリンクと同じ行に並べるときだけ区切りを表示 */
function AuthSeparator() {
  return (
    <span className="hidden shrink-0 select-none text-stone-300 sm:inline" aria-hidden>
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
