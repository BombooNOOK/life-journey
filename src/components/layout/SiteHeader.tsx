"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { AuthNav } from "@/components/auth/AuthNav";
import { LoggedInStatusBadge } from "@/components/auth/LoggedInStatusBadge";
import { SiteHeaderMobileNavItems } from "@/components/layout/SiteHeaderMobileNavItems";
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

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  }

  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function SiteHeader() {
  const menuId = useId();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, showGuestNav, showAuthenticatedNav } = useClientAuthNavState();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="relative overflow-visible border-b border-stone-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-3xl overflow-visible px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="min-w-0 shrink font-semibold text-stone-800 no-underline hover:text-stone-900 text-base sm:text-lg"
          >
            Life Journey Diary
          </a>

          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-200/90 bg-[#fffdf9] text-stone-700 shadow-sm transition hover:border-emerald-200 hover:bg-white hover:text-emerald-900 md:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon open={menuOpen} />
          </button>

          <nav
            className="lj-site-nav hidden min-w-0 flex-wrap items-center justify-end gap-x-1.5 gap-y-1 overflow-visible text-stone-600 md:flex md:flex-1 md:gap-x-2"
            aria-label="メインメニュー"
          >
            {showGuestNav ? (
              <>
                <Link href="/about" className={navLinkClass}>
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
            <div className="flex shrink-0 items-center justify-end overflow-visible">
              <AuthNav />
            </div>
          </nav>
        </div>

        {showAuthenticatedNav ? (
          <div className="mt-1.5 hidden justify-end md:flex">
            <LoggedInStatusBadge />
          </div>
        ) : null}
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-stone-900/20 md:hidden"
            aria-label="メニューを閉じる"
            onClick={closeMenu}
          />
          <nav
            id={menuId}
            className="absolute inset-x-4 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-stone-200/90 bg-[#fffdf9] shadow-lg md:hidden"
            aria-label="メインメニュー"
          >
            <SiteHeaderMobileNavItems onNavigate={closeMenu} />
          </nav>
        </>
      ) : null}
    </header>
  );
}
