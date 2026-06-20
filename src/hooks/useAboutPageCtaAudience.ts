"use client";

import { useEffect, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";

type AboutCtaAudienceState = {
  ready: boolean;
  showReturningUserCtas: boolean;
};

const INITIAL: AboutCtaAudienceState = {
  ready: false,
  showReturningUserCtas: false,
};

/** /about のCTA出し分け（プロフィールまたは鑑定Orderがある既存ユーザー） */
export function useAboutPageCtaAudience(): AboutCtaAudienceState {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [state, setState] = useState<AboutCtaAudienceState>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    const isLoggedIn = Boolean(user) || isLjLoggedInOnClient();

    if (authLoading && !isLoggedIn) {
      return;
    }

    if (!isLoggedIn) {
      setState({ ready: true, showReturningUserCtas: false });
      return;
    }

    setState(INITIAL);
    void fetch("/api/viewer/about-cta-context", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (res) => {
        const data = (await res.json()) as { showReturningUserCtas?: boolean };
        if (cancelled) return;
        setState({
          ready: true,
          showReturningUserCtas: Boolean(data.showReturningUserCtas),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ ready: true, showReturningUserCtas: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  return state;
}
