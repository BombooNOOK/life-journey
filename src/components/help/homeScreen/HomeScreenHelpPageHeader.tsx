"use client";

import { PageTitleWithAccent } from "@/components/ui/PageTitleWithAccent";
import { useClientAuthNavState } from "@/hooks/useClientAuthNavState";
import { APP_DISPLAY_NAME } from "@/lib/branding/appDisplayName";
import { LOG_HOUSE_BACK_LINK } from "@/lib/journal/logHouseLabels";

/** 未ログインはトップへ、ログイン済みはマイページへ戻る */
export function HomeScreenHelpPageHeader() {
  const { isLoggedIn } = useClientAuthNavState();
  const backLink = isLoggedIn
    ? LOG_HOUSE_BACK_LINK
    : { href: "/", label: "← トップへ" };

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
