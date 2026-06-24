"use client";

type Props = {
  /** オフライン時のみ true（復元確認中は除く） */
  showDeviceOnlyNotice: boolean;
  isOffline: boolean;
  restorePromptVisible: boolean;
  onRestore: () => void;
  onDiscardRestore: () => void;
};

export function JournalLocalDraftBanner({
  showDeviceOnlyNotice,
  isOffline,
  restorePromptVisible,
  onRestore,
  onDiscardRestore,
}: Props) {
  if (!showDeviceOnlyNotice && !isOffline && !restorePromptVisible) {
    return null;
  }

  return (
    <div className="space-y-2" aria-live="polite">
      {restorePromptVisible ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          <p className="font-medium">未保存の下書きがあります。復元しますか？</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
            この下書きは、この端末だけに保存されています。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRestore}
              className="rounded-md bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900"
            >
              復元する
            </button>
            <button
              type="button"
              onClick={onDiscardRestore}
              className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100/60"
            >
              破棄する
            </button>
          </div>
        </div>
      ) : null}

      {isOffline ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
          オフラインです。入力内容はこの端末に一時保存されています。
        </p>
      ) : null}

      {showDeviceOnlyNotice ? (
        <p className="text-xs leading-relaxed text-stone-500">
          この下書きは、この端末だけに保存されています（別の端末とは共有されません）。
        </p>
      ) : null}
    </div>
  );
}

export const JOURNAL_LOCAL_DRAFT_PHOTO_NOTICE =
  "写真はオフライン下書きの対象外です。オンラインで保存するときに添付してください。";
