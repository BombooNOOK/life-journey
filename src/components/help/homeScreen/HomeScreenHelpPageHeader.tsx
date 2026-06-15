"use client";

import { useEffect, useState } from "react";

import { PageTitleWithAccent } from "@/components/ui/PageTitleWithAccent";
import { useClientAuthNavState } from "@/hooks/useClientAuthNavState";
import { APP_DISPLAY_NAME } from "@/lib/branding/appDisplayName";

const TOP_BACK_LINK = { href: "/", label: "← トップへ" } as const;
const MY_PAGE_BACK_LINK = { href: "/orders", label: "← マイページ" } as const;

/** 未ログインはトップへ、ログイン済みはマイページへ戻る */
export function HomeScreenHelpPageHeader() {
  const { isLoggedIn } = useClientAuthNavState();
  const [backLink, setBackLink] = useState(TOP_BACK_LINK);

  useEffect(() => {
    setBackLink(isLoggedIn ? MY_PAGE_BACK_LINK : TOP_BACK_LINK);
  }, [isLoggedIn]);

  return (
    <PageTitleWithAccent
      tone="guide"
      title="LJDをホーム画面に追加する方法"
      backLink={backLink}
      description={
        <>
          {APP_DISPLAY_NAME}は、スマホのホーム画面に追加すると、アプリのようにすぐ開けます。
          <br />
          毎日の記録を続けやすくするために、はじめに設定しておくのがおすすめです。
        </>
      }
      cornerAccents={["leaf", "book"]}
    />
  );
}
