"use client";

import Link from "next/link";

import { buildLoginHref } from "@/app/login/loginFlow";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import {
  heroCtaMyPageLinkActionClass,
  heroCtaMyPageLinkClass,
  heroCtaMyPageLinkLeadClass,
} from "@/components/home/heroCtaStyles";
import { OwlNavButton } from "@/components/ui/OwlNavButton";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";

const MY_PAGE_HREF = "/orders";
const LOGIN_HREF = buildLoginHref(MY_PAGE_HREF);

/** トップヒーロー下部：未ログインはログイン、ログイン済みはマイページへ */
export function HomeHeroSubNavLink() {
  const { user } = useFirebaseAuth();
  const isLoggedIn = Boolean(user) || isLjLoggedInOnClient();

  if (isLoggedIn) {
    return (
      <p className="pt-0.5 text-center sm:pt-1">
        <OwlNavButton
          href={MY_PAGE_HREF}
          loadingLabel="マイページを開いています…"
          className={heroCtaMyPageLinkClass}
        >
          <span className={heroCtaMyPageLinkLeadClass}>記録の続きはこちら</span>
          <span className={heroCtaMyPageLinkActionClass}>マイページへ</span>
        </OwlNavButton>
      </p>
    );
  }

  return (
    <p className="pt-0.5 text-center sm:pt-1">
      <Link href={LOGIN_HREF} className={heroCtaMyPageLinkClass}>
        <span className={heroCtaMyPageLinkLeadClass}>すでにアカウントをお持ちの方</span>
        <span className={heroCtaMyPageLinkActionClass}>ログイン</span>
      </Link>
    </p>
  );
}
