"use client";

import { useEffect, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { readServerAuthSessionEmail, syncServerAuthSession } from "@/lib/auth/syncServerSession";

type State = {
  ready: boolean;
  firebaseEmail: string | null;
  serverEmail: string | null;
  mismatch: boolean;
};

const INITIAL: State = {
  ready: false,
  firebaseEmail: null,
  serverEmail: null,
  mismatch: false,
};

/**
 * 日記 API は Cookie のメールでユーザーを特定する。
 * Firebase だけログイン済みでサーバー Cookie が古い端末があるため、取得前に同期する。
 */
export function useEnsureServerAuthSession(): State {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [state, setState] = useState<State>(INITIAL);

  useEffect(() => {
    if (authLoading) {
      setState(INITIAL);
      return;
    }

    const firebaseEmail = user?.email?.trim().toLowerCase() ?? "";
    if (!firebaseEmail) {
      setState({
        ready: true,
        firebaseEmail: null,
        serverEmail: null,
        mismatch: false,
      });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, ready: false, firebaseEmail }));

    void (async () => {
      await syncServerAuthSession(firebaseEmail);
      const serverEmail = await readServerAuthSessionEmail();
      if (cancelled) return;
      setState({
        ready: true,
        firebaseEmail,
        serverEmail,
        mismatch: Boolean(serverEmail && serverEmail !== firebaseEmail),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.email]);

  return state;
}
