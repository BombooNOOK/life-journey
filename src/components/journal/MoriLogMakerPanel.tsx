"use client";

import { useCallback, useMemo, useState } from "react";

import { JournalSocialPostImagePanel } from "@/components/journal/JournalSocialPostImagePanel";
import {
  MORI_LOG_CARD_SECTION_HINT,
  MORI_LOG_CARD_SECTION_TITLE,
  MORI_LOG_WHAT_IS_BODY,
  MORI_LOG_WHAT_IS_TITLE,
} from "@/lib/journal/moriLog/moriLogCopy";
import { getMoriLogMediaStore } from "@/lib/journal/moriLog/moriLogMediaStore";
import { calendarDayKeyInJapanFromDate } from "@/lib/date/japanCalendarDate";
import { extractTagsFromContent } from "@/lib/journal/diaryTags";
import type { JournalSocialPostTemplateId } from "@/lib/journal/social-post-image/templates";
import { LJD_PAPER_CARD_CLASS } from "@/lib/ljd/ljdPaperSurface";

type Props = {
  entryId: string;
  content: string;
  createdAt: string;
  mood?: string;
  companionType?: string | null;
  profileId?: string | null;
  userId?: string | null;
  hasPhoto?: boolean;
  photoSrc?: string | null;
};

export function MoriLogMakerPanel({
  entryId,
  content,
  createdAt,
  mood,
  companionType,
  profileId,
  userId,
  hasPhoto = false,
  photoSrc,
}: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [historyNote, setHistoryNote] = useState<string | null>(null);
  const tags = useMemo(() => extractTagsFromContent(content).tags, [content]);
  const entryDateKey = useMemo(
    () => calendarDayKeyInJapanFromDate(new Date(createdAt)),
    [createdAt],
  );

  const recordCardExport = useCallback(
    async (params: { templateId: JournalSocialPostTemplateId; title: string }) => {
      const pid = (profileId ?? "").trim();
      if (!pid) {
        setHistoryNote("プロフィールを読み込めなかったため、履歴には残していません。画像の保存は完了しています。");
        return;
      }
      try {
        await getMoriLogMediaStore().upsert({
          userId: (userId ?? "").trim(),
          profileId: pid,
          entryId,
          type: "card",
          templateId: params.templateId,
          bgmId: null,
          entryDateKey,
          tags,
          mood: mood ?? null,
          companionType: companionType ?? null,
          title: params.title.trim() || null,
          captionText: null,
          hashtags: [],
          outputFormat: "png",
          storage: "local",
          localUri: null,
          remoteUrl: null,
        });
        setHistoryNote("この端末に、森ログカードの記録を残しました（画像本体はダウンロード分です）。");
      } catch {
        setHistoryNote("画像は保存できましたが、履歴の書き込みに失敗しました。");
      }
    },
    [companionType, entryDateKey, entryId, mood, profileId, tags, userId],
  );

  return (
    <div className="space-y-5">
      <section className={`${LJD_PAPER_CARD_CLASS} px-4 py-4 sm:px-5`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#3f3428]">森ログメーカー</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#5c4a35]">
              今日のあしあとを、カードにして持ち帰れます。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHelpOpen((open) => !open)}
            className="min-h-[44px] rounded-lg border border-[#d7c7b0]/95 bg-[#faf3e8] px-3 py-2 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8]"
            aria-expanded={helpOpen}
          >
            {MORI_LOG_WHAT_IS_TITLE}
          </button>
        </div>
        {helpOpen ? (
          <div className="mt-3 rounded-lg border border-[#e0d2bc]/90 bg-[#fffaf3] px-3 py-3">
            <p className="text-sm font-semibold text-[#4a3a28]">{MORI_LOG_WHAT_IS_TITLE}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#5c4a35]">
              {MORI_LOG_WHAT_IS_BODY}
            </p>
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-[#3f3428]">{MORI_LOG_CARD_SECTION_TITLE}</h3>
        <p className="text-sm leading-relaxed text-[#5c4a35]">{MORI_LOG_CARD_SECTION_HINT}</p>
        <JournalSocialPostImagePanel
          entryId={entryId}
          content={content}
          hasPhoto={hasPhoto}
          photoSrc={photoSrc}
          onCardExported={recordCardExport}
          surfaceLabels={{
            previewHeading: "森ログカード プレビュー",
            titleLabel: "カード用タイトル",
            downloadLabel: "カードを保存",
            previewAlt: "森ログカードのプレビュー",
          }}
        />
        {historyNote ? (
          <p className="text-xs leading-relaxed text-[#5c6b4a]" role="status">
            {historyNote}
          </p>
        ) : null}
      </section>

      <section className={`${LJD_PAPER_CARD_CLASS} px-4 py-4 opacity-90`}>
        <h3 className="text-sm font-semibold text-[#5c4a35]">これから</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#6b5a48]">
          音つきの森ログムービーと、投稿文のコピーも、この場所から使えるようにしていきます。
        </p>
      </section>
    </div>
  );
}
