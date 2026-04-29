"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";

export function AuthNav() {
  const router = useRouter();
  const { user, loading, signOutUser } = useFirebaseAuth();

  if (loading) {
    return (
      <span className="inline-block w-24 align-middle text-stone-400">…</span>
    );
  }

  if (!user) {
    return (
      <>
        <span className="mx-2 text-stone-300">|</span>
        <Link href="/login" className="hover:text-stone-900">
          ログイン
        </Link>
      </>
    );
  }

  return (
    <>
      <span className="mx-2 text-stone-300">|</span>
      <span
        className="inline-block max-w-[7rem] truncate align-middle text-stone-500 sm:max-w-[10rem]"
        title={user.email ?? undefined}
      >
        {user.email ?? user.uid.slice(0, 8)}
      </span>
      <span className="mx-2 text-stone-300">|</span>
      <button
        type="button"
        className="cursor-pointer border-0 bg-transparent p-0 text-sm text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
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
