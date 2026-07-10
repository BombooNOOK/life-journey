"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { SiteHeaderMobileNavItems } from "@/components/layout/SiteHeaderMobileNavItems";
import {
  LOG_HOUSE_FOREST_MAP_HREF,
  LOG_HOUSE_FOREST_MAP_LABEL,
  LOG_HOUSE_SETTINGS_BUTTON_LABEL,
} from "@/lib/loghouse/logHouseRoomCopy";

type Props = {
  onOpenSettings: () => void;
};

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

function GearIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10c0 .7.4 1.3 1 1.5H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 4.5 3.75 6.75v12.75L9 17.25m0-12.75 6 3m-6-3v12.75m6-9.75 5.25-2.25v12.75L15 20.25m0-12.75v12.75"
      />
    </svg>
  );
}

const chromeButtonClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200/90 bg-white/90 text-stone-700 shadow-sm backdrop-blur-[1px] transition hover:bg-white active:scale-[0.98]";

/** 没入ログハウス：移動メニュー・設定・案内図 */
export function LogHouseRoomChrome({ onOpenSettings }: Props) {
  const menuId = useId();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const mobileMenu =
    menuOpen && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[200] bg-stone-900/25"
              aria-label="メニューを閉じる"
              onClick={closeMenu}
            />
            <nav
              id={menuId}
              className="fixed inset-x-4 top-[max(4.5rem,env(safe-area-inset-top))] z-[210] overflow-hidden rounded-2xl border border-stone-200/90 bg-[#fffdf9] shadow-lg"
              aria-label="移動メニュー"
            >
              <SiteHeaderMobileNavItems onNavigate={closeMenu} />
            </nav>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto">
          <button
            type="button"
            className={chromeButtonClass}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href={LOG_HOUSE_FOREST_MAP_HREF}
            className={chromeButtonClass}
            aria-label={LOG_HOUSE_FOREST_MAP_LABEL}
            title={LOG_HOUSE_FOREST_MAP_LABEL}
          >
            <MapIcon />
          </Link>
          <button
            type="button"
            className={chromeButtonClass}
            aria-label={`${LOG_HOUSE_SETTINGS_BUTTON_LABEL}を開く`}
            title={LOG_HOUSE_SETTINGS_BUTTON_LABEL}
            onClick={onOpenSettings}
          >
            <GearIcon />
          </button>
        </div>
      </div>
      {mobileMenu}
    </>
  );
}
