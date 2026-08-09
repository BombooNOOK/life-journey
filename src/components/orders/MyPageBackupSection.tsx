"use client";

import { JournalBackupDownloadButton } from "@/components/orders/JournalBackupDownloadButton";
import { ASHIATO_BACKUP_LABEL } from "@/lib/account/residentRegistrationUiCopy";

type Props = {
  showHeading?: boolean;
};

/** 設定：あしあとのバックアップ（ZIP書き出し。森ログ等は現状対象外） */
export function MyPageBackupSection({ showHeading = true }: Props) {
  return (
    <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      {showHeading ? (
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{ASHIATO_BACKUP_LABEL}</h2>
          <p className="mt-1 lj-read-caption text-stone-600">
            このアカウントに保存されたあしあとを書き出せます。
          </p>
        </div>
      ) : (
        <p className="lj-read-caption text-stone-600">
          このアカウントに保存されたあしあとを書き出せます。
        </p>
      )}
      <p className="lj-read-desc text-stone-700">
        あしあと本文・写真・気分・製本に使う情報をZIPファイルとして保存できます。
        バックアップファイルには個人的な内容が含まれるため、安全な場所に保管してください。
      </p>
      <p className="lj-read-caption leading-relaxed text-stone-600">
        バックアップファイルからの復元は、現在、運営確認のうえ個別に対応しています。
        既存のあしあとを上書きしない形での対応を基本とします。
        復元をご希望の場合は、お問い合わせください。
      </p>
      <JournalBackupDownloadButton />
    </section>
  );
}
