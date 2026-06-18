"use client";

import Link from "next/link";

import { buildLoginHref } from "@/app/login/loginFlow";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import {
  heroCtaContinueClass,
  heroCtaContinueLeadClass,
  heroCtaContinueSubClass,
} from "@/components/home/heroCtaStyles";
import { OwlNavButton } from "@/components/ui/OwlNavButton";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";

const MY_PAGE_HREF = "/orders";
const LOGIN_HREF = buildLoginHref(MY_PAGE_HREF);

const entranceContinueButtonClass = [
  "flex min-h-[4.75rem] w-full max-w-[min(16rem,78vw)] flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-900/60 bg-emerald-800 px-3 py-4 text-center shadow-[0_4px_14px_rgba(6,78,59,0.32)] transition hover:border-emerald-950/75 hover:bg-emerald-900 hover:shadow-[0_5px_18px_rgba(6,78,59,0.38)] active:scale-[0.98] active:opacity-95 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-400 disabled:text-white/85 disabled:shadow-none sm:min-h-[5rem] sm:max-w-[17rem]",
].join(" ");

/** 1行目：小さく */
const entranceContinueLeadClass =
  "whitespace-nowrap text-[0.625rem] font-medium leading-none text-white/85 sm:text-xs";

/** 2行目：大きく（html の読み物サイズに連動） */
const entranceContinueSubClass =
  "whitespace-nowrap text-[clamp(1.125rem,1rem+1.5vw,1.375rem)] font-bold leading-tight text-white sm:text-xl";

type Props = {
  className?: string;
  variant?: "default" | "entrance";
};

/** トップヒーロー：継続導線（マイページ／ログイン） */
export function HomeHeroSubNavLink({ className = "", variant = "default" }: Props) {
  const { user } = useFirebaseAuth();
  const isLoggedIn = Boolean(user) || isLjLoggedInOnClient();

  if (variant === "entrance") {
    const entranceClass = [entranceContinueButtonClass, className].filter(Boolean).join(" ");
    const subLabel = isLoggedIn ? "マイページへ" : "ログイン";

    if (isLoggedIn) {
      return (
        <OwlNavButton
          href={MY_PAGE_HREF}
          loadingLabel="マイページを開いています…"
          className={entranceClass}
        >
          <span className={entranceContinueLeadClass}>記録の続きはこちら</span>
          <span className={entranceContinueSubClass}>{subLabel}</span>
        </OwlNavButton>
      );
    }

    return (
      <Link href={LOGIN_HREF} className={entranceClass}>
        <span className={entranceContinueLeadClass}>記録の続きはこちら</span>
        <span className={entranceContinueSubClass}>{subLabel}</span>
      </Link>
    );
  }

  const continueClass = [heroCtaContinueClass, className].filter(Boolean).join(" ");

  if (isLoggedIn) {
    return (
      <OwlNavButton
        href={MY_PAGE_HREF}
        loadingLabel="マイページを開いています…"
        className={continueClass}
      >
        <span className={heroCtaContinueLeadClass}>記録の続きはこちら</span>
        <span className={heroCtaContinueSubClass}>マイページへ</span>
      </OwlNavButton>
    );
  }

  return (
    <Link href={LOGIN_HREF} className={continueClass}>
      <span className={heroCtaContinueLeadClass}>記録の続きはこちら</span>
      <span className={heroCtaContinueSubClass}>ログイン</span>
    </Link>
  );
}
