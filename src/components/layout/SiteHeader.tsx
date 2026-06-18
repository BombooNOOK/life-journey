"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { AuthNav } from "@/components/auth/AuthNav";
import { LoggedInStatusBadge } from "@/components/auth/LoggedInStatusBadge";
import { SiteHeaderMobileNavItems } from "@/components/layout/SiteHeaderMobileNavItems";
import { OwlNavButton } from "@/components/ui/OwlNavButton";
import { useClientAuthNavState } from "@/hooks/useClientAuthNavState";
import {
  GUEST_CONTACT_FORM_LABEL,
  GUEST_CONTACT_FORM_PATH,
  MYPAGE_CONTACT_FORM_LABEL,
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
  return (
    <Suspense
      fallback={
        <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-3xl px-4 py-3 sm:py-4">
            <span className="font-semibold text-stone-800 text-base sm:text-lg">Life Journey Diary</span>
          </div>
        </header>
      }
    >
      <SiteHeaderInner />
    </Suspense>
  );
}

function SiteHeaderInner() {
  const menuId = useId();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(56);
  const [mounted, setMounted] = useState(false);
  const { showGuestNav, showAuthenticatedNav } = useClientAuthNavState();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, searchParams]);

  useLayoutEffect(() => {
    if (!menuOpen || !headerRef.current) return;

    const updateTop = () => {
      const rect = headerRef.current?.getBoundingClientRect();
      if (rect) setMenuTop(rect.bottom + 4);
    };

    updateTop();
    window.addEventListener("resize", updateTop);
    return () => window.removeEventListener("resize", updateTop);
  }, [menuOpen, showAuthenticatedNav]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const mobileMenu =
    menuOpen && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[200] bg-stone-900/20 md:hidden"
              aria-label="メニューを閉じる"
              onClick={closeMenu}
            />
            <nav
              id={menuId}
              style={{ top: menuTop }}
              className="fixed inset-x-4 z-[210] overflow-hidden rounded-2xl border border-stone-200/90 bg-[#fffdf9] shadow-lg md:hidden"
              aria-label="メインメニュー"
            >
              <SiteHeaderMobileNavItems onNavigate={closeMenu} />
            </nav>
          </>,
          document.body,
        )
      : null;

  return (
    <header
      ref={headerRef}
      className="relative z-50 overflow-visible border-b border-stone-200 bg-white/80 backdrop-blur"
    >
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
            {showAuthenticatedNav ? (
              <>
                <span className={navSepClass} aria-hidden>
                  |
                </span>
                <Link href={MYPAGE_CONTACT_FORM_PATH} className={navLinkClass}>
                  {MYPAGE_CONTACT_FORM_LABEL}
                </Link>
              </>
            ) : null}
            {showGuestNav ? (
              <>
                <span className={navSepClass} aria-hidden>
                  |
                </span>
                <Link href={GUEST_CONTACT_FORM_PATH} className={navLinkClass}>
                  {GUEST_CONTACT_FORM_LABEL}
                </Link>
              </>
            ) : null}
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

      {mobileMenu}
    </header>
  );
}
