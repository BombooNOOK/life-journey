"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import {
  filterHitoyasumiMedia,
  formatHitoyasumiCreatedAt,
  hitoyasumiMediaTypeLabel,
  hitoyasumiTemplateLabel,
  listHitoyasumiMedia,
  type HitoyasumiMediaFilter,
} from "@/lib/journal/moriLog/hitoyasumiMedia";
import {
  getMoriLogMediaBlob,
  getMoriLogMediaPosterBlob,
  removeMoriLogMediaBlob,
} from "@/lib/journal/moriLog/moriLogMediaBlobStore";
import {
  downloadBlobFile,
  downloadOrShareBlobFile,
} from "@/lib/journal/moriLog/composeMoriLogStillMovie";
import {
  isMoriLogCardMovieType,
  type MoriLogMedia,
  type MoriLogMediaType,
} from "@/lib/journal/moriLog/moriLogMedia";
import { getMoriLogMediaStore } from "@/lib/journal/moriLog/moriLogMediaStore";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";
import {
  LOG_HOUSE_HITOYASUMI_ACTION_CANCELLED,
  LOG_HOUSE_HITOYASUMI_ACTION_FAIL,
  LOG_HOUSE_HITOYASUMI_ACTION_HINT,
  LOG_HOUSE_HITOYASUMI_ACTION_OK,
  LOG_HOUSE_HITOYASUMI_ALBUM_SOON_BODY,
  LOG_HOUSE_HITOYASUMI_ALBUM_SOON_TITLE,
  LOG_HOUSE_HITOYASUMI_BG_SRC,
  LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL,
  LOG_HOUSE_HITOYASUMI_DELETE,
  LOG_HOUSE_HITOYASUMI_DELETE_CANCEL,
  LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM,
  LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM_BODY,
  LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM_TITLE,
  LOG_HOUSE_HITOYASUMI_DELETE_FAIL,
  LOG_HOUSE_HITOYASUMI_EMPTY_BODY,
  LOG_HOUSE_HITOYASUMI_EMPTY_TITLE,
  LOG_HOUSE_HITOYASUMI_FILTER_ALBUM,
  LOG_HOUSE_HITOYASUMI_FILTER_ALBUM_SRC,
  LOG_HOUSE_HITOYASUMI_FILTER_CARD,
  LOG_HOUSE_HITOYASUMI_FILTER_CARD_SRC,
  LOG_HOUSE_HITOYASUMI_FILTER_MOVIE,
  LOG_HOUSE_HITOYASUMI_FILTER_MOVIE_SRC,
  LOG_HOUSE_HITOYASUMI_HELP_BUTTON_LABEL,
  LOG_HOUSE_HITOYASUMI_HELP_DISMISS,
  LOG_HOUSE_HITOYASUMI_ITEM_FRAME_CARD_SRC,
  LOG_HOUSE_HITOYASUMI_ITEM_FRAME_MOVIE_SRC,
  LOG_HOUSE_HITOYASUMI_NO_PREVIEW,
  LOG_HOUSE_HITOYASUMI_PAGE_DESCRIPTION,
  LOG_HOUSE_HITOYASUMI_PAGE_TITLE,
  LOG_HOUSE_HITOYASUMI_SAVE_DEVICE,
  LOG_HOUSE_HITOYASUMI_SHARE,
} from "@/lib/loghouse/logHouseHitoyasumiCopy";

type Props = {
  profileId: string;
};

type DetailState = {
  item: MoriLogMedia;
  objectUrl: string | null;
  blob: Blob | null;
  /** IDB に動画が入らず画像ポスターだけ残った場合あり */
  blobMimeType: string | null;
};

function HelpHintIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.2 9.2a2.9 2.9 0 0 1 5.6 1c0 2-2.9 2.5-2.9 4.3"
      />
      <circle cx="12" cy="17" r="0.95" fill="currentColor" stroke="none" />
    </svg>
  );
}

function hitoyasumiItemFrameSrc(type: MoriLogMediaType): string {
  return isMoriLogCardMovieType(type)
    ? LOG_HOUSE_HITOYASUMI_ITEM_FRAME_MOVIE_SRC
    : LOG_HOUSE_HITOYASUMI_ITEM_FRAME_CARD_SRC;
}

/** フィルターアイコン／紙カード枠の明るさを揃える */
const HITOYASUMI_ASSET_TONE =
  "brightness-[0.9] contrast-[0.97] saturate-[0.94]";

export function HitoyasumiChairPageClient({ profileId }: Props) {
  const helpTitleId = useId();
  const albumTitleId = useId();
  const [items, setItems] = useState<MoriLogMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HitoyasumiMediaFilter>("all");
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  /** thumb が video/* なら true。ムービーでもポスター画像だけの場合あり */
  const [thumbIsVideo, setThumbIsVideo] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [detailActionNote, setDetailActionNote] = useState<string | null>(null);
  const [detailActionBusy, setDetailActionBusy] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [albumSoonOpen, setAlbumSoonOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const createdUrls: string[] = [];
    try {
      const list = await listHitoyasumiMedia(profileId);
      const nextItems: MoriLogMedia[] = [];
      const nextThumbs: Record<string, string> = {};
      const nextThumbIsVideo: Record<string, boolean> = {};
      for (const item of list) {
        const mediaBlob = await getMoriLogMediaBlob(item.id);
        if (!mediaBlob || mediaBlob.size === 0) continue;

        // ムービーは iPhone で <video> サムネが真っ黒になりやすいので、ポスター画像を優先
        let thumbBlob = mediaBlob;
        if (isMoriLogCardMovieType(item.type)) {
          const poster = await getMoriLogMediaPosterBlob(item.id);
          if (poster && poster.size > 0) {
            thumbBlob = poster;
          } else {
            // 旧データ: カードも保存済みならその画像をサムネに使う
            const sourceId = (item.sourceCardId ?? "").trim();
            if (sourceId && sourceId !== "preview-unsaved") {
              const cardBlob = await getMoriLogMediaBlob(sourceId);
              if (
                cardBlob &&
                cardBlob.size > 0 &&
                !(cardBlob.type || "").startsWith("video/")
              ) {
                thumbBlob = cardBlob;
              }
            }
          }
        }

        const url = URL.createObjectURL(thumbBlob);
        createdUrls.push(url);
        nextItems.push(item);
        nextThumbs[item.id] = url;
        nextThumbIsVideo[item.id] = (thumbBlob.type || "").startsWith("video/");
      }
      setThumbUrls((prev) => {
        for (const url of Object.values(prev)) URL.revokeObjectURL(url);
        return nextThumbs;
      });
      setThumbIsVideo(nextThumbIsVideo);
      setItems(nextItems);
    } catch {
      for (const url of createdUrls) URL.revokeObjectURL(url);
      setItems([]);
      setThumbUrls((prev) => {
        for (const url of Object.values(prev)) URL.revokeObjectURL(url);
        return {};
      });
      setThumbIsVideo({});
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(thumbUrls)) URL.revokeObjectURL(url);
    };
    // アンマウント時のみ。thumbUrls 更新ごとの revoke は refresh 側で実施
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (detail?.objectUrl) URL.revokeObjectURL(detail.objectUrl);
    };
  }, [detail]);

  useEffect(() => {
    if (!helpOpen && !albumSoonOpen && !deleteConfirmOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setHelpOpen(false);
      setAlbumSoonOpen(false);
      setDeleteConfirmOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [albumSoonOpen, deleteConfirmOpen, helpOpen]);

  const visible = useMemo(() => filterHitoyasumiMedia(items, filter), [filter, items]);

  const openDetail = useCallback(async (item: MoriLogMedia) => {
    const blob = await getMoriLogMediaBlob(item.id);
    const objectUrl = blob ? URL.createObjectURL(blob) : null;
    setDetailActionNote(null);
    setDeleteConfirmOpen(false);
    setDetail((prev) => {
      if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      return { item, objectUrl, blob: blob ?? null, blobMimeType: blob?.type ?? null };
    });
  }, []);

  const closeDetail = useCallback(() => {
    setDetailActionNote(null);
    setDetailActionBusy(false);
    setDeleteConfirmOpen(false);
    setDetail((prev) => {
      if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
  }, []);

  const deleteDetail = useCallback(async () => {
    if (!detail || detailActionBusy) return;
    setDetailActionBusy(true);
    setDetailActionNote(null);
    try {
      await getMoriLogMediaStore().remove(detail.item.id, profileId);
      await removeMoriLogMediaBlob(detail.item.id);
      setDeleteConfirmOpen(false);
      closeDetail();
      await refresh();
    } catch {
      setDetailActionNote(LOG_HOUSE_HITOYASUMI_DELETE_FAIL);
      setDetailActionBusy(false);
    }
  }, [closeDetail, detail, detailActionBusy, profileId, refresh]);

  const detailFileName = useCallback((item: MoriLogMedia, blob: Blob) => {
    const stamp = (item.createdAt || "").slice(0, 10).replace(/-/g, "") || "mori-log";
    const isMovie =
      isMoriLogCardMovieType(item.type) && (blob.type || "").startsWith("video/");
    const ext = isMovie ? (blob.type.includes("webm") ? "webm" : "mp4") : "png";
    const kind = isMovie ? "movie" : "card";
    return `mori-log-${kind}_${stamp}.${ext}`;
  }, []);

  const saveDetailToDevice = useCallback(async () => {
    if (!detail?.blob || detailActionBusy) return;
    setDetailActionBusy(true);
    setDetailActionNote(null);
    try {
      // iPhone では共有メニュー経由が写真アプリ保存の定石
      const result = await downloadOrShareBlobFile(
        detail.blob,
        detailFileName(detail.item, detail.blob),
      );
      if (result === "cancelled") {
        setDetailActionNote(LOG_HOUSE_HITOYASUMI_ACTION_CANCELLED);
      } else {
        setDetailActionNote(LOG_HOUSE_HITOYASUMI_ACTION_OK);
      }
    } catch {
      try {
        downloadBlobFile(detail.blob, detailFileName(detail.item, detail.blob));
        setDetailActionNote(LOG_HOUSE_HITOYASUMI_ACTION_OK);
      } catch {
        setDetailActionNote(LOG_HOUSE_HITOYASUMI_ACTION_FAIL);
      }
    } finally {
      setDetailActionBusy(false);
    }
  }, [detail, detailActionBusy, detailFileName]);

  const shareDetail = useCallback(async () => {
    if (!detail?.blob || detailActionBusy) return;
    setDetailActionBusy(true);
    setDetailActionNote(null);
    try {
      const result = await downloadOrShareBlobFile(
        detail.blob,
        detailFileName(detail.item, detail.blob),
      );
      if (result === "cancelled") {
        setDetailActionNote(LOG_HOUSE_HITOYASUMI_ACTION_CANCELLED);
      } else {
        setDetailActionNote(LOG_HOUSE_HITOYASUMI_ACTION_OK);
      }
    } catch {
      setDetailActionNote(LOG_HOUSE_HITOYASUMI_ACTION_FAIL);
    } finally {
      setDetailActionBusy(false);
    }
  }, [detail, detailActionBusy, detailFileName]);

  const filterImageButtonClass = (active: boolean) =>
    [
      "relative flex w-[30%] max-w-[7.5rem] flex-col items-center justify-end rounded-2xl p-1 transition",
      active
        ? "bg-[#fffaf2]/28 ring-2 ring-[#c5b089]/65 shadow-[0_8px_20px_rgba(40,28,16,0.16)]"
        : "bg-transparent hover:bg-[#fffaf2]/14",
    ].join(" ");

  const selectFilter = useCallback((next: "card_image" | "card_movie") => {
    setFilter((prev) => (prev === next ? "all" : next));
  }, []);

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden text-[#3f3428]">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <Image
          src={LOG_HOUSE_HITOYASUMI_BG_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* 明るい背景向け：ごく薄い暖色ベールだけ（カードが浮かないよう暗幕は使わない） */}
        <div className="absolute inset-0 bg-[#f4ebe0]/12" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fffaf2]/20 via-transparent to-[#e8dcc8]/28" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-16 pt-5 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href="/orders"
            className="inline-flex w-fit min-h-[44px] items-center rounded-full border border-stone-200/40 bg-[#fffdf9]/85 px-3.5 text-sm font-medium text-stone-800 shadow-md backdrop-blur-[3px] transition hover:bg-[#fffdf9]/95 active:scale-[0.98]"
          >
            ← {LOG_HOUSE_RETURN_TO_LABEL}
          </Link>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200/40 bg-[#fffdf9]/85 text-stone-800 shadow-md backdrop-blur-[3px] transition hover:bg-[#fffdf9]/95 active:scale-[0.98]"
            aria-label={LOG_HOUSE_HITOYASUMI_HELP_BUTTON_LABEL}
            title={LOG_HOUSE_HITOYASUMI_HELP_BUTTON_LABEL}
            aria-haspopup="dialog"
            aria-expanded={helpOpen}
            onClick={() => setHelpOpen(true)}
          >
            <HelpHintIcon />
          </button>
        </div>

        <div className="mt-5" role="tablist" aria-label="表示の切り替え">
          <div className="flex items-end justify-between gap-1 px-0.5">
            <button
              type="button"
              role="tab"
              aria-selected={filter === "card_image"}
              aria-label={LOG_HOUSE_HITOYASUMI_FILTER_CARD}
              className={filterImageButtonClass(filter === "card_image")}
              onClick={() => selectFilter("card_image")}
            >
              <Image
                src={LOG_HOUSE_HITOYASUMI_FILTER_CARD_SRC}
                alt=""
                width={480}
                height={480}
                className={`h-auto w-full object-contain drop-shadow-[0_5px_10px_rgba(20,12,8,0.22)] ${HITOYASUMI_ASSET_TONE}`}
              />
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={false}
              aria-label={`${LOG_HOUSE_HITOYASUMI_FILTER_ALBUM}（準備中）`}
              className={filterImageButtonClass(false)}
              onClick={() => setAlbumSoonOpen(true)}
            >
              <Image
                src={LOG_HOUSE_HITOYASUMI_FILTER_ALBUM_SRC}
                alt=""
                width={480}
                height={480}
                className={`h-auto w-full object-contain drop-shadow-[0_5px_10px_rgba(20,12,8,0.22)] ${HITOYASUMI_ASSET_TONE}`}
              />
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filter === "card_movie"}
              aria-label={LOG_HOUSE_HITOYASUMI_FILTER_MOVIE}
              className={filterImageButtonClass(filter === "card_movie")}
              onClick={() => selectFilter("card_movie")}
            >
              <Image
                src={LOG_HOUSE_HITOYASUMI_FILTER_MOVIE_SRC}
                alt=""
                width={480}
                height={480}
                className={`h-auto w-full object-contain drop-shadow-[0_5px_10px_rgba(20,12,8,0.22)] ${HITOYASUMI_ASSET_TONE}`}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="mt-10 text-center text-sm text-[#fffaf2] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            読み込んでいます…
          </p>
        ) : visible.length === 0 ? (
          <div className="mt-8 rounded-[1.35rem] border border-[#e4d5c0]/75 bg-[#fffaf2]/82 px-5 py-8 text-center shadow-[0_12px_32px_rgba(40,28,16,0.16)] backdrop-blur-[2px]">
            <p className="text-base font-semibold text-[#3f3428]">{LOG_HOUSE_HITOYASUMI_EMPTY_TITLE}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#6e5c48]">
              {LOG_HOUSE_HITOYASUMI_EMPTY_BODY}
            </p>
            <Link
              href="/orders"
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c5b089]/70 bg-[#f3ead9]/90 px-4 text-sm font-semibold text-[#3f3428]"
            >
              ログハウスへ戻る
            </Link>
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
            {visible.map((item) => {
              const thumb = thumbUrls[item.id];
              const isMovie = isMoriLogCardMovieType(item.type);
              const title = item.title?.trim() || hitoyasumiTemplateLabel(item.templateId);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void openDetail(item)}
                    className="group relative block w-full text-left transition hover:-translate-y-0.5"
                    aria-label={`${hitoyasumiMediaTypeLabel(item.type)} ${title}`}
                  >
                    <div className="relative aspect-[819/1024] w-full">
                      <Image
                        src={hitoyasumiItemFrameSrc(item.type)}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 46vw, 220px"
                        className={`pointer-events-none object-contain drop-shadow-[0_6px_14px_rgba(20,12,8,0.2)] ${HITOYASUMI_ASSET_TONE}`}
                      />

                      {/* 破線より上：プレビュー */}
                      <div className="absolute inset-x-[11%] top-[13.5%] bottom-[32%] overflow-hidden rounded-[0.65rem] bg-[#efe6d6]/55">
                        {thumb ? (
                          isMovie && thumbIsVideo[item.id] ? (
                            <video
                              src={thumb}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                          )
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-center text-[10px] leading-relaxed text-[#8a7660]">
                            {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
                          </div>
                        )}
                      </div>

                      {/* 破線より下：タイトル（葉イラストを避ける） */}
                      <div className="absolute inset-x-[11%] bottom-[7%] top-[72%] pr-[26%]">
                        <p className="truncate text-[11px] font-semibold leading-snug text-[#3f3428] sm:text-xs">
                          {title}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] leading-snug text-[#8a7660] sm:text-[10px]">
                          {formatHitoyasumiCreatedAt(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-auto pt-10" aria-hidden />
      </div>

      {helpOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/40"
            aria-label="ヘルプを閉じる"
            onClick={() => setHelpOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={helpTitleId}
            className="relative z-[1] w-full max-w-sm rounded-2xl border border-[#e4d8c6] bg-[#fffdf8]/96 px-5 py-5 shadow-[0_12px_40px_rgba(40,28,16,0.28)]"
          >
            <h2 id={helpTitleId} className="text-base font-semibold tracking-wide text-[#3f3428]">
              {LOG_HOUSE_HITOYASUMI_PAGE_TITLE}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4f4033]">
              {LOG_HOUSE_HITOYASUMI_PAGE_DESCRIPTION}
            </p>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#d9cbb8] bg-[#f7f0e4] px-4 text-sm font-medium text-[#5c4a3a] shadow-sm transition hover:bg-[#f3ebe0]"
            >
              {LOG_HOUSE_HITOYASUMI_HELP_DISMISS}
            </button>
          </div>
        </div>
      ) : null}

      {albumSoonOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/40"
            aria-label="閉じる"
            onClick={() => setAlbumSoonOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={albumTitleId}
            className="relative z-[1] w-full max-w-sm rounded-2xl border border-[#e4d8c6] bg-[#fffdf8]/96 px-5 py-5 shadow-[0_12px_40px_rgba(40,28,16,0.28)]"
          >
            <h2 id={albumTitleId} className="text-base font-semibold tracking-wide text-[#3f3428]">
              {LOG_HOUSE_HITOYASUMI_ALBUM_SOON_TITLE}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4f4033]">
              {LOG_HOUSE_HITOYASUMI_ALBUM_SOON_BODY}
            </p>
            <button
              type="button"
              onClick={() => setAlbumSoonOpen(false)}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#d9cbb8] bg-[#f7f0e4] px-4 text-sm font-medium text-[#5c4a3a] shadow-sm transition hover:bg-[#f3ebe0]"
            >
              {LOG_HOUSE_HITOYASUMI_HELP_DISMISS}
            </button>
          </div>
        </div>
      ) : null}

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#120c08]/72 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={detail.item.title?.trim() || LOG_HOUSE_HITOYASUMI_PAGE_TITLE}
          onClick={closeDetail}
        >
          <div
            className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.35rem] border border-[#e4d5c0]/95 bg-[#fffaf2] shadow-[0_20px_50px_rgba(20,12,8,0.45)] sm:max-h-[94dvh] sm:rounded-[1.35rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-3 pt-3 sm:px-4 sm:pt-4">
              <div className="min-w-0">
                <p className="inline-flex rounded-md border border-[#e0d2bc]/90 bg-[#f7efe3] px-2 py-0.5 text-xs font-medium text-[#5c4a35]">
                  {hitoyasumiMediaTypeLabel(detail.item.type)}
                </p>
                <h2 className="mt-2 truncate text-lg font-semibold text-[#3d3226]">
                  {detail.item.title?.trim() || hitoyasumiTemplateLabel(detail.item.templateId)}
                </h2>
                <p className="mt-1 text-xs text-[#8a7660]">
                  {formatHitoyasumiCreatedAt(detail.item.createdAt)} ·{" "}
                  {hitoyasumiTemplateLabel(detail.item.templateId)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="min-h-[40px] shrink-0 rounded-lg border border-[#e0d2bc]/95 bg-[#f7efe3] px-3 text-sm text-[#5c4a35]"
              >
                {LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-2 py-3 sm:px-4">
              {detail.objectUrl ? (
                isMoriLogCardMovieType(detail.item.type) &&
                (detail.blobMimeType ?? "").startsWith("video/") ? (
                  <video
                    src={detail.objectUrl}
                    className="mx-auto max-h-[68dvh] w-full rounded-xl bg-[#2a221a]"
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detail.objectUrl}
                    alt=""
                    className="mx-auto max-h-[72dvh] w-full rounded-xl object-contain"
                  />
                )
              ) : (
                <p className="rounded-xl border border-[#e0d2bc] bg-[#f7efe3] px-4 py-8 text-center text-sm leading-relaxed text-[#6e5c48]">
                  {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
                </p>
              )}
            </div>

            <div className="space-y-2 border-t border-[#e8dcc8] bg-[#fff7ec]/95 px-3 py-3 sm:px-4">
              {detail.blob ? (
                <>
                  <p className="text-xs leading-relaxed text-[#6e5c48]">
                    {LOG_HOUSE_HITOYASUMI_ACTION_HINT}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={detailActionBusy}
                      onClick={() => void saveDetailToDevice()}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-800 bg-emerald-800 px-4 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
                    >
                      <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v10m0 0 4-4m-4 4-4-4" />
                        <path strokeLinecap="round" d="M5 18h14" />
                      </svg>
                      {LOG_HOUSE_HITOYASUMI_SAVE_DEVICE}
                    </button>
                    <button
                      type="button"
                      disabled={detailActionBusy}
                      onClick={() => void shareDetail()}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#c4b49a] bg-[#faf3e8] px-4 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8] disabled:opacity-60"
                    >
                      <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14V4m0 0 4 4m-4-4-4 4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
                      </svg>
                      {LOG_HOUSE_HITOYASUMI_SHARE}
                    </button>
                  </div>
                </>
              ) : null}
              <button
                type="button"
                disabled={detailActionBusy}
                onClick={() => {
                  setDetailActionNote(null);
                  setDeleteConfirmOpen(true);
                }}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#d4b4a8] bg-[#fff8f5] px-4 text-sm font-medium text-[#8a4f3d] hover:bg-[#fff1eb] disabled:opacity-60"
              >
                {LOG_HOUSE_HITOYASUMI_DELETE}
              </button>
              {detailActionNote ? (
                <p className="text-xs leading-relaxed text-[#5c6b4a]" role="status">
                  {detailActionNote}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {deleteConfirmOpen && detail ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1a120c]/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hitoyasumi-delete-title"
          onClick={() => !detailActionBusy && setDeleteConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#e4d5c0]/95 bg-[#fffaf2] px-5 py-5 shadow-[0_16px_40px_rgba(40,28,16,0.28)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="hitoyasumi-delete-title"
              className="text-base font-semibold tracking-wide text-[#3f3428]"
            >
              {LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM_TITLE}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5c4a35]">
              {LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM_BODY}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={detailActionBusy}
                onClick={() => void deleteDetail()}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#a45c48] bg-[#a45c48] px-4 text-sm font-medium text-white hover:bg-[#8f4f3e] disabled:opacity-60"
              >
                {detailActionBusy ? "削除しています…" : LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM}
              </button>
              <button
                type="button"
                disabled={detailActionBusy}
                onClick={() => setDeleteConfirmOpen(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c4b49a] bg-[#faf3e8] px-4 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8] disabled:opacity-60"
              >
                {LOG_HOUSE_HITOYASUMI_DELETE_CANCEL}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
