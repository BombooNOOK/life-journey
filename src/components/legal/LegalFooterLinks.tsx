"use client";

import Link from "next/link";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";
import {
  GUEST_CONTACT_FORM_LABEL,
  GUEST_CONTACT_FORM_PATH,
  MYPAGE_CONTACT_FORM_LABEL,
  MYPAGE_CONTACT_FORM_PATH,
  PRIVACY_POLICY_LABEL,
  PRIVACY_POLICY_PATH,
  TERMS_OF_SERVICE_LABEL,
  TERMS_OF_SERVICE_PATH,
} from "@/lib/legal/legalDocumentLinks";

type Props = {
  className?: string;
};

const linkClass =
  "text-stone-600 underline-offset-2 transition hover:text-stone-900 hover:underline";

function FooterSeparator() {
  return (
    <span className="select-none text-stone-300" aria-hidden>
      |
    </span>
  );
}

/** フッター・マイページ下部などで共通利用する法務・お問い合わせリンク */
export function LegalFooterLinks({ className = "" }: Props) {
  const { user } = useFirebaseAuth();
  const cookieLoggedIn = isLjLoggedInOnClient();
  const isLoggedIn = Boolean(user) || cookieLoggedIn;
  const contactHref = isLoggedIn ? MYPAGE_CONTACT_FORM_PATH : GUEST_CONTACT_FORM_PATH;

  return (
    <nav
      aria-label="法務情報・お問い合わせ"
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-stone-600 sm:gap-x-3 ${className}`.trim()}
    >
      <Link href={PRIVACY_POLICY_PATH} className={linkClass}>
        {PRIVACY_POLICY_LABEL}
      </Link>
      <FooterSeparator />
      <Link href={TERMS_OF_SERVICE_PATH} className={linkClass}>
        {TERMS_OF_SERVICE_LABEL}
      </Link>
      <FooterSeparator />
      <Link href={contactHref} className={linkClass}>
        {MYPAGE_CONTACT_FORM_LABEL}
      </Link>
    </nav>
  );
}
