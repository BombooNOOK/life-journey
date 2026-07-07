"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { OwlDelayedBusyOverlay } from "@/components/ui/OwlDelayedBusyOverlay";
import { FIRST_VISIT_NAVIGATING_LABEL } from "@/lib/onboarding/firstVisitWizard/loadingCopy";

type TransitionNavigationContextValue = {
  isPending: boolean;
  replace: (href: string) => void;
  push: (href: string) => void;
};

const TransitionNavigationContext = createContext<TransitionNavigationContextValue | null>(null);

type ProviderProps = {
  children: ReactNode;
  /** 未指定=初回導線の文言、null=フクロウのみ */
  message?: string | null;
};

export function TransitionNavigationProvider({
  children,
  message = FIRST_VISIT_NAVIGATING_LABEL,
}: ProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const replace = useCallback(
    (href: string) => {
      startTransition(() => {
        router.replace(href);
      });
    },
    [router],
  );

  const push = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router],
  );

  const value = useMemo(
    () => ({
      isPending,
      replace,
      push,
    }),
    [isPending, replace, push],
  );

  return (
    <TransitionNavigationContext.Provider value={value}>
      {children}
      <OwlDelayedBusyOverlay busy={isPending} message={message ?? undefined} />
    </TransitionNavigationContext.Provider>
  );
}

/** Provider 内では共有の isPending。外ではローカル遷移＋オーバーレイなし。 */
export function useTransitionNavigation(): TransitionNavigationContextValue {
  const context = useContext(TransitionNavigationContext);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const replace = useCallback(
    (href: string) => {
      startTransition(() => {
        router.replace(href);
      });
    },
    [router, startTransition],
  );

  const push = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router, startTransition],
  );

  if (context) {
    return context;
  }

  return { isPending, replace, push };
}
