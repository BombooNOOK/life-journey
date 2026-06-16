"use client";

import Link from "next/link";

import { AuthNav } from "@/components/auth/AuthNav";
import { LoggedInStatusBadge } from "@/components/auth/LoggedInStatusBadge";
import { OwlNavButton } from "@/components/ui/OwlNavButton";
import { useClientAuthNavState } from "@/hooks/useClientAuthNavState";
import {
  MYPAGE_CONTACT_FORM_LABEL,
  MYPAGE_CONTACT_FORM_LOGIN_PATH,
  MYPAGE_CONTACT_FORM_PATH,
} from "@/lib/legal/legalDocumentLinks";

const navLinkClass = "shrink-0 whitespace-nowrap hover:text-stone-900";
const navNavButtonClass = `${navLinkClass} cursor-pointer border-0 bg-transparent p-0 text-inherit font-inherit`;
const navSepClass = "mx-1 shrink-0 select-none px-0.5 text-stone-300 sm:mx-1.5";

export function SiteHeader() {
  const { isLoggedIn, showGuestNav, showAuthenticatedNav } = useClientAuthNavState();

  return (
    <header className="overflow-visible border-b border-stone-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-3xl space-y-1 overflow-visible px-4 py-3 sm:space-y-1.5 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className={`shrink-0 font-semibold text-stone-800 no-underline hover:text-stone-900 ${
              isLoggedIn
                ? "basis-auto text-base sm:text-lg"
                : "basis-full text-base sm:basis-auto sm:text-lg"
            }`}
          >
            Life Journey Diary
          </a>
          <nav
            className={`flex min-w-0 flex-wrap items-center justify-end gap-x-1.5 gap-y-1 overflow-visible text-sm text-stone-600 sm:gap-x-2 sm:text-base ${
              isLoggedIn ? "basis-auto flex-1" : "basis-full sm:basis-auto sm:flex-1"
            }`}
            aria-label="メインメニュー"
          >
            {showGuestNav ? (
              <>
                <Link href="/order" className={navLinkClass}>
                  はじめての方へ
                </Link>
                <span className={navSepClass} aria-hidden>
                  |
                </span>
              </>
            ) : null}
            {showAuthenticatedNav ? (
              <>
                <OwlNavButton
                  href="/orders"
                  loadingLabel="マイページを開いています…"
                  className={navNavButtonClass}
                >
                  マイページ
                </OwlNavButton>
                <span className={navSepClass} aria-hidden>
                  |
                </span>
              </>
            ) : null}
            <Link href="/guide" className={navLinkClass}>
              使い方
            </Link>
            <span className={navSepClass} aria-hidden>
              |
            </span>
            <Link
              href={isLoggedIn ? MYPAGE_CONTACT_FORM_PATH : MYPAGE_CONTACT_FORM_LOGIN_PATH}
              className={navLinkClass}
            >
              {MYPAGE_CONTACT_FORM_LABEL}
            </Link>
            <div
              className={`flex shrink-0 items-center justify-end overflow-visible sm:w-auto sm:basis-auto ${
                isLoggedIn ? "w-auto basis-auto" : "w-full basis-full max-sm:pt-0.5"
              }`}
            >
              <AuthNav />
            </div>
          </nav>
        </div>
        {showAuthenticatedNav ? (
          <div className="flex justify-end">
            <LoggedInStatusBadge />
          </div>
        ) : null}
      </div>
    </header>
  );
}
