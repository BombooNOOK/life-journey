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
import { LOG_HOUSE_LOADING_LABEL, LOG_HOUSE_NAV_LABEL } from "@/lib/journal/logHouseLabels";
import { FOREST_GUIDE_STATION_TITLE } from "@/lib/help/forestGuideStation";
import { LJD_PAPER_HEADER_BAR_CLASS } from "@/lib/ljd/ljdPaperSurface";

const navLinkClass = "shrink-0 whitespace-nowrap hover:text-stone-900";
const navNavButtonClass = `${navLinkClass} cursor-pointer border-0 bg-transparent p-0 text-inherit font-inherit`;
const navSepClass = "mx-1 shrink-0 select-none px-0.5 text-stone-300 sm:mx-1.5";

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  }

  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" d="M5 7.5h14M5 12h14M5 16.5h14" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <Suspense
      fallback={
        <header className={`sticky top-0 z-50 ${LJD_PAPER_HEADER_BAR_CLASS}`}>
          <div className="mx-auto max-w-3xl px-4 py-3 sm:py-4">
            <span className="font-semibold text-[#3f3428] text-base sm:text-lg">Life Journey Diary</span>
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
      className={`sticky top-0 z-50 overflow-visible ${LJD_PAPER_HEADER_BAR_CLASS}`}
    >
      <div className="mx-auto max-w-3xl overflow-visible px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="min-w-0 shrink font-semibold text-[#3f3428] no-underline hover:text-[#2c241c] text-base sm:text-lg"
          >
            Life Journey Diary
          </a>

          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e0d2bc]/95 bg-[#f6eee2] text-[#6a5846] shadow-[0_1px_3px_rgba(90,70,45,0.08)] transition hover:border-[#d5c3a8] hover:bg-[#f3ead8] hover:text-[#4a3a28] md:hidden"
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
                <Link href="/guide/first/path-guide" className={navLinkClass}>
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
                  loadingLabel={LOG_HOUSE_LOADING_LABEL}
                  className={navNavButtonClass}
                >
                  {LOG_HOUSE_NAV_LABEL}
                </OwlNavButton>
                <span className={navSepClass} aria-hidden>
                  |
                </span>
              </>
            ) : null}
            <Link href="/help/ljd" className={navLinkClass}>
              {FOREST_GUIDE_STATION_TITLE}
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
