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
import { getMoriLogMediaBlob } from "@/lib/journal/moriLog/moriLogMediaBlobStore";
import { isMoriLogCardMovieType, type MoriLogMedia } from "@/lib/journal/moriLog/moriLogMedia";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";
import {
  LOG_HOUSE_HITOYASUMI_ALBUM_SOON_BODY,
  LOG_HOUSE_HITOYASUMI_ALBUM_SOON_TITLE,
  LOG_HOUSE_HITOYASUMI_BG_SRC,
  LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL,
  LOG_HOUSE_HITOYASUMI_EMPTY_BODY,
  LOG_HOUSE_HITOYASUMI_EMPTY_TITLE,
  LOG_HOUSE_HITOYASUMI_FILTER_ALL,
  LOG_HOUSE_HITOYASUMI_FILTER_ALBUM,
  LOG_HOUSE_HITOYASUMI_FILTER_ALBUM_SRC,
  LOG_HOUSE_HITOYASUMI_FILTER_CARD,
  LOG_HOUSE_HITOYASUMI_FILTER_CARD_SRC,
  LOG_HOUSE_HITOYASUMI_FILTER_MOVIE,
  LOG_HOUSE_HITOYASUMI_FILTER_MOVIE_SRC,
  LOG_HOUSE_HITOYASUMI_HELP_BUTTON_LABEL,
  LOG_HOUSE_HITOYASUMI_HELP_DISMISS,
  LOG_HOUSE_HITOYASUMI_NO_PREVIEW,
  LOG_HOUSE_HITOYASUMI_PAGE_DESCRIPTION,
  LOG_HOUSE_HITOYASUMI_PAGE_TITLE,
} from "@/lib/loghouse/logHouseHitoyasumiCopy";

type Props = {
  profileId: string;
};

type DetailState = {
  item: MoriLogMedia;
  objectUrl: string | null;
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

export function HitoyasumiChairPageClient({ profileId }: Props) {
  const helpTitleId = useId();
  const albumTitleId = useId();
  const [items, setItems] = useState<MoriLogMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HitoyasumiMediaFilter>("all");
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [albumSoonOpen, setAlbumSoonOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listHitoyasumiMedia(profileId);
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];

    void (async () => {
      const next: Record<string, string> = {};
      for (const item of items) {
        const blob = await getMoriLogMediaBlob(item.id);
        if (!blob || cancelled) continue;
        const url = URL.createObjectURL(blob);
        created.push(url);
        next[item.id] = url;
      }
      if (!cancelled) setThumbUrls(next);
    })();

    return () => {
      cancelled = true;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [items]);

  useEffect(() => {
    return () => {
      if (detail?.objectUrl) URL.revokeObjectURL(detail.objectUrl);
    };
  }, [detail]);

  useEffect(() => {
    if (!helpOpen && !albumSoonOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setHelpOpen(false);
      setAlbumSoonOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [albumSoonOpen, helpOpen]);

  const visible = useMemo(() => filterHitoyasumiMedia(items, filter), [filter, items]);

  const openDetail = useCallback(async (item: MoriLogMedia) => {
    const blob = await getMoriLogMediaBlob(item.id);
    const objectUrl = blob ? URL.createObjectURL(blob) : null;
    setDetail((prev) => {
      if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      return { item, objectUrl };
    });
  }, []);

  const closeDetail = useCallback(() => {
    setDetail((prev) => {
      if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
  }, []);

  const filterImageButtonClass = (active: boolean) =>
    [
      "relative flex w-[30%] max-w-[7.5rem] flex-col items-center justify-end rounded-2xl p-1 transition",
      active
        ? "bg-[#fffaf2]/35 ring-2 ring-[#c5b089]/75 shadow-[0_8px_20px_rgba(40,28,16,0.18)]"
        : "bg-transparent opacity-90 hover:bg-[#fffaf2]/18 hover:opacity-100",
    ].join(" ");

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
        <div className="absolute inset-0 bg-[#1a120c]/18" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a120c]/28 via-transparent to-[#1a120c]/42" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-16 pt-5 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href="/orders"
            className="inline-flex w-fit min-h-[40px] items-center rounded-full border border-[#e4d5c0]/45 bg-[#fffaf2]/38 px-3.5 text-sm text-[#4a3a28]/90 shadow-[0_3px_10px_rgba(40,28,16,0.1)] backdrop-blur-[3px] transition hover:bg-[#fffaf2]/55"
          >
            ← {LOG_HOUSE_RETURN_TO_LABEL}
          </Link>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e4d5c0]/45 bg-[#fffaf2]/42 text-[#5c4a3a] shadow-[0_3px_10px_rgba(40,28,16,0.1)] backdrop-blur-[3px] transition hover:bg-[#fffaf2]/60"
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
              onClick={() => setFilter("card_image")}
            >
              <Image
                src={LOG_HOUSE_HITOYASUMI_FILTER_CARD_SRC}
                alt=""
                width={480}
                height={480}
                className="h-auto w-full object-contain drop-shadow-[0_6px_12px_rgba(20,12,8,0.28)]"
              />
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={false}
              aria-label={`${LOG_HOUSE_HITOYASUMI_FILTER_ALBUM}（準備中）`}
              className={`${filterImageButtonClass(false)} opacity-80`}
              onClick={() => setAlbumSoonOpen(true)}
            >
              <Image
                src={LOG_HOUSE_HITOYASUMI_FILTER_ALBUM_SRC}
                alt=""
                width={480}
                height={480}
                className="h-auto w-full object-contain drop-shadow-[0_6px_12px_rgba(20,12,8,0.28)]"
              />
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filter === "card_movie"}
              aria-label={LOG_HOUSE_HITOYASUMI_FILTER_MOVIE}
              className={filterImageButtonClass(filter === "card_movie")}
              onClick={() => setFilter("card_movie")}
            >
              <Image
                src={LOG_HOUSE_HITOYASUMI_FILTER_MOVIE_SRC}
                alt=""
                width={480}
                height={480}
                className="h-auto w-full object-contain drop-shadow-[0_6px_12px_rgba(20,12,8,0.28)]"
              />
            </button>
          </div>

          <div className="mt-2 flex justify-center">
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              onClick={() => setFilter("all")}
              className={`min-h-[36px] rounded-full border px-3.5 text-xs transition ${
                filter === "all"
                  ? "border-[#c5b089]/70 bg-[#fffaf2]/55 font-semibold text-[#3f3428] shadow-sm backdrop-blur-[2px]"
                  : "border-[#e4d5c0]/35 bg-[#fffaf2]/28 text-[#5c4a35]/90 backdrop-blur-[2px] hover:bg-[#fffaf2]/45"
              }`}
            >
              {LOG_HOUSE_HITOYASUMI_FILTER_ALL}
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
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {visible.map((item) => {
              const thumb = thumbUrls[item.id];
              const isMovie = isMoriLogCardMovieType(item.type);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void openDetail(item)}
                    className="group flex w-full flex-col overflow-hidden rounded-[1.15rem] border border-[#e4d5c0]/90 bg-[#fffaf2]/88 text-left shadow-[0_8px_22px_rgba(40,28,16,0.14)] backdrop-blur-[1px] transition hover:-translate-y-0.5 hover:border-[#c5b089]/90 hover:shadow-[0_12px_28px_rgba(40,28,16,0.18)]"
                  >
                    <div className="relative aspect-[4/5] bg-[#efe4d4]">
                      {thumb ? (
                        isMovie ? (
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
                        <div className="flex h-full items-center justify-center px-3 text-center text-xs leading-relaxed text-[#8a7660]">
                          {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
                        </div>
                      )}
                      <span className="absolute left-2 top-2 rounded-md border border-[#e0d2bc]/90 bg-[#fffaf2]/92 px-2 py-0.5 text-[11px] font-medium text-[#5c4a35] shadow-sm">
                        {hitoyasumiMediaTypeLabel(item.type)}
                      </span>
                    </div>
                    <div className="space-y-1 border-t border-[#eadfce]/90 bg-[#fffaf2]/94 px-2.5 py-2.5">
                      <p className="truncate text-sm font-semibold text-[#3f3428]">
                        {item.title?.trim() || hitoyasumiTemplateLabel(item.templateId)}
                      </p>
                      <p className="truncate text-[11px] text-[#8a7660]">
                        {formatHitoyasumiCreatedAt(item.createdAt)}
                      </p>
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#1a120c]/55 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={detail.item.title?.trim() || LOG_HOUSE_HITOYASUMI_PAGE_TITLE}
          onClick={closeDetail}
        >
          <div
            className="max-h-[92dvh] w-full max-w-lg overflow-auto rounded-[1.35rem] border border-[#e4d5c0]/95 bg-[#fffaf2] p-3 shadow-[0_20px_50px_rgba(20,12,8,0.35)] sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex rounded-md border border-[#e0d2bc]/90 bg-[#f7efe3] px-2 py-0.5 text-xs font-medium text-[#5c4a35]">
                  {hitoyasumiMediaTypeLabel(detail.item.type)}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#3d3226]">
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

            {detail.objectUrl ? (
              isMoriLogCardMovieType(detail.item.type) ? (
                <video
                  src={detail.objectUrl}
                  className="mx-auto max-h-[70dvh] w-full rounded-xl bg-[#2a221a]"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.objectUrl}
                  alt=""
                  className="mx-auto max-h-[70dvh] w-full rounded-xl object-contain"
                />
              )
            ) : (
              <p className="rounded-xl border border-[#e0d2bc] bg-[#f7efe3] px-4 py-8 text-center text-sm leading-relaxed text-[#6e5c48]">
                {LOG_HOUSE_HITOYASUMI_NO_PREVIEW}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
