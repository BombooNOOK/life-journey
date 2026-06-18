"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { LoggedInStatusBadge } from "@/components/auth/LoggedInStatusBadge";
import { OwlNavButton } from "@/components/ui/OwlNavButton";
import { useClientAuthNavState } from "@/hooks/useClientAuthNavState";
import {
  MYPAGE_CONTACT_FORM_LABEL,
  MYPAGE_CONTACT_FORM_LOGIN_PATH,
  MYPAGE_CONTACT_FORM_PATH,
} from "@/lib/legal/legalDocumentLinks";

const mobileMenuItemClass =
  "block w-full rounded-lg px-3 py-3 text-left text-base font-medium text-stone-700 transition hover:bg-emerald-50/90 active:bg-emerald-50";

const mobileMenuButtonClass =
  "block w-full cursor-pointer rounded-lg border-0 bg-transparent px-3 py-3 text-left text-base font-medium text-stone-700 transition hover:bg-emerald-50/90 active:bg-emerald-50";

type Props = {
  onNavigate: () => void;
};

/** スマホメニュー内のナビ項目（デスクトップと同内容） */
export function SiteHeaderMobileNavItems({ onNavigate }: Props) {
  const router = useRouter();
  const { signOutUser } = useFirebaseAuth();
  const { isLoggedIn, showGuestNav, showAuthenticatedNav } = useClientAuthNavState();

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
          loadingLabel="マイページを開いています…"
          className={mobileMenuButtonClass}
        >
          マイページ
        </OwlNavButton>
      ) : null}

      <Link href="/about" className={mobileMenuItemClass}>
        Life Journey Diaryとは
      </Link>

      <Link href="/guide" className={mobileMenuItemClass}>
        使い方
      </Link>

      <Link
        href={isLoggedIn ? MYPAGE_CONTACT_FORM_PATH : MYPAGE_CONTACT_FORM_LOGIN_PATH}
        className={mobileMenuItemClass}
      >
        {MYPAGE_CONTACT_FORM_LABEL}
      </Link>

      <Link
        href={
          isLoggedIn
            ? "/orders/settings/display"
            : "/login?returnTo=%2Forders%2Fsettings%2Fdisplay"
        }
        className={mobileMenuItemClass}
      >
        文字の大きさ
      </Link>

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
        <Link href="/login?returnTo=%2Forders" className={mobileMenuItemClass}>
          ログイン
        </Link>
      ) : null}
    </div>
  );
}
