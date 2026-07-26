import Link from "next/link";

import { JournalSocialPostImageLayoutDebugClient } from "./JournalSocialPostImageLayoutDebugClient";
import { MoriAshiatoLayoutDebugClient } from "./MoriAshiatoLayoutDebugClient";
import { assertDevOrAdminPreviewAccess } from "@/lib/preview/assertDevOrAdminPreviewAccess";
import {
  buildJournalSocialPostLayoutRulerHref,
  parseJournalSocialPostLayoutRulerReturnTo,
  parseJournalSocialPostLayoutTemplate,
} from "@/lib/journal/social-post-image/layoutRulerUrls";
import {
  isMoriAshiatoTemplateId,
  type MoriAshiatoTemplateId,
} from "@/lib/journal/social-post-image/moriAshiatoTemplates";

type Props = {
  searchParams: Promise<{ returnTo?: string; template?: string }>;
};

export default async function JournalSocialPostImageLayoutPage({ searchParams }: Props) {
  await assertDevOrAdminPreviewAccess();

  const params = await searchParams;
  const returnTo = parseJournalSocialPostLayoutRulerReturnTo(params.returnTo);
  const parsed = parseJournalSocialPostLayoutTemplate(params.template);
  const useMoriEditor = !parsed || isMoriAshiatoTemplateId(parsed);
  const moriInitial: MoriAshiatoTemplateId =
    parsed && isMoriAshiatoTemplateId(parsed) ? parsed : "chiisana_ashiato";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-[1100px] px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-800">Dev layout tool</p>
        <h1 className="mt-2 text-xl font-semibold">
          {useMoriEditor
            ? "森ログカード位置合わせ"
            : "投稿画像レイアウト定規（sns）"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {useMoriEditor
            ? "本棚の本・あしあとテンプレと同じく、枠を選んで数値調整し、「ファイルに保存」できます。"
            : "sns02/03 用の座標クリック定規です。森ログカードはテンプレ未指定またはあしあと系 ID で開いてください。"}
        </p>

        <div className="mt-8">
          {useMoriEditor ? (
            <MoriAshiatoLayoutDebugClient initialTemplate={moriInitial} />
          ) : (
            <JournalSocialPostImageLayoutDebugClient
              initialTemplate={parsed ?? "sns02"}
              returnTo={returnTo}
            />
          )}
        </div>

        <p className="mt-10 flex flex-wrap gap-4 text-sm">
          {returnTo ? (
            <Link href={returnTo} className="text-violet-800 underline hover:text-violet-950">
              ← プレビュー画面へ戻る
            </Link>
          ) : (
            <Link
              href="/preview/journal-social-post-image"
              className="text-violet-800 underline hover:text-violet-950"
            >
              ← 投稿画像プレビューへ
            </Link>
          )}
          <Link
            href={buildJournalSocialPostLayoutRulerHref({ template: "chiisana_ashiato" })}
            className="text-stone-600 underline hover:text-stone-900"
          >
            森ログ定規
          </Link>
          <Link
            href={buildJournalSocialPostLayoutRulerHref({ template: "sns02" })}
            className="text-stone-600 underline hover:text-stone-900"
          >
            sns02 定規
          </Link>
          <Link href="/preview" className="text-stone-600 underline hover:text-stone-900">
            校正メニューへ
          </Link>
        </p>
      </div>
    </div>
  );
}
