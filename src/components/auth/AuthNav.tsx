"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { useClientAuthNavState } from "@/hooks/useClientAuthNavState";

function AuthSeparator() {
  return (
    <span className="mx-1 shrink-0 select-none px-0.5 text-stone-300 sm:mx-1.5" aria-hidden>
      |
    </span>
  );
}

const authActionClass =
  "inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap text-inherit text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline";

export function AuthNav() {
  const router = useRouter();
  const { signOutUser } = useFirebaseAuth();
  const { showGuestNav, showAuthenticatedNav } = useClientAuthNavState();

  if (showAuthenticatedNav) {
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

  if (showGuestNav) {
    return (
      <>
        <AuthSeparator />
        <Link href="/login?returnTo=%2Forders" className={authActionClass}>
          ログイン
        </Link>
      </>
    );
  }

  return null;
}
