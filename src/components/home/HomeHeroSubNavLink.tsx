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

/** トップヒーロー：継続導線（マイページ／ログイン） */
export function HomeHeroSubNavLink() {
  const { user } = useFirebaseAuth();
  const isLoggedIn = Boolean(user) || isLjLoggedInOnClient();

  if (isLoggedIn) {
    return (
      <OwlNavButton
        href={MY_PAGE_HREF}
        loadingLabel="マイページを開いています…"
        className={heroCtaContinueClass}
      >
        <span className={heroCtaContinueLeadClass}>記録の続きはこちら</span>
        <span className={heroCtaContinueSubClass}>マイページへ</span>
      </OwlNavButton>
    );
  }

  return (
    <Link href={LOGIN_HREF} className={heroCtaContinueClass}>
      <span className={heroCtaContinueLeadClass}>記録の続きはこちら</span>
      <span className={heroCtaContinueSubClass}>ログイン</span>
    </Link>
  );
}
