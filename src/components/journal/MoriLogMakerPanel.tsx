"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import {
  JournalSocialPostImagePanel,
  type JournalSocialPostImagePanelHandle,
} from "@/components/journal/JournalSocialPostImagePanel";
import { MoriLogBgmPicker } from "@/components/journal/MoriLogBgmPicker";
import {
  MORI_LOG_CARD_SECTION_HINT,
  MORI_LOG_CARD_SECTION_TITLE,
  MORI_LOG_MOVIE_CREATE_BUSY,
  MORI_LOG_MOVIE_CREATE_LABEL,
  MORI_LOG_MOVIE_CREATE_OK,
  MORI_LOG_MOVIE_CREATE_PHASE_ENCODE,
  MORI_LOG_MOVIE_CREATE_PHASE_IMAGE,
  MORI_LOG_MOVIE_FAIL_BODY,
  MORI_LOG_MOVIE_FAIL_CLOSE,
  MORI_LOG_MOVIE_FAIL_RETRY,
  MORI_LOG_MOVIE_FAIL_SAVE_CARD,
  MORI_LOG_MOVIE_FAIL_TITLE,
  MORI_LOG_MOVIE_SAVE_FAIL,
  MORI_LOG_MOVIE_SAVE_NEED_BGM,
  MORI_LOG_MOVIE_SAVE_NEED_CARD,
  MORI_LOG_MOVIE_SAVE_NEED_PROFILE,
  MORI_LOG_MOVIE_SAVE_OK,
  MORI_LOG_MOVIE_SAVE_SETTINGS_LABEL,
  MORI_LOG_MOVIE_SECTION_HINT,
  MORI_LOG_MOVIE_SECTION_TITLE,
  MORI_LOG_WHAT_IS_BODY,
  MORI_LOG_WHAT_IS_TITLE,
} from "@/lib/journal/moriLog/moriLogCopy";
import { MORI_LOG_BGM_TRACKS, getMoriLogBgmTrack } from "@/lib/journal/moriLog/moriLogBgmCatalog";
import {
  composeMoriLogStillMovie,
  downloadBlobFile,
} from "@/lib/journal/moriLog/composeMoriLogStillMovie";
import {
  buildMoriLogCardImageCreateInput,
  buildMoriLogMovieCreateInput,
  isMoriLogCardImageType,
  moriLogMovieDurationSecForTemplate,
  type MoriLogMedia,
} from "@/lib/journal/moriLog/moriLogMedia";
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
  const cardPanelRef = useRef<JournalSocialPostImagePanelHandle>(null);
  const creatingMovieRef = useRef(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [historyNote, setHistoryNote] = useState<string | null>(null);
  const [movieNote, setMovieNote] = useState<string | null>(null);
  const [savingMovie, setSavingMovie] = useState(false);
  const [creatingMovie, setCreatingMovie] = useState(false);
  const [createProgress, setCreateProgress] = useState<number | null>(null);
  const [createPhase, setCreatePhase] = useState<"image" | "encode" | null>(null);
  const [failOpen, setFailOpen] = useState(false);
  const [failDetail, setFailDetail] = useState<string | null>(null);
  const [lastSavedCard, setLastSavedCard] = useState<MoriLogMedia | null>(null);
  const [selectedBgmId, setSelectedBgmId] = useState<string | null>(
    () => MORI_LOG_BGM_TRACKS[0]?.id ?? null,
  );
  const selectedBgm = getMoriLogBgmTrack(selectedBgmId);
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
        const saved = await getMoriLogMediaStore().upsert(
          buildMoriLogCardImageCreateInput({
            userId: (userId ?? "").trim(),
            profileId: pid,
            entryId,
            templateId: params.templateId,
            entryDateKey,
            tags,
            mood: mood ?? null,
            companionType: companionType ?? null,
            title: params.title.trim() || null,
          }),
        );
        setLastSavedCard(saved);
        setHistoryNote("この端末に、森ログカードの記録を残しました（画像本体はダウンロード分です）。");
      } catch {
        setHistoryNote("画像は保存できましたが、履歴の書き込みに失敗しました。");
      }
    },
    [companionType, entryDateKey, entryId, mood, profileId, tags, userId],
  );

  const resolveSourceCard = useCallback(async (): Promise<MoriLogMedia | null> => {
    if (lastSavedCard && lastSavedCard.entryId === entryId && isMoriLogCardImageType(lastSavedCard.type)) {
      return lastSavedCard;
    }
    const pid = (profileId ?? "").trim();
    if (!pid) return null;
    const cards = await getMoriLogMediaStore().list({
      profileId: pid,
      entryId,
      type: "card_image",
    });
    return cards[0] ?? null;
  }, [entryId, lastSavedCard, profileId]);

  const saveMovieSettings = useCallback(async () => {
    const pid = (profileId ?? "").trim();
    if (!pid) {
      setMovieNote(MORI_LOG_MOVIE_SAVE_NEED_PROFILE);
      return;
    }
    if (!selectedBgmId) {
      setMovieNote(MORI_LOG_MOVIE_SAVE_NEED_BGM);
      return;
    }

    setSavingMovie(true);
    setMovieNote(null);
    try {
      const sourceCard = await resolveSourceCard();
      if (!sourceCard) {
        setMovieNote(MORI_LOG_MOVIE_SAVE_NEED_CARD);
        return;
      }

      await getMoriLogMediaStore().upsert(
        buildMoriLogMovieCreateInput({
          userId: (userId ?? "").trim(),
          profileId: pid,
          entryId,
          templateId: sourceCard.templateId,
          sourceCardId: sourceCard.id,
          bgmId: selectedBgmId,
          entryDateKey,
          tags,
          mood: mood ?? null,
          companionType: companionType ?? null,
          title: sourceCard.title ?? null,
          durationSec: moriLogMovieDurationSecForTemplate(sourceCard.templateId),
        }),
      );
      setMovieNote(MORI_LOG_MOVIE_SAVE_OK);
    } catch {
      setMovieNote(MORI_LOG_MOVIE_SAVE_FAIL);
    } finally {
      setSavingMovie(false);
    }
  }, [
    companionType,
    entryDateKey,
    entryId,
    mood,
    profileId,
    resolveSourceCard,
    selectedBgmId,
    tags,
    userId,
  ]);

  const createAndDownloadMovie = useCallback(async () => {
    if (!selectedBgm || creatingMovieRef.current) return;
    creatingMovieRef.current = true;
    setCreatingMovie(true);
    setCreatePhase("image");
    setCreateProgress(null);
    setFailOpen(false);
    setFailDetail(null);
    setMovieNote(null);

    try {
      const panel = cardPanelRef.current;
      if (!panel) {
        throw new Error("カードプレビューを準備できていません。");
      }
      const imageBlob = await panel.getCardPngBlob();
      const meta = panel.getCardMeta();

      const durationSec = moriLogMovieDurationSecForTemplate(meta.templateId);
      setCreatePhase("encode");
      setCreateProgress(0);
      const movie = await composeMoriLogStillMovie({
        imageBlob,
        audioUrl: selectedBgm.src,
        durationSec,
        audioFadeInSec: 0.35,
        audioFadeOutSec: 0.7,
        onProgress: setCreateProgress,
      });

      const stamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[-:T]/g, "");
      const fileName = `mori-log-movie_${stamp}.${movie.extension}`;
      downloadBlobFile(movie.blob, fileName);

      const pid = (profileId ?? "").trim();
      if (pid) {
        const sourceCard = await resolveSourceCard();
        await getMoriLogMediaStore().upsert(
          buildMoriLogMovieCreateInput({
            userId: (userId ?? "").trim(),
            profileId: pid,
            entryId,
            templateId: sourceCard?.templateId ?? meta.templateId,
            sourceCardId: sourceCard?.id ?? "preview-unsaved",
            bgmId: selectedBgm.id,
            entryDateKey,
            tags,
            mood: mood ?? null,
            companionType: companionType ?? null,
            title: sourceCard?.title ?? meta.title ?? null,
            durationSec,
          }),
        );
      }

      setMovieNote(MORI_LOG_MOVIE_CREATE_OK);
    } catch (error) {
      setFailDetail(error instanceof Error ? error.message : null);
      setFailOpen(true);
    } finally {
      creatingMovieRef.current = false;
      setCreatingMovie(false);
      setCreateProgress(null);
      setCreatePhase(null);
    }
  }, [
    companionType,
    entryDateKey,
    entryId,
    mood,
    profileId,
    resolveSourceCard,
    selectedBgm,
    tags,
    userId,
  ]);

  const downloadCardImageFallback = useCallback(async () => {
    setFailOpen(false);
    try {
      const panel = cardPanelRef.current;
      if (!panel) throw new Error("カード画像を取得できませんでした。");
      const blob = await panel.getCardPngBlob();
      downloadBlobFile(blob, `mori-log-card_${Date.now()}.png`);
    } catch (error) {
      setFailDetail(error instanceof Error ? error.message : null);
      setFailOpen(true);
    }
  }, []);

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
          ref={cardPanelRef}
          entryId={entryId}
          content={content}
          createdAt={createdAt}
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

      <section className={`${LJD_PAPER_CARD_CLASS} space-y-4 px-4 py-4 sm:px-5`}>
        <div>
          <h3 className="text-base font-semibold text-[#3f3428]">{MORI_LOG_MOVIE_SECTION_TITLE}</h3>
          <p className="mt-1 text-sm leading-relaxed text-[#5c4a35]">{MORI_LOG_MOVIE_SECTION_HINT}</p>
        </div>
        <MoriLogBgmPicker value={selectedBgmId} onChange={setSelectedBgmId} />
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void saveMovieSettings()}
            disabled={savingMovie || creatingMovie || !selectedBgmId}
            className="min-h-[44px] rounded-lg border border-[#c4b49a] bg-[#faf3e8] px-4 py-2.5 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingMovie ? "保存しています…" : MORI_LOG_MOVIE_SAVE_SETTINGS_LABEL}
          </button>
          <button
            type="button"
            onClick={() => void createAndDownloadMovie()}
            disabled={creatingMovie || !selectedBgmId}
            className="min-h-[44px] rounded-lg border border-emerald-700 bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-200 disabled:text-stone-500"
          >
            {creatingMovie ? MORI_LOG_MOVIE_CREATE_BUSY : MORI_LOG_MOVIE_CREATE_LABEL}
          </button>
        </div>
        {creatingMovie ? (
          <p className="text-xs text-[#6b5a48]" role="status">
            {createPhase === "image"
              ? MORI_LOG_MOVIE_CREATE_PHASE_IMAGE
              : createPhase === "encode"
                ? `${MORI_LOG_MOVIE_CREATE_PHASE_ENCODE}${
                    createProgress != null ? ` ${Math.round(createProgress * 100)}%` : ""
                  }`
                : MORI_LOG_MOVIE_CREATE_BUSY}
          </p>
        ) : null}
        {movieNote ? (
          <p className="text-xs leading-relaxed text-[#5c6b4a]" role="status">
            {movieNote}
          </p>
        ) : null}
      </section>

      {failOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mori-log-movie-fail-title"
        >
          <div className={`${LJD_PAPER_CARD_CLASS} w-full max-w-md px-4 py-4 sm:px-5`}>
            <h3 id="mori-log-movie-fail-title" className="text-base font-semibold text-[#3f3428]">
              {MORI_LOG_MOVIE_FAIL_TITLE}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#5c4a35]">
              {MORI_LOG_MOVIE_FAIL_BODY}
            </p>
            {failDetail ? (
              <p className="mt-2 text-xs leading-relaxed text-[#8a735c]">{failDetail}</p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void downloadCardImageFallback()}
                className="min-h-[44px] rounded-lg border border-emerald-700 bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900"
              >
                {MORI_LOG_MOVIE_FAIL_SAVE_CARD}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFailOpen(false);
                  void createAndDownloadMovie();
                }}
                className="min-h-[44px] rounded-lg border border-[#c4b49a] bg-[#faf3e8] px-4 py-2.5 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8]"
              >
                {MORI_LOG_MOVIE_FAIL_RETRY}
              </button>
              <button
                type="button"
                onClick={() => setFailOpen(false)}
                className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                {MORI_LOG_MOVIE_FAIL_CLOSE}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
