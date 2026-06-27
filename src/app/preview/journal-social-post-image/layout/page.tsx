import Link from "next/link";
import { notFound } from "next/navigation";

import { JournalSocialPostImageLayoutDebugClient } from "./JournalSocialPostImageLayoutDebugClient";
import {
  buildJournalSocialPostLayoutRulerHref,
  parseJournalSocialPostLayoutRulerReturnTo,
  parseJournalSocialPostLayoutTemplate,
} from "@/lib/journal/social-post-image/layoutRulerUrls";

type Props = {
  searchParams: Promise<{ returnTo?: string; template?: string }>;
};

export default async function JournalSocialPostImageLayoutPage({ searchParams }: Props) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const params = await searchParams;
  const returnTo = parseJournalSocialPostLayoutRulerReturnTo(params.returnTo);
  const initialTemplate = parseJournalSocialPostLayoutTemplate(params.template) ?? "sns02";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-[900px] px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-800">Dev layout tool</p>
        <h1 className="mt-2 text-xl font-semibold">日記・投稿画像レイアウト定規</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          テンプレート PNG と同じ 819×1024 座標で測ります。座標は{" "}
          <code className="rounded bg-stone-200 px-1">src/lib/journal/social-post-image/templates.ts</code>{" "}
          を編集してください。
        </p>

        <div className="mt-8">
          <JournalSocialPostImageLayoutDebugClient
            initialTemplate={initialTemplate}
            returnTo={returnTo}
          />
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
            href={buildJournalSocialPostLayoutRulerHref({ template: "sns02" })}
            className="text-stone-600 underline hover:text-stone-900"
          >
            sns02
          </Link>
          <Link
            href={buildJournalSocialPostLayoutRulerHref({ template: "sns03" })}
            className="text-stone-600 underline hover:text-stone-900"
          >
            sns03
          </Link>
          <Link href="/preview" className="text-stone-600 underline hover:text-stone-900">
            校正メニューへ
          </Link>
        </p>
      </div>
    </div>
  );
}
