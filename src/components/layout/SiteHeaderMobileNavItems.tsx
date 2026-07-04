"use client";

import { usePathname, useRouter } from "next/navigation";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { LoggedInStatusBadge } from "@/components/auth/LoggedInStatusBadge";
import { OwlNavButton } from "@/components/ui/OwlNavButton";
import { useClientAuthNavState } from "@/hooks/useClientAuthNavState";
import {
  GUEST_CONTACT_FORM_LABEL,
  GUEST_CONTACT_FORM_PATH,
  MYPAGE_CONTACT_FORM_LABEL,
  MYPAGE_CONTACT_FORM_PATH,
} from "@/lib/legal/legalDocumentLinks";
import { buildDisplaySettingsHref } from "@/lib/navigation/displaySettingsNav";
import { LOG_HOUSE_LOADING_LABEL, LOG_HOUSE_NAV_LABEL } from "@/lib/journal/logHouseLabels";
import { FOREST_GUIDE_STATION_TITLE } from "@/lib/help/forestGuideStation";
import { scrollToGuestReadingFontSizeSection } from "@/lib/reading/guestReadingFontSizePages";

const mobileMenuItemClass =
  "block w-full rounded-lg px-3 py-3 text-left text-base font-medium text-stone-700 transition hover:bg-emerald-50/90 active:bg-emerald-50";

const mobileMenuButtonClass =
  "block w-full cursor-pointer rounded-lg border-0 bg-transparent px-3 py-3 text-left text-base font-medium text-stone-700 transition hover:bg-emerald-50/90 active:bg-emerald-50";

type Props = {
  onNavigate: () => void;
};

function navigateFromMobileMenu(href: string, router: ReturnType<typeof useRouter>) {
  const targetUrl = new URL(href, window.location.origin);
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;

  const samePath = targetUrl.pathname === currentPath;
  const sameSearch = targetUrl.search === currentSearch;
  const sameHash = targetUrl.hash === window.location.hash;

  if (samePath && sameSearch && sameHash) {
    return;
  }

  // /login 上で returnTo だけ変えるとき、Next Link は反応しないことがある
  if (samePath && targetUrl.pathname === "/login") {
    window.location.assign(href);
    return;
  }

  router.push(href);
}

function MobileMenuNavButton({
  href,
  children,
  router,
}: {
  href: string;
  children: React.ReactNode;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <button
      type="button"
      className={mobileMenuItemClass}
      onClick={() => navigateFromMobileMenu(href, router)}
    >
      {children}
    </button>
  );
}

/** スマホメニュー内のナビ項目（デスクトップと同内容） */
export function SiteHeaderMobileNavItems({ onNavigate }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOutUser } = useFirebaseAuth();
  const { showGuestNav, showAuthenticatedNav } = useClientAuthNavState();

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {showAuthenticatedNav ? (
        <div className="mb-1 border-b border-stone-200/80 px-3 pb-3 pt-1">
          <LoggedInStatusBadge className="text-sm sm:text-sm" />
        </div>
      ) : null}

      {showAuthenticatedNav ? (
        <OwlNavButton
          href="/orders"
          loadingLabel={LOG_HOUSE_LOADING_LABEL}
          className={mobileMenuButtonClass}
        >
          {LOG_HOUSE_NAV_LABEL}
        </OwlNavButton>
      ) : null}

      {showGuestNav ? (
        pathname === "/guide/first/welcome" || pathname.startsWith("/guide/first/") ? (
          <span className={`${mobileMenuItemClass} text-stone-400`} aria-current="page">
            はじめての方へ
          </span>
        ) : (
          <MobileMenuNavButton href="/guide/first/welcome" router={router}>
            はじめての方へ
          </MobileMenuNavButton>
        )
      ) : null}

      {pathname === "/about" ? (
        <span className={`${mobileMenuItemClass} text-stone-400`} aria-current="page">
          Life Journey Diaryとは
        </span>
      ) : (
        <MobileMenuNavButton href="/about" router={router}>
          Life Journey Diaryとは
        </MobileMenuNavButton>
      )}

      <MobileMenuNavButton href="/help/ljd" router={router}>
        {FOREST_GUIDE_STATION_TITLE}
      </MobileMenuNavButton>

      {showAuthenticatedNav ? (
        <MobileMenuNavButton href={MYPAGE_CONTACT_FORM_PATH} router={router}>
          {MYPAGE_CONTACT_FORM_LABEL}
        </MobileMenuNavButton>
      ) : null}

      {showGuestNav ? (
        pathname === "/contact" ? (
          <span className={`${mobileMenuItemClass} text-stone-400`} aria-current="page">
            {GUEST_CONTACT_FORM_LABEL}
          </span>
        ) : (
          <MobileMenuNavButton href={GUEST_CONTACT_FORM_PATH} router={router}>
            {GUEST_CONTACT_FORM_LABEL}
          </MobileMenuNavButton>
        )
      ) : null}

      {showAuthenticatedNav ? (
        <button
          type="button"
          className={mobileMenuItemClass}
          onClick={() => {
            onNavigate();
            navigateFromMobileMenu(buildDisplaySettingsHref(), router);
          }}
        >
          文字の大きさ
        </button>
      ) : null}

      {showGuestNav ? (
        <button
          type="button"
          className={mobileMenuItemClass}
          onClick={() => {
            onNavigate();
            scrollToGuestReadingFontSizeSection(pathname);
          }}
        >
          文字の大きさ
        </button>
      ) : null}

      {showAuthenticatedNav ? (
        <button
          type="button"
          className={mobileMenuButtonClass}
          onClick={() => {
            onNavigate();
            void (async () => {
              await signOutUser();
              router.push("/");
              router.refresh();
            })();
          }}
        >
          ログアウト
        </button>
      ) : null}

      {showGuestNav ? (
        pathname === "/login" ? (
          <span className={`${mobileMenuItemClass} text-stone-400`} aria-current="page">
            ログイン
          </span>
        ) : (
          <MobileMenuNavButton href="/login?returnTo=%2Forders" router={router}>
            ログイン
          </MobileMenuNavButton>
        )
      ) : null}
    </div>
  );
}
