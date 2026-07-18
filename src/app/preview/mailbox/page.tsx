import Link from "next/link";
import { notFound } from "next/navigation";

import { LogHouseMailboxPageClient } from "@/components/orders/LogHouseMailboxPageClient";
import { MAILBOX_PREVIEW_FIXTURES } from "@/lib/loghouse/mailboxPreviewFixture";
import { resolveSafeReturnTo } from "@/lib/navigation/safeReturnTo";

type Props = {
  searchParams?: Promise<{ empty?: string; returnTo?: string }>;
};

/** 開発用：ポスト一覧（ログイン不要・ヘッダーなし半没入） */
export default async function MailboxPreviewPage({ searchParams }: Props) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const params = searchParams ? await searchParams : {};
  const empty = params.empty === "1" || params.empty === "true";
  const returnTo = params.returnTo?.trim();
  const backHref = returnTo ? resolveSafeReturnTo(returnTo) : "/preview";
  const backLabel =
    backHref.startsWith("/preview/loghouse-tour")
      ? "案内プレビューに戻る"
      : backHref === "/preview"
        ? "プレビュー一覧"
        : "もといた場所に戻る";

  return (
    <>
      <LogHouseMailboxPageClient
        initialNotices={empty ? [] : MAILBOX_PREVIEW_FIXTURES}
        detailHrefBase="/preview/mailbox"
        backHref={backHref}
        backLabel={backLabel}
        refreshFromApi={false}
      />
      <p className="fixed bottom-3 left-0 right-0 z-50 px-4 text-center text-[11px] text-[#8a735c]">
        空状態：
        <Link href="/preview/mailbox?empty=1" className="underline underline-offset-2">
          ?empty=1
        </Link>
      </p>
    </>
  );
}
