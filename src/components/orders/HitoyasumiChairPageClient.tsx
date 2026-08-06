"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { HitoyasumiAlbumViewer } from "@/components/orders/HitoyasumiAlbumViewer";
import { HitoyasumiDeviceMovieComposer } from "@/components/orders/HitoyasumiDeviceMovieComposer";
import { HitoyasumiSoftVideoPlayer } from "@/components/orders/HitoyasumiSoftVideoPlayer";
import { useLogHouseRoomTimeTheme } from "@/hooks/useLogHouseRoomTimeOfDay";
import type { LogHouseRoomTimeOfDay } from "@/lib/loghouse/logHouseRoomTimeTheme";
import {
  collectHitoyasumiTags,
  filterHitoyasumiMedia,
  filterHitoyasumiMediaByTags,
  filterHitoyasumiMediaByYearMonth,
  formatHitoyasumiCreatedAt,
  hitoyasumiMediaTypeLabel,
  hitoyasumiTemplateLabel,
  listHitoyasumiMedia,
  listPendingDeviceMovieMedia,
  type HitoyasumiMediaFilter,
} from "@/lib/journal/moriLog/hitoyasumiMedia";
import { confirmMoriLogDeviceMovieOnServer } from "@/lib/journal/moriLog/confirmMoriLogDeviceMovieClient";
import {
  DEVICE_MOVIE_CONFIRMING,
  DEVICE_MOVIE_PENDING_BANNER,
  DEVICE_MOVIE_PENDING_RETRY,
} from "@/lib/journal/moriLog/deviceMovieComposerCopy";
import {
  discardPendingDeviceMovie,
  setDeviceMovieBillingStatus,
} from "@/lib/journal/moriLog/saveDeviceMovieToMoriLog";
import { writeDonguriBalanceHint } from "@/lib/loghouse/donguriBalanceHint";
import { journalListYearOptions } from "@/lib/journal/journalNav";
import {
  defaultMoriLogAlbumTitle,
  type MoriLogAlbum,
} from "@/lib/journal/moriLog/moriLogAlbum";
import { getMoriLogAlbumStore } from "@/lib/journal/moriLog/moriLogAlbumStore";
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
  resolveMoriLogMediaSourceOrigin,
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
  LOG_HOUSE_HITOYASUMI_ALBUM_BACK_TO_SHELF,
  LOG_HOUSE_HITOYASUMI_ALBUM_COMPOSE_CTA,
  LOG_HOUSE_HITOYASUMI_ALBUM_COMPOSE_TITLE,
  LOG_HOUSE_HITOYASUMI_ALBUM_DELETE_CONFIRM_BODY,
  LOG_HOUSE_HITOYASUMI_ALBUM_DELETE_CONFIRM_TITLE,
  LOG_HOUSE_HITOYASUMI_ALBUM_DELETE_CONFIRM_TITLE_MULTI,
  LOG_HOUSE_HITOYASUMI_ALBUM_DELETE_FAIL,
  LOG_HOUSE_HITOYASUMI_ALBUM_DESELECT_VISIBLE,
  LOG_HOUSE_HITOYASUMI_ALBUM_ITEM_COUNT,
  LOG_HOUSE_HITOYASUMI_ALBUM_MATCH_COUNT,
  LOG_HOUSE_HITOYASUMI_ALBUM_SAVE,
  LOG_HOUSE_HITOYASUMI_ALBUM_SAVE_FAIL,
  LOG_HOUSE_HITOYASUMI_ALBUM_SAVE_NEED_SELECTION,
  LOG_HOUSE_HITOYASUMI_ALBUM_SCREEN_TITLE,
  LOG_HOUSE_HITOYASUMI_ALBUM_SELECT_ALL,
  LOG_HOUSE_HITOYASUMI_ALBUM_SELECTED_COUNT,
  LOG_HOUSE_HITOYASUMI_ALBUM_SHELF_COUNT,
  LOG_HOUSE_HITOYASUMI_ALBUM_SHELF_EMPTY,
  LOG_HOUSE_HITOYASUMI_ALBUM_TAG_EMPTY,
  LOG_HOUSE_HITOYASUMI_ALBUM_TAG_LABEL,
  LOG_HOUSE_HITOYASUMI_ALBUM_TITLE_LABEL,
  LOG_HOUSE_HITOYASUMI_ALBUM_TITLE_PLACEHOLDER,
  LOG_HOUSE_HITOYASUMI_BACK_TO_ENTRANCE,
  LOG_HOUSE_HITOYASUMI_BATCH_DELETE_ARIA,
  LOG_HOUSE_HITOYASUMI_BATCH_DELETE_NEED_SELECTION,
  LOG_HOUSE_HITOYASUMI_BG_BY_TIME,
  LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL,
  LOG_HOUSE_HITOYASUMI_DATE_FILTER_LABEL,
  LOG_HOUSE_HITOYASUMI_DATE_FILTER_MONTH,
  LOG_HOUSE_HITOYASUMI_DATE_FILTER_YEAR,
  LOG_HOUSE_HITOYASUMI_DELETE,
  LOG_HOUSE_HITOYASUMI_DELETE_CANCEL,
  LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM,
  LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM_BODY,
  LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM_TITLE,
  LOG_HOUSE_HITOYASUMI_DELETE_FAIL,
  LOG_HOUSE_HITOYASUMI_EMPTY_BODY,
  LOG_HOUSE_HITOYASUMI_EMPTY_TITLE,
  LOG_HOUSE_HITOYASUMI_ENTRY_ALBUM_LABEL,
  LOG_HOUSE_HITOYASUMI_ENTRY_ALBUM_SRC,
  LOG_HOUSE_HITOYASUMI_ENTRY_CARD_LABEL,
  LOG_HOUSE_HITOYASUMI_ENTRY_CARD_SRC,
  LOG_HOUSE_HITOYASUMI_ENTRY_MOVIE_LABEL,
  LOG_HOUSE_HITOYASUMI_ENTRY_MOVIE_SRC,
  LOG_HOUSE_HITOYASUMI_ENTRY_SOUND_LABEL,
  LOG_HOUSE_HITOYASUMI_ENTRY_SOUND_SRC,
  LOG_HOUSE_HITOYASUMI_FILTER_ALL,
  LOG_HOUSE_HITOYASUMI_FILTER_BAR_LABEL,
  LOG_HOUSE_HITOYASUMI_FILTER_EMPTY,
  LOG_HOUSE_HITOYASUMI_FILTER_STILL,
  LOG_HOUSE_HITOYASUMI_FILTER_VIDEO,
  LOG_HOUSE_HITOYASUMI_HELP_BODY,
  LOG_HOUSE_HITOYASUMI_HELP_BUTTON_LABEL,
  LOG_HOUSE_HITOYASUMI_HELP_DISMISS,
  LOG_HOUSE_HITOYASUMI_ICON_BACK_CHAIR_SRC,
  LOG_HOUSE_HITOYASUMI_ICON_BACK_LOGHOUSE_SRC,
  LOG_HOUSE_HITOYASUMI_ITEM_FRAME_ALBUM_SRC,
  LOG_HOUSE_HITOYASUMI_ITEM_FRAME_CARD_SRC,
  LOG_HOUSE_HITOYASUMI_ITEM_FRAME_EISHAKI_SRC,
  LOG_HOUSE_HITOYASUMI_ITEM_FRAME_MOVIE_SRC,
  LOG_HOUSE_HITOYASUMI_MEDIA_DELETE_CONFIRM_BODY,
  LOG_HOUSE_HITOYASUMI_MEDIA_DELETE_CONFIRM_TITLE_MULTI,
  LOG_HOUSE_HITOYASUMI_NAV_CHAIR_LABEL,
  LOG_HOUSE_HITOYASUMI_NAV_LOGHOUSE_LABEL,
  LOG_HOUSE_HITOYASUMI_NO_PREVIEW,
  LOG_HOUSE_HITOYASUMI_PAGE_TITLE,
  LOG_HOUSE_HITOYASUMI_SAVE_DEVICE,
  LOG_HOUSE_HITOYASUMI_SHARE,
} from "@/lib/loghouse/logHouseHitoyasumiCopy";

type Screen = "entrance" | "browse" | "album" | "movie_compose";
type AlbumMode = "shelf" | "compose";
type BatchDeleteState =
  | { kind: "media"; ids: string[] }
  | { kind: "album"; ids: string[] };

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

type Props = {
  profileId: string;
  initialScreen?: Screen;
  /** 下書き再開用（検索パラメータ draftId） */
  initialDraftId?: string | null;
  /** 開発確認用：小物装飾を強制（本番フローでは未使用） */
  forceDecorationVariant?: "lantern" | "owl" | "quill" | null;
  /** プレビュー用：昼/夜を固定（未指定ならログハウスと同じ自動判定） */
  timeOfDayOverride?: LogHouseRoomTimeOfDay;
  /** プレビュー用：左上戻る先（未指定なら /orders） */
  backHref?: string;
  /** プレビュー用：親の高さにフィット（スマホ縦枠など） */
  fillParent?: boolean;
};

type DetailState = {
  item: MoriLogMedia;
  objectUrl: string | null;
  /** ムービー未再生時の真っ黒／グレー感を避けるポスター */
  posterUrl: string | null;
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

function hitoyasumiItemFrameSrc(
  type: MoriLogMediaType,
  sourceOrigin?: MoriLogMedia["sourceOrigin"],
): string {
  if (isMoriLogCardMovieType(type)) {
    return resolveMoriLogMediaSourceOrigin(sourceOrigin) === "device_video"
      ? LOG_HOUSE_HITOYASUMI_ITEM_FRAME_EISHAKI_SRC
      : LOG_HOUSE_HITOYASUMI_ITEM_FRAME_MOVIE_SRC;
  }
  return LOG_HOUSE_HITOYASUMI_ITEM_FRAME_CARD_SRC;
}

/** 一覧サムネの写真枠（下の破線より上）。札は別レイヤーで前面に重ねる */
const HITOYASUMI_THUMB_WINDOW =
  "absolute inset-x-[11%] top-[13.5%] bottom-[32%] z-[1] overflow-hidden rounded-[0.65rem] bg-[#efe6d6]/55";

const HITOYASUMI_THUMB_META =
  "absolute inset-x-[11%] bottom-[7%] top-[72%] z-[1] pr-[26%]";

/** 枠画像の上端だけ前面に重ね、「カード／ムービー」札をサムネで隠さない */
const HITOYASUMI_THUMB_BADGE_CLIP = "inset(0 0 81% 0)";

/** 紙カード枠の明るさを揃える */
const HITOYASUMI_ASSET_TONE =
  "brightness-[0.9] contrast-[0.97] saturate-[0.94]";

const ENTRY_ICON_TONE =
  "drop-shadow-[0_8px_18px_rgba(20,12,8,0.24)] brightness-[0.98] contrast-[0.98] saturate-[0.96]";

/** 未解放の「音のかけら」：グレーではなく、部屋に溶ける薄いアイボリー調 */
const ENTRY_ICON_LOCKED_TONE =
  "drop-shadow-[0_6px_14px_rgba(40,28,16,0.12)] opacity-[0.42] brightness-[1.12] saturate-[0.62] contrast-[0.92]";

/** Music風：長丸の中にアイコン＋短いラベル */
const CHROME_NAV_PILL_CLASS =
  "inline-flex items-stretch gap-0.5 rounded-full border px-1 py-1 backdrop-blur-[3px] shadow-sm";

const CHROME_NAV_ITEM_CLASS =
  "inline-flex min-w-[3.35rem] flex-col items-center justify-center gap-0.5 rounded-full px-2.5 py-1.5 transition active:scale-[0.98] hover:bg-black/[0.04]";

function ChromeBackIcon({
  src,
  alt = "",
}: {
  src: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-5 w-5 object-contain" draggable={false} />
  );
}

function EntranceIconButton({
  src,
  label,
  onClick,
  disabled = false,
}: {
  src: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const sharedClass = [
    "relative w-full touch-manipulation transition duration-300 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5b089]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
    disabled
      ? "cursor-default"
      : "hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]",
  ].join(" ");

  const body = (
    <span className="relative mx-auto block w-full max-w-[13.5rem]">
      <Image
        src={src}
        alt=""
        width={480}
        height={480}
        className={`h-auto w-full object-contain ${disabled ? ENTRY_ICON_LOCKED_TONE : ENTRY_ICON_TONE}`}
        sizes="(max-width: 768px) 48vw, 220px"
        unoptimized
      />
    </span>
  );

  if (disabled) {
    return (
      <div
        role="img"
        aria-label={`${label}（準備中）`}
        title="準備中"
        className={sharedClass}
      >
        {body}
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} className={sharedClass}>
      {body}
    </button>
  );
}

export function HitoyasumiChairPageClient({
  profileId,
  initialScreen = "entrance",
  initialDraftId = null,
  forceDecorationVariant = null,
  timeOfDayOverride,
  backHref = "/orders",
  fillParent = false,
}: Props) {
  const helpTitleId = useId();
  const albumTitleId = useId();
  const { timeOfDay: themeTimeOfDay } = useLogHouseRoomTimeTheme();
  const timeOfDay = timeOfDayOverride ?? themeTimeOfDay;
  const ambientBg = timeOfDay === "night" ? "#1a120c" : "#ebe4d4";
  const chromeButtonClass =
    timeOfDay === "night"
      ? "border-stone-200/40 bg-[#fffdf9]/85 text-stone-800 shadow-md hover:bg-[#fffdf9]/95"
      : "border-[#d9cbb8]/90 bg-[#fffdf8]/90 text-[#5c4a3a] shadow-sm hover:bg-[#fffdf8]";

  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [items, setItems] = useState<MoriLogMedia[]>([]);
  const [loading, setLoading] = useState(false);

  // プレビューの URL 切替など、initialScreen が変わったときに同期する
  useEffect(() => {
    setScreen(initialScreen);
  }, [initialScreen]);
  const [filter, setFilter] = useState<HitoyasumiMediaFilter>("all");
  const [browseYear, setBrowseYear] = useState<number | null>(null);
  const [browseMonth, setBrowseMonth] = useState<number | null>(null);
  const [albumMode, setAlbumMode] = useState<AlbumMode>("shelf");
  const [albums, setAlbums] = useState<MoriLogAlbum[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumTypeFilter, setAlbumTypeFilter] = useState<HitoyasumiMediaFilter>("all");
  const [albumSelectedTags, setAlbumSelectedTags] = useState<string[]>([]);
  const [albumCheckedIds, setAlbumCheckedIds] = useState<string[]>([]);
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumSaveNote, setAlbumSaveNote] = useState<string | null>(null);
  const [albumSaveBusy, setAlbumSaveBusy] = useState(false);
  const [viewingAlbum, setViewingAlbum] = useState<MoriLogAlbum | null>(null);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  /** thumb が video/* なら true。ムービーでもポスター画像だけの場合あり */
  const [thumbIsVideo, setThumbIsVideo] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [detailActionNote, setDetailActionNote] = useState<string | null>(null);
  const [detailActionBusy, setDetailActionBusy] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [browseCheckedIds, setBrowseCheckedIds] = useState<string[]>([]);
  const [albumShelfCheckedIds, setAlbumShelfCheckedIds] = useState<string[]>([]);
  const [batchDelete, setBatchDelete] = useState<BatchDeleteState | null>(null);
  const [batchDeleteBusy, setBatchDeleteBusy] = useState(false);
  const [batchDeleteNote, setBatchDeleteNote] = useState<string | null>(null);
  const [pendingDeviceMovies, setPendingDeviceMovies] = useState<MoriLogMedia[]>([]);
  const [pendingRetryBusy, setPendingRetryBusy] = useState(false);
  const [pendingRetryNote, setPendingRetryNote] = useState<string | null>(null);
  const pendingAutoTriedRef = useRef(false);

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

  const refreshAlbums = useCallback(async () => {
    setAlbumsLoading(true);
    try {
      const list = await getMoriLogAlbumStore().list(profileId);
      setAlbums(list);
    } catch {
      setAlbums([]);
    } finally {
      setAlbumsLoading(false);
    }
  }, [profileId]);

  const refreshPendingDeviceMovies = useCallback(async () => {
    try {
      const list = await listPendingDeviceMovieMedia(profileId);
      setPendingDeviceMovies(list);
    } catch {
      setPendingDeviceMovies([]);
    }
  }, [profileId]);

  const retryPendingDeviceMovie = useCallback(
    async (media: MoriLogMedia) => {
      if (pendingRetryBusy) return;
      setPendingRetryBusy(true);
      setPendingRetryNote(null);
      try {
        const outcome = await confirmMoriLogDeviceMovieOnServer({
          profileId,
          mediaId: media.id,
        });
        if (outcome.kind === "ok") {
          await setDeviceMovieBillingStatus({
            mediaId: media.id,
            profileId,
            billingStatus: "confirmed",
          });
          writeDonguriBalanceHint(profileId, outcome.data.balance);
          setPendingRetryNote("森ログムービーの完成を確認できました。");
          await refresh();
          await refreshPendingDeviceMovies();
          return;
        }
        if (outcome.kind === "insufficient" || outcome.kind === "clear_failure") {
          await discardPendingDeviceMovie({ mediaId: media.id, profileId });
          setPendingRetryNote(
            outcome.kind === "insufficient"
              ? "どんぐりが足りないため、仮保存を取り消しました。"
              : "確定できなかったため、仮保存を取り消しました。",
          );
          await refreshPendingDeviceMovies();
          return;
        }
        setPendingRetryNote("通信状態が不明です。もう一度お試しください。");
      } catch {
        setPendingRetryNote("確認に失敗しました。");
      } finally {
        setPendingRetryBusy(false);
      }
    },
    [pendingRetryBusy, profileId, refresh, refreshPendingDeviceMovies],
  );

  useEffect(() => {
    void refreshPendingDeviceMovies();
  }, [refreshPendingDeviceMovies, screen]);

  /** 起動時に一度だけ pending を再試行（無制限ループはしない） */
  useEffect(() => {
    if (pendingAutoTriedRef.current) return;
    pendingAutoTriedRef.current = true;
    void (async () => {
      const list = await listPendingDeviceMovieMedia(profileId);
      if (list.length === 0) return;
      setPendingDeviceMovies(list);
      const first = list[0];
      if (!first) return;
      const outcome = await confirmMoriLogDeviceMovieOnServer({
        profileId,
        mediaId: first.id,
      });
      if (outcome.kind === "ok") {
        await setDeviceMovieBillingStatus({
          mediaId: first.id,
          profileId,
          billingStatus: "confirmed",
        });
        writeDonguriBalanceHint(profileId, outcome.data.balance);
        await refresh();
      } else if (outcome.kind === "insufficient" || outcome.kind === "clear_failure") {
        await discardPendingDeviceMovie({ mediaId: first.id, profileId });
      }
      await refreshPendingDeviceMovies();
    })();
  }, [profileId, refresh, refreshPendingDeviceMovies]);

  useEffect(() => {
    if (screen !== "browse" && screen !== "album") return;
    void refresh();
  }, [refresh, screen]);

  useEffect(() => {
    if (screen !== "album") return;
    void refreshAlbums();
  }, [refreshAlbums, screen]);

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
    if (!helpOpen && !deleteConfirmOpen && !batchDelete) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setHelpOpen(false);
      setDeleteConfirmOpen(false);
      if (!batchDeleteBusy) {
        setBatchDelete(null);
        setBatchDeleteNote(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [batchDelete, batchDeleteBusy, deleteConfirmOpen, helpOpen]);

  const visible = useMemo(() => {
    const byType = filterHitoyasumiMedia(items, filter);
    return filterHitoyasumiMediaByYearMonth(byType, browseYear, browseMonth);
  }, [browseMonth, browseYear, filter, items]);

  const browseYears = useMemo(() => journalListYearOptions(), []);

  const itemsById = useMemo(() => {
    const map = new Map<string, MoriLogMedia>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  const albumTagOptions = useMemo(() => collectHitoyasumiTags(items), [items]);

  const albumCandidates = useMemo(() => {
    const byType = filterHitoyasumiMedia(items, albumTypeFilter);
    return filterHitoyasumiMediaByTags(byType, albumSelectedTags);
  }, [albumSelectedTags, albumTypeFilter, items]);

  const albumCandidateIdSet = useMemo(
    () => new Set(albumCandidates.map((item) => item.id)),
    [albumCandidates],
  );

  const albumVisibleSelectedCount = useMemo(
    () => albumCheckedIds.filter((id) => albumCandidateIdSet.has(id)).length,
    [albumCandidateIdSet, albumCheckedIds],
  );

  const albumAllVisibleSelected =
    albumCandidates.length > 0 && albumVisibleSelectedCount === albumCandidates.length;

  const viewingAlbumPages = useMemo(() => {
    if (!viewingAlbum) return [];
    const pages: MoriLogMedia[] = [];
    for (const id of viewingAlbum.mediaIds) {
      const item = itemsById.get(id);
      if (item) pages.push(item);
    }
    return pages;
  }, [itemsById, viewingAlbum]);

  const openBrowse = useCallback(() => {
    setFilter("all");
    setBrowseCheckedIds([]);
    setBatchDeleteNote(null);
    setScreen("browse");
  }, []);

  const openAlbum = useCallback(() => {
    setAlbumMode("shelf");
    setAlbumTypeFilter("all");
    setAlbumSelectedTags([]);
    setAlbumCheckedIds([]);
    setAlbumShelfCheckedIds([]);
    setAlbumTitle("");
    setAlbumSaveNote(null);
    setBatchDeleteNote(null);
    setViewingAlbum(null);
    setScreen("album");
  }, []);

  const openMovieCompose = useCallback(() => {
    setScreen("movie_compose");
  }, []);

  const openAlbumCompose = useCallback(() => {
    setAlbumTypeFilter("all");
    setAlbumSelectedTags([]);
    setAlbumCheckedIds([]);
    setAlbumTitle("");
    setAlbumSaveNote(null);
    setAlbumMode("compose");
  }, []);

  const backToAlbumShelf = useCallback(() => {
    setAlbumMode("shelf");
    setAlbumSaveNote(null);
    void refreshAlbums();
  }, [refreshAlbums]);

  const toggleAlbumTag = useCallback((tag: string) => {
    setAlbumSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const toggleAlbumChecked = useCallback((id: string) => {
    setAlbumCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectAllAlbumVisible = useCallback(() => {
    setAlbumCheckedIds((prev) => {
      const next = new Set(prev);
      for (const item of albumCandidates) next.add(item.id);
      return [...next];
    });
  }, [albumCandidates]);

  const deselectAlbumVisible = useCallback(() => {
    setAlbumCheckedIds((prev) => prev.filter((id) => !albumCandidateIdSet.has(id)));
  }, [albumCandidateIdSet]);

  const openDetail = useCallback(async (item: MoriLogMedia) => {
    const [blob, posterBlob] = await Promise.all([
      getMoriLogMediaBlob(item.id),
      isMoriLogCardMovieType(item.type)
        ? getMoriLogMediaPosterBlob(item.id)
        : Promise.resolve(null),
    ]);
    const objectUrl = blob ? URL.createObjectURL(blob) : null;
    const posterUrl =
      posterBlob && posterBlob.size > 0 ? URL.createObjectURL(posterBlob) : null;
    setDetailActionNote(null);
    setDeleteConfirmOpen(false);
    setViewingAlbum(null);
    setDetail((prev) => {
      if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      if (prev?.posterUrl) URL.revokeObjectURL(prev.posterUrl);
      return {
        item,
        objectUrl,
        posterUrl,
        blob: blob ?? null,
        blobMimeType: blob?.type ?? null,
      };
    });
  }, []);

  const closeDetail = useCallback(() => {
    setDetailActionNote(null);
    setDetailActionBusy(false);
    setDeleteConfirmOpen(false);
    setDetail((prev) => {
      if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      if (prev?.posterUrl) URL.revokeObjectURL(prev.posterUrl);
      return null;
    });
  }, []);

  const openAlbumViewer = useCallback(
    (album: MoriLogAlbum) => {
      setDetailActionNote(null);
      setDeleteConfirmOpen(false);
      setDetail((prev) => {
        if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
        if (prev?.posterUrl) URL.revokeObjectURL(prev.posterUrl);
        return null;
      });
      setViewingAlbum(album);
    },
    [],
  );

  const closeAlbumViewer = useCallback(() => {
    setViewingAlbum(null);
    setAlbumMode("shelf");
    void refreshAlbums();
  }, [refreshAlbums]);

  const requestAlbumDelete = useCallback((album: MoriLogAlbum) => {
    setBatchDeleteNote(null);
    setBatchDelete({ kind: "album", ids: [album.id] });
  }, []);

  const cancelBatchDelete = useCallback(() => {
    if (batchDeleteBusy) return;
    setBatchDelete(null);
    setBatchDeleteNote(null);
  }, [batchDeleteBusy]);

  const toggleBrowseChecked = useCallback((id: string) => {
    setBrowseCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleAlbumShelfChecked = useCallback((id: string) => {
    setAlbumShelfCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const requestBrowseBatchDelete = useCallback(() => {
    if (browseCheckedIds.length === 0) {
      setBatchDeleteNote(LOG_HOUSE_HITOYASUMI_BATCH_DELETE_NEED_SELECTION);
      return;
    }
    setBatchDeleteNote(null);
    setBatchDelete({ kind: "media", ids: [...browseCheckedIds] });
  }, [browseCheckedIds]);

  const requestAlbumShelfBatchDelete = useCallback(() => {
    if (albumShelfCheckedIds.length === 0) {
      setBatchDeleteNote(LOG_HOUSE_HITOYASUMI_BATCH_DELETE_NEED_SELECTION);
      return;
    }
    setBatchDeleteNote(null);
    setBatchDelete({ kind: "album", ids: [...albumShelfCheckedIds] });
  }, [albumShelfCheckedIds]);

  const confirmBatchDelete = useCallback(async () => {
    if (!batchDelete || batchDeleteBusy) return;
    setBatchDeleteBusy(true);
    setBatchDeleteNote(null);
    try {
      if (batchDelete.kind === "album") {
        const store = getMoriLogAlbumStore();
        for (const id of batchDelete.ids) {
          await store.remove(id, profileId);
        }
        if (viewingAlbum && batchDelete.ids.includes(viewingAlbum.id)) {
          setViewingAlbum(null);
          setAlbumMode("shelf");
        }
        setAlbumShelfCheckedIds((prev) => prev.filter((id) => !batchDelete.ids.includes(id)));
        await refreshAlbums();
      } else {
        const store = getMoriLogMediaStore();
        for (const id of batchDelete.ids) {
          await store.remove(id, profileId);
          await removeMoriLogMediaBlob(id);
        }
        setBrowseCheckedIds((prev) => prev.filter((id) => !batchDelete.ids.includes(id)));
        if (detail && batchDelete.ids.includes(detail.item.id)) {
          closeDetail();
        }
        await refresh();
      }
      setBatchDelete(null);
    } catch {
      setBatchDeleteNote(
        batchDelete.kind === "album"
          ? LOG_HOUSE_HITOYASUMI_ALBUM_DELETE_FAIL
          : LOG_HOUSE_HITOYASUMI_DELETE_FAIL,
      );
    } finally {
      setBatchDeleteBusy(false);
    }
  }, [
    batchDelete,
    batchDeleteBusy,
    closeDetail,
    detail,
    profileId,
    refresh,
    refreshAlbums,
    viewingAlbum,
  ]);

  const tryAlbumSave = useCallback(async () => {
    // iOS: タイトル入力のキーボードが開いていると、最初のタップが blur だけになることがある
    if (typeof document !== "undefined") {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    }

    // 選択順をそのまま使う（表示中フィルタで落とさない）
    const selected = albumCheckedIds.filter(Boolean);
    if (selected.length === 0) {
      setAlbumSaveNote(LOG_HOUSE_HITOYASUMI_ALBUM_SAVE_NEED_SELECTION);
      return;
    }
    if (albumSaveBusy) return;

    setAlbumSaveBusy(true);
    setAlbumSaveNote("まとめています…");
    try {
      const coverId = selected[0]!;
      const coverItem =
        itemsById.get(coverId) ?? albumCandidates.find((item) => item.id === coverId);
      const coverType =
        coverItem && isMoriLogCardMovieType(coverItem.type) ? "card_movie" : "card_image";
      const title = albumTitle.trim() || defaultMoriLogAlbumTitle();
      const saved = await getMoriLogAlbumStore().upsert({
        profileId,
        title,
        mediaIds: selected,
        coverMediaId: coverId,
        coverType,
      });
      await refreshAlbums();
      // 一覧に戻してからビューワーを開く（閉じたら棚が見える）
      setAlbumMode("shelf");
      setAlbumCheckedIds([]);
      setAlbumTitle("");
      setAlbumSaveNote(null);
      setViewingAlbum(saved);
    } catch (err) {
      console.error("[hitoyasumi] album save failed", err);
      setAlbumSaveNote(LOG_HOUSE_HITOYASUMI_ALBUM_SAVE_FAIL);
    } finally {
      setAlbumSaveBusy(false);
    }
  }, [
    albumCandidates,
    albumCheckedIds,
    albumSaveBusy,
    albumTitle,
    itemsById,
    profileId,
    refreshAlbums,
  ]);

  const backToEntrance = useCallback(() => {
    closeDetail();
    setViewingAlbum(null);
    setScreen("entrance");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("view")) {
        url.searchParams.delete("view");
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      }
    }
  }, [closeDetail]);

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

  const typeChipClass = (active: boolean) =>
    [
      "inline-flex min-h-[36px] flex-1 items-center justify-center rounded-full border px-3 text-xs font-medium transition",
      active
        ? "border-[#c5b089]/90 bg-[#fffaf2]/92 text-[#3f3428] shadow-sm"
        : "border-[#fffaf2]/35 bg-[#2a2018]/28 text-[#fffaf2] backdrop-blur-[2px] hover:bg-[#2a2018]/4",
    ].join(" ");

  const selectBrowseFilter = useCallback((next: HitoyasumiMediaFilter) => {
    setFilter(next);
  }, []);

  const selectBrowseYear = useCallback((raw: string) => {
    if (raw === "") {
      setBrowseYear(null);
      setBrowseMonth(null);
      return;
    }
    const year = Number(raw);
    if (!Number.isFinite(year)) return;
    setBrowseYear(year);
  }, []);

  const selectBrowseMonth = useCallback((raw: string) => {
    if (raw === "") {
      setBrowseMonth(null);
      return;
    }
    const month = Number(raw);
    if (!Number.isFinite(month) || month < 1 || month > 12) return;
    setBrowseMonth(month);
  }, []);

  const browseIsEmpty = !loading && items.length === 0;
  const showLoghouseOnlyChrome = screen === "entrance" || (screen === "browse" && browseIsEmpty);
  const showSubScreenDualNav =
    (screen === "browse" && !browseIsEmpty) || screen === "album" || screen === "movie_compose";
  const hideHelpOnCompose = screen === "movie_compose";

  const shellMinClass = fillParent ? "h-full min-h-full" : "min-h-[100dvh]";

  return (
    <div
      className={`relative overflow-x-hidden text-[#3f3428] [touch-action:manipulation] ${shellMinClass}`}
      style={{ backgroundColor: ambientBg }}
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        {(["day", "night"] as const).map((id) => (
          <Image
            key={id}
            src={LOG_HOUSE_HITOYASUMI_BG_BY_TIME[id]}
            alt=""
            fill
            priority={id === timeOfDay}
            sizes="100vw"
            className={[
              "object-cover object-center transition-opacity duration-700 ease-in-out",
              timeOfDay === id ? "opacity-100" : "opacity-0",
            ].join(" ")}
            unoptimized
          />
        ))}
      </div>

      <div
        className={`relative z-10 mx-auto flex w-full max-w-md flex-col px-3 pb-8 pt-4 sm:px-4 ${shellMinClass}`}
      >
        <div className="flex items-start justify-between gap-3">
          <nav
            aria-label="場所を移る"
            className={`${CHROME_NAV_PILL_CLASS} ${chromeButtonClass}`}
          >
            {showLoghouseOnlyChrome ? (
              <Link
                href={backHref}
                aria-label={LOG_HOUSE_RETURN_TO_LABEL}
                title={LOG_HOUSE_RETURN_TO_LABEL}
                className={CHROME_NAV_ITEM_CLASS}
              >
                <ChromeBackIcon src={LOG_HOUSE_HITOYASUMI_ICON_BACK_LOGHOUSE_SRC} />
                <span className="text-[9px] font-semibold leading-none tracking-[0.02em]">
                  {LOG_HOUSE_HITOYASUMI_NAV_LOGHOUSE_LABEL}
                </span>
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={backToEntrance}
                  aria-label={LOG_HOUSE_HITOYASUMI_BACK_TO_ENTRANCE}
                  title={LOG_HOUSE_HITOYASUMI_BACK_TO_ENTRANCE}
                  className={CHROME_NAV_ITEM_CLASS}
                >
                  <ChromeBackIcon src={LOG_HOUSE_HITOYASUMI_ICON_BACK_CHAIR_SRC} />
                  <span className="text-[9px] font-semibold leading-none tracking-[0.02em]">
                    {LOG_HOUSE_HITOYASUMI_NAV_CHAIR_LABEL}
                  </span>
                </button>
                {showSubScreenDualNav ? (
                  <Link
                    href={backHref}
                    aria-label={LOG_HOUSE_RETURN_TO_LABEL}
                    title={LOG_HOUSE_RETURN_TO_LABEL}
                    className={CHROME_NAV_ITEM_CLASS}
                  >
                    <ChromeBackIcon src={LOG_HOUSE_HITOYASUMI_ICON_BACK_LOGHOUSE_SRC} />
                    <span className="text-[9px] font-semibold leading-none tracking-[0.02em]">
                      {LOG_HOUSE_HITOYASUMI_NAV_LOGHOUSE_LABEL}
                    </span>
                  </Link>
                ) : null}
              </>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            {screen === "browse" ? (
              <button
                type="button"
                onClick={requestBrowseBatchDelete}
                aria-label={LOG_HOUSE_HITOYASUMI_BATCH_DELETE_ARIA}
                title={LOG_HOUSE_HITOYASUMI_BATCH_DELETE_ARIA}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-[3px] transition active:scale-[0.98] ${chromeButtonClass}`}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            ) : null}
            {!hideHelpOnCompose ? (
              <button
                type="button"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-[3px] transition active:scale-[0.98] ${chromeButtonClass}`}
                aria-label={LOG_HOUSE_HITOYASUMI_HELP_BUTTON_LABEL}
                title={LOG_HOUSE_HITOYASUMI_HELP_BUTTON_LABEL}
                aria-haspopup="dialog"
                aria-expanded={helpOpen}
                onClick={() => setHelpOpen(true)}
              >
                <HelpHintIcon />
              </button>
            ) : null}
          </div>
        </div>

        {screen === "entrance" ? (
          <div
            className="mx-auto flex w-full flex-1 flex-col justify-center px-0 py-1"
            aria-label="ひとやすみの椅子の入口"
          >
            {pendingDeviceMovies.length > 0 ? (
              <div className="mx-auto mb-4 w-full max-w-[26rem] rounded-2xl border border-[#e4d5c0]/80 bg-[#fffaf2]/92 px-3 py-3 text-[#3f3428] shadow-sm">
                <p className="text-xs leading-relaxed">{DEVICE_MOVIE_PENDING_BANNER}</p>
                {pendingRetryNote ? (
                  <p className="mt-2 text-[11px] text-[#6a5846]">{pendingRetryNote}</p>
                ) : null}
                <button
                  type="button"
                  disabled={pendingRetryBusy}
                  onClick={() => {
                    const first = pendingDeviceMovies[0];
                    if (first) void retryPendingDeviceMovie(first);
                  }}
                  className="mt-3 min-h-10 w-full rounded-xl bg-[#3f5f4c] px-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {pendingRetryBusy ? DEVICE_MOVIE_CONFIRMING : DEVICE_MOVIE_PENDING_RETRY}
                </button>
              </div>
            ) : null}
            {/* サンプル準拠の 2×2。アイコンを大きく・中央に */}
            <div className="mx-auto grid w-full max-w-[26rem] grid-cols-2 gap-x-1 gap-y-5 sm:gap-y-6">
              <EntranceIconButton
                src={LOG_HOUSE_HITOYASUMI_ENTRY_CARD_SRC}
                label={LOG_HOUSE_HITOYASUMI_ENTRY_CARD_LABEL}
                onClick={openBrowse}
              />
              <EntranceIconButton
                src={LOG_HOUSE_HITOYASUMI_ENTRY_MOVIE_SRC}
                label={LOG_HOUSE_HITOYASUMI_ENTRY_MOVIE_LABEL}
                onClick={openMovieCompose}
              />
              <EntranceIconButton
                src={LOG_HOUSE_HITOYASUMI_ENTRY_ALBUM_SRC}
                label={LOG_HOUSE_HITOYASUMI_ENTRY_ALBUM_LABEL}
                onClick={openAlbum}
              />
              <EntranceIconButton
                src={LOG_HOUSE_HITOYASUMI_ENTRY_SOUND_SRC}
                label={LOG_HOUSE_HITOYASUMI_ENTRY_SOUND_LABEL}
                disabled
              />
            </div>
          </div>
        ) : screen === "browse" ? (
          <>
            <div className="mt-4" role="tablist" aria-label={LOG_HOUSE_HITOYASUMI_FILTER_BAR_LABEL}>
              <p className="mb-2 text-[11px] font-medium text-[#fffaf2]/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                {LOG_HOUSE_HITOYASUMI_FILTER_BAR_LABEL}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === "all"}
                  className={typeChipClass(filter === "all")}
                  onClick={() => selectBrowseFilter("all")}
                >
                  {LOG_HOUSE_HITOYASUMI_FILTER_ALL}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === "card_image"}
                  className={typeChipClass(filter === "card_image")}
                  onClick={() => selectBrowseFilter("card_image")}
                >
                  {LOG_HOUSE_HITOYASUMI_FILTER_STILL}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === "card_movie"}
                  className={typeChipClass(filter === "card_movie")}
                  onClick={() => selectBrowseFilter("card_movie")}
                >
                  {LOG_HOUSE_HITOYASUMI_FILTER_VIDEO}
                </button>
              </div>

              <div className="mt-3">
                <p className="mb-2 text-[11px] font-medium text-[#fffaf2]/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                  {LOG_HOUSE_HITOYASUMI_DATE_FILTER_LABEL}
                </p>
                <div className="flex items-center gap-2">
                  <label className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="sr-only">{LOG_HOUSE_HITOYASUMI_DATE_FILTER_YEAR}</span>
                    <select
                      value={browseYear == null ? "" : String(browseYear)}
                      onChange={(e) => selectBrowseYear(e.target.value)}
                      className="min-h-10 w-full rounded-full border border-[#e4d5c0]/80 bg-[#fffaf2]/92 px-3 text-sm font-medium text-[#3f3428] shadow-sm outline-none backdrop-blur-[2px]"
                      aria-label={LOG_HOUSE_HITOYASUMI_DATE_FILTER_YEAR}
                    >
                      <option value="">{LOG_HOUSE_HITOYASUMI_DATE_FILTER_YEAR}</option>
                      {browseYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                          {LOG_HOUSE_HITOYASUMI_DATE_FILTER_YEAR}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="sr-only">{LOG_HOUSE_HITOYASUMI_DATE_FILTER_MONTH}</span>
                    <select
                      value={browseMonth == null ? "" : String(browseMonth)}
                      onChange={(e) => selectBrowseMonth(e.target.value)}
                      disabled={browseYear == null}
                      className="min-h-10 w-full rounded-full border border-[#e4d5c0]/80 bg-[#fffaf2]/92 px-3 text-sm font-medium text-[#3f3428] shadow-sm outline-none backdrop-blur-[2px] disabled:cursor-not-allowed disabled:opacity-55"
                      aria-label={LOG_HOUSE_HITOYASUMI_DATE_FILTER_MONTH}
                    >
                      <option value="">{LOG_HOUSE_HITOYASUMI_DATE_FILTER_MONTH}</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>
                          {month}
                          {LOG_HOUSE_HITOYASUMI_DATE_FILTER_MONTH}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {browseCheckedIds.length > 0 ? (
                <p className="mt-2 text-center text-[11px] font-medium text-[#fffaf2]/9 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                  {LOG_HOUSE_HITOYASUMI_ALBUM_SELECTED_COUNT(browseCheckedIds.length)}
                </p>
              ) : null}
              {batchDeleteNote && screen === "browse" && !batchDelete ? (
                <p className="mt-2 rounded-xl border border-[#e4d5c0] bg-[#fffaf2]/9 px-3 py-2 text-center text-xs text-[#8a4f3d]" role="status">
                  {batchDeleteNote}
                </p>
              ) : null}
            </div>

            {loading ? (
              <p className="mt-10 text-center text-sm text-[#fffaf2] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                読み込んでいます…
              </p>
            ) : visible.length === 0 ? (
              <div className="mt-8 rounded-[1.35rem] border border-[#e4d5c0]/75 bg-[#fffaf2]/82 px-5 py-8 text-center shadow-[0_12px_32px_rgba(40,28,16,0.16)] backdrop-blur-[2px]">
                {items.length === 0 ? (
                  <>
                    <p className="text-base font-semibold text-[#3f3428]">{LOG_HOUSE_HITOYASUMI_EMPTY_TITLE}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#6e5c48]">
                      {LOG_HOUSE_HITOYASUMI_EMPTY_BODY}
                    </p>
                    <Link
                      href={backHref}
                      className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c5b089]/70 bg-[#f3ead9]/90 px-4 text-sm font-semibold text-[#3f3428]"
                    >
                      ログハウスへ戻る
                    </Link>
                  </>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#6e5c48]">
                    {LOG_HOUSE_HITOYASUMI_FILTER_EMPTY}
                  </p>
                )}
              </div>
            ) : (
              <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
                {visible.map((item) => {
                  const thumb = thumbUrls[item.id];
                  const isMovie = isMoriLogCardMovieType(item.type);
                  const title = item.title?.trim() || hitoyasumiTemplateLabel(item.templateId);
                  return (
                    <li key={item.id}>
                      <div className="relative">
                        <label className="absolute right-[6%] top-[5.5%] z-20 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-[#1d3a2c]/55 shadow-[0_1px_4px_rgba(0,0,0,0.28)] backdrop-blur-[2px]">
                          <input
                            type="checkbox"
                            checked={browseCheckedIds.includes(item.id)}
                            onChange={() => toggleBrowseChecked(item.id)}
                            aria-label={`${title} を選択`}
                            className="h-4 w-4 accent-[#5f8f72]"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void openDetail(item)}
                          className="group relative block w-full text-left transition hover:-translate-y-0.5"
                          aria-label={`${hitoyasumiMediaTypeLabel(item.type, item.sourceOrigin)} ${title}`}
                        >
                          <div className="relative aspect-[819/1024] w-full">
                            <Image
                              src={hitoyasumiItemFrameSrc(item.type, item.sourceOrigin)}
                              alt=""
                              fill
                              sizes="(max-width: 768px) 46vw, 220px"
                              className={`pointer-events-none object-contain drop-shadow-[0_6px_14px_rgba(20,12,8,0.2)] ${HITOYASUMI_ASSET_TONE}`}
                            />

                            <div className={HITOYASUMI_THUMB_WINDOW}>
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

                            {/* 上端の種類札をサムネの手前に再描画 */}
                            <div
                              className="pointer-events-none absolute inset-0 z-[2]"
                              style={{ clipPath: HITOYASUMI_THUMB_BADGE_CLIP }}
                              aria-hidden
                            >
                              <Image
                                src={hitoyasumiItemFrameSrc(item.type, item.sourceOrigin)}
                                alt=""
                                fill
                                sizes="(max-width: 768px) 46vw, 220px"
                                className={`object-contain ${HITOYASUMI_ASSET_TONE}`}
                              />
                            </div>

                            <div className={HITOYASUMI_THUMB_META}>
                              <p className="truncate text-[11px] font-semibold leading-snug text-[#3f3428] sm:text-xs">
                                {title}
                              </p>
                              <p className="mt-0.5 truncate text-[9px] leading-snug text-[#8a7660] sm:text-[10px]">
                                {formatHitoyasumiCreatedAt(item.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-auto pt-10" aria-hidden />
          </>
        ) : screen === "movie_compose" ? (
          <HitoyasumiDeviceMovieComposer
            profileId={profileId}
            initialDraftId={initialDraftId}
            forceDecorationVariant={forceDecorationVariant}
            onClose={backToEntrance}
            onRefreshList={() => {
              void refresh();
              void refreshPendingDeviceMovies();
            }}
            onSaved={() => {
              setScreen("browse");
              void refresh();
              void refreshPendingDeviceMovies();
            }}
          />
        ) : albumMode === "shelf" ? (
          <>
            <div className="mt-4 rounded-[1.25rem] border border-[#e4d5c0]/75 bg-[#fffaf2]/88 px-4 py-4 shadow-[0_10px_28px_rgba(40,28,16,0.14)] backdrop-blur-[2px]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2
                    id={albumTitleId}
                    className="text-base font-semibold tracking-wide text-[#3f3428]"
                  >
                    {LOG_HOUSE_HITOYASUMI_ALBUM_SCREEN_TITLE}
                  </h2>
                  <p className="mt-2 text-sm text-[#6e5c48]">
                    {albumsLoading
                      ? "読み込んでいます…"
                      : albums.length === 0
                        ? LOG_HOUSE_HITOYASUMI_ALBUM_SHELF_EMPTY
                        : LOG_HOUSE_HITOYASUMI_ALBUM_SHELF_COUNT(albums.length)}
                  </p>
                </div>
                {albums.length > 0 ? (
                  <button
                    type="button"
                    onClick={requestAlbumShelfBatchDelete}
                    aria-label={LOG_HOUSE_HITOYASUMI_BATCH_DELETE_ARIA}
                    title={LOG_HOUSE_HITOYASUMI_BATCH_DELETE_ARIA}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c5b089]/80 bg-[#f7efe3] text-[#5c4a35] shadow-sm transition active:scale-[0.98] hover:bg-[#f3ead8]"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
              {albumShelfCheckedIds.length > 0 ? (
                <p className="mt-2 text-[11px] font-medium text-[#6e5c48]">
                  {LOG_HOUSE_HITOYASUMI_ALBUM_SELECTED_COUNT(albumShelfCheckedIds.length)}
                </p>
              ) : null}
              {batchDeleteNote && screen === "album" && albumMode === "shelf" && !batchDelete ? (
                <p className="mt-2 rounded-xl border border-[#e4d5c0] bg-[#fffaf2] px-3 py-2 text-xs text-[#8a4f3d]" role="status">
                  {batchDeleteNote}
                </p>
              ) : null}
              <button
                type="button"
                onClick={openAlbumCompose}
                className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-emerald-800 bg-emerald-800 px-4 text-sm font-medium text-white hover:bg-emerald-900"
              >
                {LOG_HOUSE_HITOYASUMI_ALBUM_COMPOSE_CTA}
              </button>
            </div>

            {albumsLoading ? null : albums.length === 0 ? null : (
              <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
                {albums.map((album) => {
                  const coverThumb = thumbUrls[album.coverMediaId];
                  const coverIsVideo = !!thumbIsVideo[album.coverMediaId];
                  const isMovieCover = album.coverType === "card_movie";
                  return (
                    <li key={album.id}>
                      <div className="relative">
                        <label className="absolute right-[6%] top-[5.5%] z-20 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-[#1d3a2c]/55 shadow-[0_1px_4px_rgba(0,0,0,0.28)] backdrop-blur-[2px]">
                          <input
                            type="checkbox"
                            checked={albumShelfCheckedIds.includes(album.id)}
                            onChange={() => toggleAlbumShelfChecked(album.id)}
                            aria-label={`${album.title} を選択`}
                            className="h-4 w-4 accent-[#5f8f72]"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => openAlbumViewer(album)}
                          aria-label={`${album.title}を開く`}
                          className="group relative block w-full text-left transition hover:-translate-y-0.5 active:scale-[0.98]"
                        >
                          <div className="relative aspect-[819/1024] w-full">
                            <Image
                              src={LOG_HOUSE_HITOYASUMI_ITEM_FRAME_ALBUM_SRC}
                              alt=""
                              fill
                              sizes="(max-width: 768px) 46vw, 220px"
                              className={`pointer-events-none object-contain drop-shadow-[0_6px_14px_rgba(20,12,8,0.2)] ${HITOYASUMI_ASSET_TONE}`}
                            />

                            <div className={HITOYASUMI_THUMB_WINDOW}>
                              {coverThumb ? (
                                isMovieCover && coverIsVideo ? (
                                  <video
                                    src={coverThumb}
                                    className="h-full w-full object-cover"
                                    muted
                                    playsInline
                                    preload="metadata"
                                  />
                                ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={coverThumb}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                )
                              ) : (
                                <div className="flex h-full items-center justify-center px-2 text-center text-[10px] leading-relaxed text-[#8a7660]">
                                  {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
                                </div>
                              )}
                            </div>

                            {/* 上端の「アルバム」札をサムネの手前に再描画（森ログ一覧と同じ） */}
                            <div
                              className="pointer-events-none absolute inset-0 z-[2]"
                              style={{ clipPath: HITOYASUMI_THUMB_BADGE_CLIP }}
                              aria-hidden
                            >
                              <Image
                                src={LOG_HOUSE_HITOYASUMI_ITEM_FRAME_ALBUM_SRC}
                                alt=""
                                fill
                                sizes="(max-width: 768px) 46vw, 220px"
                                className={`object-contain ${HITOYASUMI_ASSET_TONE}`}
                              />
                            </div>

                            <div className={HITOYASUMI_THUMB_META}>
                              <p className="truncate text-[11px] font-semibold leading-snug text-[#3f3428] sm:text-xs">
                                {album.title}
                              </p>
                              <p className="mt-0.5 truncate text-[9px] leading-snug text-[#8a7660] sm:text-[10px]">
                                {LOG_HOUSE_HITOYASUMI_ALBUM_ITEM_COUNT(album.mediaIds.length)}
                                {" · "}
                                {formatHitoyasumiCreatedAt(album.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-auto pt-10" aria-hidden />
          </>
        ) : (
          <>
            <div className="mt-4 rounded-[1.25rem] border border-[#e4d5c0]/75 bg-[#fffaf2]/88 px-4 py-4 shadow-[0_10px_28px_rgba(40,28,16,0.14)] backdrop-blur-[2px]">
              <div className="flex items-start justify-between gap-3">
                <h2
                  id={albumTitleId}
                  className="text-base font-semibold tracking-wide text-[#3f3428]"
                >
                  {LOG_HOUSE_HITOYASUMI_ALBUM_COMPOSE_TITLE}
                </h2>
                <button
                  type="button"
                  onClick={backToAlbumShelf}
                  className="shrink-0 rounded-lg border border-[#e0d2bc] bg-[#f7efe3] px-2.5 py-1.5 text-[11px] font-medium text-[#5c4a35]"
                >
                  {LOG_HOUSE_HITOYASUMI_ALBUM_BACK_TO_SHELF}
                </button>
              </div>

              <label className="mt-4 block text-xs font-medium text-[#6e5c48]">
                {LOG_HOUSE_HITOYASUMI_ALBUM_TITLE_LABEL}
                <input
                  type="text"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  placeholder={LOG_HOUSE_HITOYASUMI_ALBUM_TITLE_PLACEHOLDER}
                  className="mt-1.5 w-full rounded-xl border border-[#e0d2bc] bg-white px-3 py-2.5 text-[16px] leading-normal text-[#3f3428] outline-none focus:border-[#c5b089]"
                />
              </label>

              <div className="mt-4" role="tablist" aria-label={LOG_HOUSE_HITOYASUMI_FILTER_BAR_LABEL}>
                <p className="mb-2 text-xs font-medium text-[#6e5c48]">
                  {LOG_HOUSE_HITOYASUMI_FILTER_BAR_LABEL}
                </p>
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      ["all", LOG_HOUSE_HITOYASUMI_FILTER_ALL],
                      ["card_image", LOG_HOUSE_HITOYASUMI_FILTER_STILL],
                      ["card_movie", LOG_HOUSE_HITOYASUMI_FILTER_VIDEO],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={albumTypeFilter === id}
                      className={[
                        "inline-flex min-h-[36px] flex-1 items-center justify-center rounded-full border px-3 text-xs font-medium transition",
                        albumTypeFilter === id
                          ? "border-[#c5b089]/90 bg-[#f3ead9] text-[#3f3428]"
                          : "border-[#e0d2bc] bg-white text-[#6e5c48] hover:bg-[#faf3e8]",
                      ].join(" ")}
                      onClick={() => setAlbumTypeFilter(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-[#6e5c48]">
                  {LOG_HOUSE_HITOYASUMI_ALBUM_TAG_LABEL}
                </p>
                {albumTagOptions.length === 0 ? (
                  <p className="text-xs leading-relaxed text-[#8a7660]">
                    {LOG_HOUSE_HITOYASUMI_ALBUM_TAG_EMPTY}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {albumTagOptions.map((tag) => {
                      const active = albumSelectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleAlbumTag(tag)}
                          className={[
                            "inline-flex min-h-[32px] items-center rounded-full border px-2.5 text-[11px] font-medium transition",
                            active
                              ? "border-emerald-800/70 bg-emerald-800 text-white"
                              : "border-[#e0d2bc] bg-white text-[#5c4a35] hover:bg-[#faf3e8]",
                          ].join(" ")}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#3f3428]">
                  {LOG_HOUSE_HITOYASUMI_ALBUM_MATCH_COUNT(albumCandidates.length)}
                  {albumCandidates.length > 0 ? (
                    <span className="ml-2 text-xs font-normal text-[#6e5c48]">
                      {LOG_HOUSE_HITOYASUMI_ALBUM_SELECTED_COUNT(albumVisibleSelectedCount)}
                    </span>
                  ) : null}
                </p>
                {albumCandidates.length > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      albumAllVisibleSelected ? deselectAlbumVisible() : selectAllAlbumVisible()
                    }
                    className="inline-flex min-h-[36px] items-center rounded-full border border-[#c5b089]/80 bg-[#f3ead9] px-3 text-xs font-medium text-[#3f3428] transition hover:bg-[#ebe0cc]"
                  >
                    {albumAllVisibleSelected
                      ? LOG_HOUSE_HITOYASUMI_ALBUM_DESELECT_VISIBLE
                      : LOG_HOUSE_HITOYASUMI_ALBUM_SELECT_ALL}
                  </button>
                ) : null}
              </div>
            </div>

            {loading ? (
              <p className="mt-8 text-center text-sm text-[#fffaf2] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                読み込んでいます…
              </p>
            ) : albumCandidates.length === 0 ? (
              <div className="mt-5 rounded-[1.25rem] border border-[#e4d5c0]/75 bg-[#fffaf2]/82 px-4 py-6 text-center text-sm leading-relaxed text-[#6e5c48]">
                条件に合う森ログがありません。種類やタグを変えてみてください。
              </div>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
                {albumCandidates.map((item) => {
                  const thumb = thumbUrls[item.id];
                  const isMovie = isMoriLogCardMovieType(item.type);
                  const title = item.title?.trim() || hitoyasumiTemplateLabel(item.templateId);
                  const checked = albumCheckedIds.includes(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggleAlbumChecked(item.id)}
                        aria-pressed={checked}
                        aria-label={`${checked ? "選択解除" : "選択"}：${title}`}
                        className={[
                          "relative block w-full text-left transition",
                          checked ? "ring-2 ring-emerald-700/70 ring-offset-2 ring-offset-transparent" : "",
                        ].join(" ")}
                      >
                        <div className="relative aspect-[819/1024] w-full">
                          <Image
                            src={hitoyasumiItemFrameSrc(item.type, item.sourceOrigin)}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 46vw, 220px"
                            className={`pointer-events-none object-contain drop-shadow-[0_6px_14px_rgba(20,12,8,0.2)] ${HITOYASUMI_ASSET_TONE}`}
                          />
                          <div className={HITOYASUMI_THUMB_WINDOW}>
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
                              <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-[#8a7660]">
                                {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
                              </div>
                            )}
                          </div>
                          <div
                            className="pointer-events-none absolute inset-0 z-[2]"
                            style={{ clipPath: HITOYASUMI_THUMB_BADGE_CLIP }}
                            aria-hidden
                          >
                            <Image
                              src={hitoyasumiItemFrameSrc(item.type, item.sourceOrigin)}
                              alt=""
                              fill
                              sizes="(max-width: 768px) 46vw, 220px"
                              className={`object-contain ${HITOYASUMI_ASSET_TONE}`}
                            />
                          </div>
                          <span
                            className={[
                              "absolute right-[8%] top-[8%] z-[3] flex h-7 w-7 items-center justify-center rounded-md border-2 shadow-sm",
                              checked
                                ? "border-emerald-800 bg-emerald-800 text-white"
                                : "border-[#d9cbb8] bg-[#fffdf8]/95 text-transparent",
                            ].join(" ")}
                            aria-hidden
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <div className={HITOYASUMI_THUMB_META}>
                            <p className="truncate text-[11px] font-semibold text-[#3f3428]">{title}</p>
                            <p className="mt-0.5 truncate text-[9px] text-[#8a7660]">
                              {hitoyasumiMediaTypeLabel(item.type, item.sourceOrigin)}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-5 space-y-2 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
              {albumCheckedIds.length === 0 ? (
                <p className="rounded-xl border border-[#e4d5c0] bg-[#fffaf2]/95 px-3 py-2 text-center text-xs leading-relaxed text-[#6e5c48]">
                  {LOG_HOUSE_HITOYASUMI_ALBUM_SAVE_NEED_SELECTION}
                </p>
              ) : (
                <p className="text-center text-xs font-medium text-[#fffaf2] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                  {LOG_HOUSE_HITOYASUMI_ALBUM_SELECTED_COUNT(albumCheckedIds.length)}
                </p>
              )}
            </div>

            {/* 固定フッター：スクロール位置やキーボードに負けない */}
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
              <div className="pointer-events-auto mx-auto w-full max-w-md px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
                {albumSaveNote ? (
                  <p
                    className="mb-2 rounded-xl border border-[#e4d5c0] bg-[#fffaf2] px-3 py-2 text-center text-xs leading-relaxed text-[#5c4a35] shadow-md"
                    role="status"
                    aria-live="polite"
                  >
                    {albumSaveNote}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={albumSaveBusy}
                  onMouseDown={(e) => {
                    // iOS: 入力フォーカス中でも最初のタップで click が届くようにする
                    e.preventDefault();
                  }}
                  onClick={() => void tryAlbumSave()}
                  className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl border border-emerald-800 bg-emerald-800 px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(20,12,8,0.35)] hover:bg-emerald-900 active:scale-[0.99] disabled:opacity-60"
                >
                  {albumSaveBusy
                    ? "まとめています…"
                    : albumCheckedIds.length > 0
                      ? `${LOG_HOUSE_HITOYASUMI_ALBUM_SAVE}（${albumCheckedIds.length}）`
                      : LOG_HOUSE_HITOYASUMI_ALBUM_SAVE}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {viewingAlbum ? (
        <HitoyasumiAlbumViewer
          album={viewingAlbum}
          pages={viewingAlbumPages}
          onClose={closeAlbumViewer}
          onDelete={() => requestAlbumDelete(viewingAlbum)}
        />
      ) : null}

      {batchDelete ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1a120c]/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hitoyasumi-batch-delete-title"
          onClick={cancelBatchDelete}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#e4d5c0]/95 bg-[#fffaf2] px-5 py-5 shadow-[0_16px_40px_rgba(40,28,16,0.28)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="hitoyasumi-batch-delete-title"
              className="text-base font-semibold tracking-wide text-[#3f3428]"
            >
              {batchDelete.kind === "album"
                ? batchDelete.ids.length === 1
                  ? LOG_HOUSE_HITOYASUMI_ALBUM_DELETE_CONFIRM_TITLE
                  : LOG_HOUSE_HITOYASUMI_ALBUM_DELETE_CONFIRM_TITLE_MULTI(batchDelete.ids.length)
                : batchDelete.ids.length === 1
                  ? LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM_TITLE
                  : LOG_HOUSE_HITOYASUMI_MEDIA_DELETE_CONFIRM_TITLE_MULTI(batchDelete.ids.length)}
            </h2>
            {batchDelete.kind === "album" && batchDelete.ids.length === 1 ? (
              <p className="mt-2 text-sm font-medium text-[#5c4a35]">
                {albums.find((a) => a.id === batchDelete.ids[0])?.title ??
                  viewingAlbum?.title ??
                  ""}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-[#5c4a35]">
              {batchDelete.kind === "album"
                ? LOG_HOUSE_HITOYASUMI_ALBUM_DELETE_CONFIRM_BODY
                : LOG_HOUSE_HITOYASUMI_MEDIA_DELETE_CONFIRM_BODY}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={batchDeleteBusy}
                onClick={() => void confirmBatchDelete()}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#a45c48] bg-[#a45c48] px-4 text-sm font-medium text-white hover:bg-[#8f4f3e] disabled:opacity-60"
              >
                {batchDeleteBusy ? "削除しています…" : LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM}
              </button>
              <button
                type="button"
                disabled={batchDeleteBusy}
                onClick={cancelBatchDelete}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c4b49a] bg-[#faf3e8] px-4 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8] disabled:opacity-60"
              >
                {LOG_HOUSE_HITOYASUMI_DELETE_CANCEL}
              </button>
            </div>
            {batchDeleteNote ? (
              <p className="mt-3 text-xs text-[#8a4f3d]" role="status">
                {batchDeleteNote}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

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
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#4f4033]">
              {LOG_HOUSE_HITOYASUMI_HELP_BODY}
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

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#120c08]"
          role="dialog"
          aria-modal="true"
          aria-label={detail.item.title?.trim() || LOG_HOUSE_HITOYASUMI_PAGE_TITLE}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent px-3 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4">
            <div className="min-w-0 text-white">
              <p className="inline-flex rounded-md border border-white/25 bg-white/15 px-2 py-0.5 text-xs font-medium">
                {hitoyasumiMediaTypeLabel(detail.item.type, detail.item.sourceOrigin)}
              </p>
              <h2 className="mt-2 truncate text-lg font-semibold">
                {detail.item.title?.trim() || hitoyasumiTemplateLabel(detail.item.templateId)}
              </h2>
              <p className="mt-1 text-xs text-white/70">
                {formatHitoyasumiCreatedAt(detail.item.createdAt)} ·{" "}
                {hitoyasumiTemplateLabel(detail.item.templateId)}
              </p>
            </div>
            <button
              type="button"
              onClick={closeDetail}
              className="min-h-[40px] shrink-0 rounded-lg border border-white/30 bg-black/45 px-3 text-sm text-white"
            >
              {LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL}
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            {detail.objectUrl ? (
              isMoriLogCardMovieType(detail.item.type) &&
              (detail.blobMimeType ?? "").startsWith("video/") ? (
                <HitoyasumiSoftVideoPlayer
                  src={detail.objectUrl}
                  posterUrl={detail.posterUrl}
                  className="absolute inset-0 h-full w-full"
                  videoClassName="absolute inset-0 h-full w-full object-contain"
                  label="森ログムービーを再生"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.objectUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain"
                />
              )
            ) : (
              <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-[#d9cbb8]">
                {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
              </p>
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-white/10 bg-black/85 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
            {detail.blob ? (
              <>
                <p className="text-xs leading-relaxed text-white/70">
                  {LOG_HOUSE_HITOYASUMI_ACTION_HINT}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={detailActionBusy}
                    onClick={() => void saveDetailToDevice()}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-800 px-4 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
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
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-60"
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
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#d4b4a8]/70 bg-[#8a4f3d]/90 px-4 text-sm font-medium text-white hover:bg-[#8a4f3d] disabled:opacity-60"
            >
              {LOG_HOUSE_HITOYASUMI_DELETE}
            </button>
            {detailActionNote ? (
              <p className="text-xs leading-relaxed text-[#c8d4b8]" role="status">
                {detailActionNote}
              </p>
            ) : null}
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
