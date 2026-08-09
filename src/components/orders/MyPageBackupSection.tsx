"use client";

import { JournalBackupDownloadButton } from "@/components/orders/JournalBackupDownloadButton";

type Props = {
  activeProfileNickname?: string | null;
  showHeading?: boolean;
};

/** 設定ページ：日記バックアップ */
export function MyPageBackupSection({ activeProfileNickname, showHeading = true }: Props) {
  return (
    <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      {showHeading ? (
        <div>
          <h2 className="text-lg font-semibold text-stone-900">バックアップ作成</h2>
          {activeProfileNickname ? (
            <p className="mt-1 lj-read-caption text-stone-600">
              現在選択中のプロフィール「{activeProfileNickname}」のあしあとを書き出します。
            </p>
          ) : null}
        </div>
      ) : activeProfileNickname ? (
        <p className="lj-read-caption text-stone-600">
          現在選択中のプロフィール「{activeProfileNickname}」のあしあとを書き出します。
        </p>
      ) : null}
      <p className="lj-read-desc text-stone-700">
        あしあと本文・写真・気分・製本に使う情報をZIPファイルとして保存できます。
        バックアップファイルには個人的な内容が含まれるため、安全な場所に保管してください。
      </p>
      <p className="lj-read-caption leading-relaxed text-stone-600">
        バックアップファイルからの復元は、現在、運営確認のうえ個別に対応しています。
        復元時は、既存のあしあとを上書きせず、新しいプロフィールとして復元します。
        復元をご希望の場合は、お問い合わせください。
      </p>
      <JournalBackupDownloadButton />
    </section>
  );
}
